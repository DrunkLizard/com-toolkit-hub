import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Chips, Field, Hint, Row, Stat } from '@/components/ui';
import { useToolkit } from '@/components/ToolkitContext';
import { CADENCES, CATEGORIES, Cadence, monthlyCost } from '@/engines/useOverheadTracker';
import { parseNum } from '@/engines/fx';
import { colors } from '@/theme';

const usd = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ExpensesScreen() {
  const { items, loaded, add, remove, totals } = useToolkit().overhead;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cadence, setCadence] = useState<Cadence>('monthly');

  return (
    <>
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
