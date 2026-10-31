import { useState } from 'react';
import Head from 'expo-router/head';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Button, Card, Chips, Field, Hint, Row, Stat } from '@/components/ui';
import { OverheadGraph } from '@/components/charts/OverheadGraph';
import { useToolkit } from '@/components/ToolkitContext';
import { CADENCES, CATEGORIES, Cadence, monthlyCost } from '@/engines/useOverheadTracker';
import { parseNum } from '@/engines/fx';
import { DESKTOP_BREAKPOINT, colors } from '@/theme';

const usd = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ExpensesScreen() {
  const oh = useToolkit().overhead;
  const { items, loaded, add, remove, totals } = oh;
  const desktop = useWindowDimensions().width >= DESKTOP_BREAKPOINT;
  const margin = parseNum(oh.unitPrice) - parseNum(oh.varCost);
  const breakEven = margin > 0 ? totals.monthly / margin : null;
  const totalCost = totals.monthly + parseNum(oh.varCost) * parseNum(oh.volume);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cadence, setCadence] = useState<Cadence>('monthly');

  return (
    <>
      <Head>
        <title>{'Expense & Overhead Tracker | Merchant Toolkit'}</title>
        <meta name="description" content="Free expense and overhead tracker with monthly burn and break-even volume for online stores." />
      </Head>
      <Card title="Overhead summary">
        <Row>
          <Stat label="Monthly" value={usd(totals.monthly)} tone="bad" />
          <Stat label="Yearly" value={usd(totals.yearly)} />
          <Stat label="Per day" value={usd(totals.daily)} hint="Covered before your first sale" />
        </Row>
        {totals.byCategory.map(([cat, m]) => (
          <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted }}>{cat}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{usd(m)}/mo</Text>
          </View>
        ))}
      </Card>

      <Card title="Break-even drivers">
        <Row>
          <Field label="Variable cost / unit" prefix="$" value={oh.varCost} onChangeText={oh.setVarCost} />
          <Field label="Volume / month" value={oh.volume} onChangeText={oh.setVolume} />
          <Field label="Price / unit" prefix="$" value={oh.unitPrice} onChangeText={oh.setUnitPrice} />
        </Row>
        <Row>
          <Stat label="Total cost / month" value={usd(totalCost)} tone="bad" hint="Fixed + variable × volume" />
          <Stat
            label="Break-even volume"
            value={breakEven === null ? 'N/A' : `${Math.ceil(breakEven)} units`}
            hint={breakEven === null ? 'Price must exceed variable cost' : 'Units / month to cover fixed costs'}
          />
        </Row>
      </Card>

      {!desktop && (
        <Card title="Cost charts">
          <OverheadGraph fixed={oh.fixedByCategory} varCost={oh.varCost} volume={oh.volume} unitPrice={oh.unitPrice} />
        </Card>
      )}

      <Card title="Add recurring expense">
        <Row>
          <Field label="Name" keyboardType="default" value={name} onChangeText={setName} placeholder="e.g. Shopify plan" />
          <Field label="Amount" prefix="$" value={amount} onChangeText={setAmount} />
        </Row>
        <Chips options={CADENCES.map((c) => ({ id: c.id, label: c.label }))} value={cadence} onChange={setCadence} />
        <Chips options={CATEGORIES.map((c) => ({ id: c, label: c }))} value={category} onChange={setCategory} />
        <Row>
          <Button
            label="Add expense"
            onPress={() => {
              if (add({ name, amount: parseNum(amount), category, cadence })) {
                setName('');
                setAmount('');
              }
            }}
          />
        </Row>
      </Card>

      <Card title="Your overhead">
        {!loaded ? (
          <Hint>Loading…</Hint>
        ) : items.length === 0 ? (
          <Hint>Nothing tracked yet. Entries are saved on this device.</Hint>
        ) : (
          items.map((i) => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{i.name}</Text>
                <Hint>
                  {i.category} · {usd(i.amount)} {i.cadence} · {usd(monthlyCost(i))}/mo
                </Hint>
              </View>
              <Pressable onPress={() => remove(i.id)} accessibilityRole="button" accessibilityLabel={`Delete ${i.name}`}>
                <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>
    </>
  );
}
