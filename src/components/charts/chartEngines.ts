import { Inputs, calculate } from '@/engines/useProfitCalculator';
import { colors } from '@/theme';
import type { ChartMarker, ChartSeries } from './BaseDashboardChart';

export type ChartSpec = { series: ChartSeries[]; markers?: ChartMarker[] };

const PALETTE = {
  profit: colors.accent,
  revenue: '#60a5fa',
  cogs: '#a78bfa',
  shipping: '#f59e0b',
  fees: '#f472b6',
  ads: '#38bdf8',
  fixed: '#a78bfa',
  variable: '#f59e0b',
};

// ---------------------------------------------------------------- Tool 1: profit

/**
 * Net Profit(S) = profit/unit * units(S) - S, with units(S) = units * (S / adSpend)^elasticity.
 * elasticity = 1 keeps ROAS constant as you scale; < 1 models diminishing returns, which is
 * what creates a real break-even intercept on the curve.
 */
export function profitCurve(inputs: Inputs, elasticity = 0.7, steps = 40): ChartSpec & { breakEvenSpend: number | null } {
  const r = calculate(inputs);
  const spend = parseFloat(inputs.adSpend.replace(',', '.')) || 0;
  const e = spend > 0 ? elasticity : 0;
  const base = spend > 0 ? spend : Math.max(r.profitPerUnit * r.units, 100);
  const maxS = base * 3;
  const unitsAt = (s: number) => (e === 0 ? r.units : r.units * Math.pow(s / spend, e));
  const net = (s: number) => r.profitPerUnit * unitsAt(s) - s;

  const data = Array.from({ length: steps + 1 }, (_, i) => {
    const s = (maxS * i) / steps;
    return { x: s, y: net(s) };
  });

  // First sign change after the profitable region = the break-even intercept.
  let breakEvenSpend: number | null = null;
  for (let i = 1; i < data.length; i++) {
    const a = data[i - 1];
    const b = data[i];
    if (a.y > 0 && b.y <= 0) {
      let lo = a.x;
      let hi = b.x;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (net(mid) > 0) lo = mid;
        else hi = mid;
      }
      breakEvenSpend = (lo + hi) / 2;
      break;
    }
  }

  const markers: ChartMarker[] = [{ x: spend || 0, y: net(spend || 0), label: 'Current', color: colors.text }];
  if (breakEvenSpend !== null) {
    const rev = r.revenuePerUnit * unitsAt(breakEvenSpend);
    markers.push({ x: breakEvenSpend, y: 0, label: `Break-even ${(rev / breakEvenSpend).toFixed(2)}x ROAS`, color: colors.warn });
  }

  return {
    series: [{ id: 'net', label: 'Net profit', color: PALETTE.profit, kind: 'area', data }],
    markers,
    breakEvenSpend,
  };
}

/** Revenue vs. total expenses, with expenses stacked by category. */
export function profitBreakdown(inputs: Inputs): ChartSpec {
  const r = calculate(inputs);
  const num = (v: string) => Math.max(parseFloat(v.replace(',', '.')) || 0, 0);
  const cogs = num(inputs.cogs) * r.units;
  const shipping = num(inputs.shippingCost) * r.units;
  const fees = r.gatewayFeePerUnit * r.units;
  const ads = num(inputs.adSpend);
  const bar = (id: string, label: string, color: string, x: string, y: number) => ({
    id,
    label,
    color,
    kind: 'bar' as const,
    data: [{ x, y }],
  });
  return {
    series: [
      bar('revenue', 'Revenue', PALETTE.revenue, 'Revenue', r.totalRevenue),
      bar('cogs', 'COGS', PALETTE.cogs, 'Expenses', cogs),
      bar('shipping', 'Shipping', PALETTE.shipping, 'Expenses', shipping),
      bar('fees', 'Gateway fees', PALETTE.fees, 'Expenses', fees),
      bar('ads', 'Ad spend', PALETTE.ads, 'Expenses', ads),
    ],
  };
}

// ------------------------------------------------------------------- Tool 2: FX

