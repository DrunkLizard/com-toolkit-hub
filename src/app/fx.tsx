import { Pressable, Text } from 'react-native';
import { Button, Card, Chips, Field, Hint, Row, Stat } from '@/components/ui';
import { useToolkit } from '@/components/ToolkitContext';
import { HOME_CURRENCIES, MARKETS, fmtMoney } from '@/engines/fx';
import { colors } from '@/theme';

const SOURCE_LABEL = {
  live: 'Live rate',
  cached: 'Cached rate (offline)',
  estimate: 'Rough estimate – edit or refresh',
  manual: 'Manual rate',
} as const;

export default function FxScreen() {
  const fx = useToolkit().fx;
  const { market, home, result: r } = fx;
  const local = market.currency;

  const status =
    fx.refresh === 'loading'
      ? 'Fetching live rates…'
      : fx.refresh === 'error'
        ? 'Live rates unavailable'
        : SOURCE_LABEL[fx.rateSource];
  const stamp = fx.fetchedAt && fx.rateSource !== 'manual' ? ` · ${new Date(fx.fetchedAt).toLocaleString()}` : '';

  return (
    <>
      <Card title="Pricing">
        <Hint>Your store currency</Hint>
        <Chips options={HOME_CURRENCIES.map((c) => ({ id: c, label: c }))} value={home} onChange={fx.setHome} />
        <Hint>Selling into</Hint>
        <Chips options={MARKETS.map((m) => ({ id: m.id, label: `${m.name} · ${m.currency}` }))} value={market.id} onChange={fx.setMarket} />
        <Row>
          <Field label={`Base price (${home})`} value={fx.price} onChangeText={fx.setPrice} />
          <Field label={`Rate (${home}→${local})`} value={fx.rateStr} onChangeText={fx.setRate} />
        </Row>
        <Row>
          <Field label="FX buffer spread" suffix="%" value={fx.spread} onChangeText={fx.setSpread} />
          <Field label={`${market.taxLabel}`} suffix="%" value={fx.taxStr} onChangeText={fx.setTax} />
          <Field label="Payment fee" suffix="%" value={fx.fee} onChangeText={fx.setFee} />
        </Row>
        <Row>
          <Hint>
            {status}
            {stamp}
          </Hint>
          <Button label="Refresh rates" variant="ghost" onPress={fx.reload} />
          {fx.rateSource === 'manual' && (
            <Pressable onPress={fx.useAutoRate} accessibilityRole="button">
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Use automatic rate</Text>
            </Pressable>
          )}
        </Row>
      </Card>

      <Card title="Customer sees">
        <Row>
          <Stat label={`Price excl. ${market.taxLabel}`} value={fmtMoney(r.converted, local)} />
          <Stat label={market.taxLabel} value={fmtMoney(r.taxAmount, local)} />
          <Stat label="Checkout total" value={fmtMoney(r.total, local)} tone="good" />
        </Row>
      </Card>

      <Card title="You receive">
        <Row>
          <Stat label="FX spread cost" value={fmtMoney(r.spreadCost, local)} tone="bad" />
          <Stat label="Payment fee" value={fmtMoney(r.feeCost, local)} tone="bad" />
          <Stat label={`Payout (${local})`} value={fmtMoney(r.payoutLocal, local)} />
          <Stat label={`Payout (${home})`} value={fmtMoney(r.payoutHome, home)} tone="good" hint="Excludes tax, which you remit" />
        </Row>
      </Card>
    </>
  );
}
