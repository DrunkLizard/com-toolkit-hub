import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BaseDashboardChart } from './BaseDashboardChart';
import { landedCostBars } from './chartEngines';
import { parseNum } from '@/engines/fx';

export type FxGraphProps = {
  /** Raw string inputs straight from the FX hook, so the chart updates on every keystroke. */
  price: string;
  rate: string;
  spread: string;
  tariff: string;
  vat: string;
  currency: string;
};

/** Stacked comparison: Base cost vs. FX conversion loss vs. customs/duties vs. local tax. */
export function FxGraph({ price, rate, spread, tariff, vat, currency }: FxGraphProps) {
  const spec = useMemo(
    () =>
      landedCostBars({
        basePrice: parseNum(price),
        rate: parseNum(rate),
        spreadPct: parseNum(spread),
        tariffPct: parseNum(tariff),
        vatPct: parseNum(vat),
      }),
    [price, rate, spread, tariff, vat],
  );

  const money = (n: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n);
    } catch {
      return n.toFixed(2);
    }
  };

  return (
    <View style={styles.col}>
      <BaseDashboardChart
        title="Landed cost breakdown"
        subtitle={`Importer's cost in ${currency}: (Base × Rate) + FX spread, then customs duty, then VAT/GST on the total. Differs from the checkout price.`}
        series={spec.series}
        yFormat={money}
        height={280}
      />
    </View>
  );
}

const styles = StyleSheet.create({ col: { width: '100%' } });
