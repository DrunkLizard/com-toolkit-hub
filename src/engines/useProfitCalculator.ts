import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'toolkit:profit:presets:v1';

export type VolumeMode = 'units' | 'conversion';

export type Inputs = {
  price: string;
  cogs: string;
  shippingCharged: string;
  shippingCost: string;
  feePercent: string;
  feeFixed: string;
  adSpend: string;
  volumeMode: VolumeMode;
  units: string;
  clicks: string;
  conversionRate: string;
};

export type Preset = { id: string; name: string; savedAt: number; inputs: Inputs };

export type Results = {
  revenuePerUnit: number;
  gatewayFeePerUnit: number;
  costPerUnit: number;
  profitPerUnit: number;
  units: number;
  totalRevenue: number;
  netProfit: number;
  netMargin: number;
  breakEvenRoas: number | null;
  targetCpa: number;
  actualRoas: number | null;
};

export const DEFAULT_INPUTS: Inputs = {
  price: '49.99',
  cogs: '15',
  shippingCharged: '5',
  shippingCost: '6',
  feePercent: '2.9',
  feeFixed: '0.30',
  adSpend: '1000',
  volumeMode: 'units',
  units: '50',
  clicks: '1000',
  conversionRate: '2',
};

const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function calculate(i: Inputs): Results {
  const revenuePerUnit = num(i.price) + num(i.shippingCharged);
  const gatewayFeePerUnit = (revenuePerUnit * num(i.feePercent)) / 100 + num(i.feeFixed);
  const costPerUnit = num(i.cogs) + num(i.shippingCost) + gatewayFeePerUnit;
  const profitPerUnit = revenuePerUnit - costPerUnit;
  const units =
    i.volumeMode === 'units' ? num(i.units) : (num(i.clicks) * num(i.conversionRate)) / 100;
  const adSpend = num(i.adSpend);
  const totalRevenue = revenuePerUnit * units;
  const netProfit = profitPerUnit * units - adSpend;
  return {
    revenuePerUnit,
    gatewayFeePerUnit,
    costPerUnit,
    profitPerUnit,
    units,
    totalRevenue,
    netProfit,
    netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    // Break-even ROAS only exists when each sale earns a positive contribution.
    breakEvenRoas: profitPerUnit > 0 ? revenuePerUnit / profitPerUnit : null,
    targetCpa: Math.max(profitPerUnit, 0),
    actualRoas: adSpend > 0 ? totalRevenue / adSpend : null,
  };
}

export function useProfitCalculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setPresets(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const persist = useCallback((next: Preset[]) => {
    setPresets(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setField = useCallback(
    <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
      setInputs((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const results = useMemo(() => calculate(inputs), [inputs]);

  const savePreset = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      const existing = presets.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      const preset: Preset = {
        id: existing?.id ?? `${Date.now()}`,
        name: trimmed,
        savedAt: Date.now(),
        inputs,
      };
      persist(existing ? presets.map((p) => (p.id === existing.id ? preset : p)) : [preset, ...presets]);
      return true;
    },
    [inputs, presets, persist],
  );

  const loadPreset = useCallback(
    (id: string) => {
      const p = presets.find((x) => x.id === id);
      if (p) setInputs({ ...DEFAULT_INPUTS, ...p.inputs });
    },
    [presets],
  );

  const deletePreset = useCallback(
    (id: string) => persist(presets.filter((p) => p.id !== id)),
    [presets, persist],
  );

  const reset = useCallback(() => setInputs(DEFAULT_INPUTS), []);

  return { inputs, setField, results, presets, savePreset, loadPreset, deletePreset, reset };
}
