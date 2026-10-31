import Head from 'expo-router/head';
import { useWindowDimensions } from 'react-native';
import { Card, Chips, Field, Row, Stat } from '@/components/ui';
import { ProfitGraph } from '@/components/charts/ProfitGraph';
import { PresetsCard } from '@/components/PresetsCard';
import { ProfitFaq } from '@/components/ProfitFaq';
import { useToolkit } from '@/components/ToolkitContext';
import { DESKTOP_BREAKPOINT } from '@/theme';

const usd = (n: number) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProfitScreen() {
  const { inputs, setField, results: r } = useToolkit().profit;
  const desktop = useWindowDimensions().width >= DESKTOP_BREAKPOINT;

  return (
    <>
      <Head>
        <title>{'Profit & Break-Even ROAS | Merchant Toolkit'}</title>
        <meta name="description" content="Free profit calculator for e-commerce: break-even ROAS, target CPA, net profit and margin." />
      </Head>
      <Card title="Product economics">
        <Row>
          <Field label="Price" prefix="$" value={inputs.price} onChangeText={(v) => setField('price', v)} />
          <Field label="COGS" prefix="$" value={inputs.cogs} onChangeText={(v) => setField('cogs', v)} />
        </Row>
        <Row>
          <Field label="Shipping charged" prefix="$" value={inputs.shippingCharged} onChangeText={(v) => setField('shippingCharged', v)} />
          <Field label="Shipping cost" prefix="$" value={inputs.shippingCost} onChangeText={(v) => setField('shippingCost', v)} />
        </Row>
        <Row>
          <Field label="Gateway fee" suffix="%" value={inputs.feePercent} onChangeText={(v) => setField('feePercent', v)} />
          <Field label="Gateway fixed fee" prefix="$" value={inputs.feeFixed} onChangeText={(v) => setField('feeFixed', v)} />
        </Row>
      </Card>

      <Card title="Volume & ad spend">
        <Chips
          options={[
            { id: 'units', label: 'Units sold' },
            { id: 'conversion', label: 'Clicks × conversion' },
          ]}
          value={inputs.volumeMode}
          onChange={(m) => setField('volumeMode', m)}
        />
        <Row>
          <Field label="Ad spend" prefix="$" value={inputs.adSpend} onChangeText={(v) => setField('adSpend', v)} />
          {inputs.volumeMode === 'units' ? (
            <Field label="Units" value={inputs.units} onChangeText={(v) => setField('units', v)} />
          ) : (
            <>
              <Field label="Clicks" value={inputs.clicks} onChangeText={(v) => setField('clicks', v)} />
              <Field label="Conversion rate" suffix="%" value={inputs.conversionRate} onChangeText={(v) => setField('conversionRate', v)} />
            </>
          )}
        </Row>
      </Card>

      <Card title="Results">
        <Row>
          <Stat
            label="Break-even ROAS"
            value={r.breakEvenRoas === null ? 'N/A' : `${r.breakEvenRoas.toFixed(2)}x`}
            hint={r.breakEvenRoas === null ? 'Each sale loses money before ads' : 'Minimum ROAS to avoid losing money'}
          />
          <Stat label="Target CPA" value={usd(r.targetCpa)} hint="Max cost to acquire a customer" />
          <Stat label="Profit / unit" value={usd(r.profitPerUnit)} tone={r.profitPerUnit >= 0 ? 'good' : 'bad'} hint="Before ad spend" />
        </Row>
        <Row>
          <Stat label="Net profit" value={usd(r.netProfit)} tone={r.netProfit >= 0 ? 'good' : 'bad'} hint={`${r.units.toFixed(1)} units after ads`} />
          <Stat label="Net margin" value={`${r.netMargin.toFixed(1)}%`} tone={r.netMargin >= 0 ? 'good' : 'bad'} />
          <Stat label="Actual ROAS" value={r.actualRoas === null ? '—' : `${r.actualRoas.toFixed(2)}x`} hint={`Gateway fee ${usd(r.gatewayFeePerUnit)} / unit`} />
        </Row>
      </Card>

      {!desktop && (
        <Card title="Profit chart">
          <ProfitGraph inputs={inputs} />
        </Card>
      )}

      <PresetsCard />

      <ProfitFaq />
    </>
  );
}