export type LandedCostInput = {
  basePrice: number; // home currency
  rate: number; // mid-market, local per home
  spreadPct: number; // FX conversion loss
  tariffPct: number;
  vatPct: number;
};

/** Landed = (Base * Rate) * (1 + Tariff) * (1 + VAT), with the FX spread folded into the rate. */
export function landedCost({ basePrice, rate, spreadPct, tariffPct, vatPct }: LandedCostInput) {
  const base = basePrice * rate;
  const fxLoss = base * (spreadPct / 100);
  const duties = (base + fxLoss) * (tariffPct / 100);
  const tax = (base + fxLoss + duties) * (vatPct / 100);
  return { base, fxLoss, duties, tax, total: base + fxLoss + duties + tax };
}

export function landedCostBars(input: LandedCostInput): ChartSpec {
  const c = landedCost(input);
  const bar = (id: string, label: string, color: string, landed: number, plain = 0) => ({
    id,
    label,
    color,
    kind: 'bar' as const,
    data: [{ x: 'Base price', y: plain }, { x: 'Landed cost', y: landed }],
  });
  return {
    series: [
      bar('base', 'Base cost', PALETTE.revenue, c.base, c.base),
      bar('fx', 'FX conversion loss', PALETTE.fees, c.fxLoss),
      bar('duties', 'Customs / duties', PALETTE.shipping, c.duties),
      bar('tax', 'Local VAT / GST', PALETTE.cogs, c.tax),
    ],
  };
}

// ---------------------------------------------------------------- Tool 3: overhead

export type OverheadInput = {
  fixedCosts: { name: string; monthly: number }[]; // SaaS, salaries, ...
  variableCostPerUnit: number;
  volume: number; // current units / month
  pricePerUnit?: number; // adds a revenue line and a break-even marker
};

/** Total Cost(v) = Fixed + Variable * v. */
export function overheadCurve({ fixedCosts, variableCostPerUnit, volume, pricePerUnit = 0 }: OverheadInput, steps = 24): ChartSpec {
  const fixed = fixedCosts.reduce((s, f) => s + f.monthly, 0);
  const margin = pricePerUnit - variableCostPerUnit;
  const breakEven = pricePerUnit > 0 && margin > 0 ? fixed / margin : null;
  const maxV = Math.max(volume * 2, (breakEven ?? 0) * 1.5, 10);
  const pts = (f: (v: number) => number) =>
    Array.from({ length: steps + 1 }, (_, i) => ({ x: (maxV * i) / steps, y: f((maxV * i) / steps) }));
  const series: ChartSeries[] = [
    { id: 'cost', label: 'Total cost', color: PALETTE.ads, kind: 'line', data: pts((v) => fixed + variableCostPerUnit * v) },
    { id: 'fixed', label: 'Fixed costs', color: PALETTE.fixed, kind: 'line', dashed: true, data: pts(() => fixed) },
  ];
  if (pricePerUnit > 0) series.push({ id: 'rev', label: 'Revenue', color: PALETTE.profit, kind: 'line', data: pts((v) => pricePerUnit * v) });
  return {
    series,
    markers: breakEven !== null ? [{ x: breakEven, y: pricePerUnit * breakEven, label: `Break-even ${Math.ceil(breakEven)} units`, color: colors.warn }] : [],
  };
}

/** Monthly burn: each fixed line stacked with the variable cost at current volume. */
export function overheadDistribution({ fixedCosts, variableCostPerUnit, volume }: OverheadInput): ChartSpec {
  const palette = [PALETTE.fixed, PALETTE.revenue, PALETTE.fees, PALETTE.ads, PALETTE.cogs];
  return {
    series: [
      ...fixedCosts.map((f, i) => ({
        id: `f${i}`,
        label: f.name,
        color: palette[i % palette.length],
        kind: 'bar' as const,
        data: [{ x: 'Monthly burn', y: f.monthly }],
      })),
      { id: 'var', label: 'Variable costs', color: PALETTE.variable, kind: 'bar' as const, data: [{ x: 'Monthly burn', y: variableCostPerUnit * volume }] },
    ],
  };
}
