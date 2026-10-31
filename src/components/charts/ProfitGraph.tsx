import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Inputs } from '@/engines/useProfitCalculator';
import { BaseDashboardChart } from './BaseDashboardChart';
import { profitBreakdown, profitCurve } from './chartEngines';

const usd = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');

/** Live profit charts. Pass the calculator's raw string inputs; recomputes on every keystroke. */
export function ProfitGraph({ inputs }: { inputs: Inputs }) {
  const curve = useMemo(() => profitCurve(inputs), [inputs]);
  const breakdown = useMemo(() => profitBreakdown(inputs), [inputs]);

  return (
    <View style={styles.col}>
      <BaseDashboardChart
        title="Net profit vs. ad spend"
        subtitle="Illustrative: assumes diminishing returns as you scale spend (units ∝ spend^0.7), so its break-even point can differ from the Break-even ROAS stat. Marker shows where profit hits zero."
        series={curve.series}
        markers={curve.markers}
        xFormat={(x) => usd(x as number)}
        yFormat={usd}
        tooltip={{ title: (x) => `Ad spend ${usd(x as number)}` }}
        showLegend={false}
      />
      <BaseDashboardChart title="Revenue vs. expenses" series={breakdown.series} height={240} yFormat={usd} />
    </View>
  );
}

const styles = StyleSheet.create({ col: { width: '100%', gap: 20 } });
