import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BaseDashboardChart } from './BaseDashboardChart';
import { overheadCurve, overheadDistribution } from './chartEngines';
import { parseNum } from '@/engines/fx';

const usd = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');

export type OverheadGraphProps = {
  /** Fixed monthly costs (e.g. per category: SaaS, salaries...). */
  fixed: { name: string; monthly: number }[];
  varCost: string;
  volume: string;
  unitPrice: string;
};

/** Total Cost = Fixed + Variable × Volume. Burn distribution plus cost/revenue break-even curve. */
export function OverheadGraph({ fixed, varCost, volume, unitPrice }: OverheadGraphProps) {
  const input = useMemo(
    () => ({
      fixedCosts: fixed,
      variableCostPerUnit: parseNum(varCost),
      volume: parseNum(volume),
      pricePerUnit: parseNum(unitPrice),
    }),
    [fixed, varCost, volume, unitPrice],
  );
  const dist = useMemo(() => overheadDistribution(input), [input]);
  const curve = useMemo(() => overheadCurve(input), [input]);

  return (
    <View style={styles.col}>
      <BaseDashboardChart
        title="Monthly burn distribution"
        subtitle="Fixed costs by category stacked with variable cost at your current volume."
        series={dist.series}
        yFormat={usd}
        height={240}
      />
      <BaseDashboardChart
        title="Cost vs. revenue by volume"
        subtitle="Total cost = fixed + variable × units. Marker shows the break-even volume."
        series={curve.series}
        markers={curve.markers}
        xFormat={(x) => `${Math.round(x as number)}`}
        yFormat={usd}
        tooltip={{ title: (x) => `${Math.round(x as number)} units / month` }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ col: { width: '100%', gap: 20 } });
