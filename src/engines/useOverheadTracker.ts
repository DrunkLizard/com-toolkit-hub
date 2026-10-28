import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Cadence = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type Overhead = {
  id: string;
  name: string;
  amount: number; // per cadence period
  category: string;
  cadence: Cadence;
};

export const CATEGORIES = ['Software', 'Apps & Plugins', 'Marketing', 'Payroll', 'Rent & Utilities', 'Shipping Supplies', 'Other'];

export const CADENCES: { id: Cadence; label: string; perMonth: number }[] = [
  { id: 'weekly', label: 'Weekly', perMonth: 52 / 12 },
  { id: 'monthly', label: 'Monthly', perMonth: 1 },
  { id: 'quarterly', label: 'Quarterly', perMonth: 1 / 3 },
  { id: 'yearly', label: 'Yearly', perMonth: 1 / 12 },
];

const KEY = 'toolkit:overhead:v1';

export const monthlyCost = (o: Overhead) =>
  o.amount * (CADENCES.find((c) => c.id === o.cadence)?.perMonth ?? 1);

export function useOverheadTracker() {
  const [items, setItems] = useState<Overhead[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: Overhead[]) => {
    setItems(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback(
    (draft: Omit<Overhead, 'id'>) => {
      const name = draft.name.trim();
      if (!name || !(draft.amount > 0)) return false;
      persist([{ ...draft, name, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...items]);
      return true;
    },
    [items, persist],
  );

  const remove = useCallback((id: string) => persist(items.filter((i) => i.id !== id)), [items, persist]);

  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let monthly = 0;
    for (const i of items) {
      const m = monthlyCost(i);
      monthly += m;
      byCategory[i.category] = (byCategory[i.category] ?? 0) + m;
    }
    return {
      monthly,
      yearly: monthly * 12,
      daily: (monthly * 12) / 365,
      byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    };
  }, [items]);

  return { items, loaded, add, remove, totals };
}
