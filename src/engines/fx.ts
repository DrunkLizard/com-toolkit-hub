import AsyncStorage from '@react-native-async-storage/async-storage';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'TRY' | 'JPY' | 'AUD';

export const HOME_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'TRY'];

export type Market = { id: string; name: string; currency: Currency; tax: number; taxLabel: string };

export const MARKETS: Market[] = [
  { id: 'US', name: 'United States', currency: 'USD', tax: 0, taxLabel: 'Sales tax' },
  { id: 'EU', name: 'Germany (EU)', currency: 'EUR', tax: 19, taxLabel: 'VAT' },
  { id: 'UK', name: 'United Kingdom', currency: 'GBP', tax: 20, taxLabel: 'VAT' },
  { id: 'JP', name: 'Japan', currency: 'JPY', tax: 10, taxLabel: 'Consumption tax' },
  { id: 'AU', name: 'Australia', currency: 'AUD', tax: 10, taxLabel: 'GST' },
  { id: 'TR', name: 'Turkey', currency: 'TRY', tax: 20, taxLabel: 'KDV (VAT)' },
];

// Approximate units per 1 USD; only seeds the rate when no live or cached rate exists.
const PER_USD: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79, TRY: 34, JPY: 150, AUD: 1.52 };

export const estimateRate = (from: Currency, to: Currency): number =>
  Number((PER_USD[to] / PER_USD[from]).toPrecision(6));

export type FxInputs = { price: number; rate: number; spreadPct: number; taxPct: number; feePct: number };

export type FxResult = {
  converted: number; // local price excl. tax
  taxAmount: number;
  total: number; // local price incl. tax
  spreadCost: number;
  feeCost: number;
  payoutLocal: number;
  payoutHome: number;
};

export function calculateFx({ price, rate, spreadPct, taxPct, feePct }: FxInputs): FxResult {
  const converted = price * rate;
  const taxAmount = converted * (taxPct / 100);
  // Tax is collected for the authority; spread and fees apply to the tax-exclusive sale.
  const spreadCost = converted * (spreadPct / 100);
  const feeCost = converted * (feePct / 100);
  const payoutLocal = converted - spreadCost - feeCost;
  return {
    converted,
    taxAmount,
    total: converted + taxAmount,
    spreadCost,
    feeCost,
    payoutLocal,
    payoutHome: rate > 0 ? payoutLocal / rate : 0,
  };
}

export function fmtMoney(n: number, currency: string): string {
  if (!isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export const parseNum = (s: string): number => {
  const v = parseFloat(s.replace(',', '.'));
  return isFinite(v) && v >= 0 ? v : 0;
};

// ---- cached live rates ----

export type LiveRates = { base: string; rates: Record<string, number>; fetchedAt: number };

const cacheKey = (base: string) => `toolkit:fx:live:v1:${base}`;

export async function loadCachedRates(base: string): Promise<LiveRates | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(base));
    return raw ? (JSON.parse(raw) as LiveRates) : null;
  } catch {
    return null;
  }
}

export async function fetchLiveRates(base: string): Promise<LiveRates> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.result !== 'success' || !json.rates) throw new Error('Unexpected response');
    const live: LiveRates = { base, rates: json.rates, fetchedAt: Date.now() };
    try {
      await AsyncStorage.setItem(cacheKey(base), JSON.stringify(live));
    } catch {
      // Cache write is best-effort.
    }
    return live;
  } finally {
    clearTimeout(timer);
  }
}
