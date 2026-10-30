import { Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { colors } from '@/theme';

const FAQ = [
  {
    q: 'What is break-even ROAS?',
    a: 'Break-even ROAS is the return on ad spend at which ads earn exactly zero profit. Formula: Break-even ROAS = Selling Price ÷ Profit per Unit before ads, where Profit per Unit = Price + Shipping Charged − COGS − Shipping Cost − Gateway Fees. Example: a $50 price with $20 profit per unit gives 50 ÷ 20 = 2.5x. Below 2.5x you lose money.',
  },
  {
    q: 'What is net margin?',
    a: 'Net margin is the share of revenue left as profit after all costs, including ad spend. Formula: Net Margin (%) = Net Profit ÷ Total Revenue × 100, where Net Profit = (Profit per Unit × Units Sold) − Ad Spend. Example: $1,000 net profit on $5,000 revenue is a 20% net margin.',
  },
  {
    q: 'What is target CPA?',
    a: 'Target CPA is the most you can pay to acquire one customer without losing money. It equals Profit per Unit before ads. Spend more than this per sale and the order is unprofitable.',
  },
  {
    q: 'How are Shopify payment gateway fees calculated?',
    a: 'Gateway Fee per Order = (Price × Fee %) + Fixed Fee. With the default 2.9% + $0.30, a $50 order costs $1.75 in fees.',
  },
];

export function ProfitFaq() {
  return (
    <Card title="Shopify profit calculator FAQ">
      {FAQ.map((item) => (
        <View key={item.q} style={{ gap: 4 }}>
          <Text role="heading" aria-level={2} style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
            {item.q}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{item.a}</Text>
        </View>
      ))}
    </Card>
  );
}
