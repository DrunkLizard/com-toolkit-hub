import { Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PartnersPanel } from './PartnersPanel';
import { FxResultsCards } from './FxResultsCards';
import { FxGraph } from './charts/FxGraph';
import { OverheadGraph } from './charts/OverheadGraph';
import { ProfitGraph } from './charts/ProfitGraph';
import { useToolkit } from './ToolkitContext';
import { ToolId } from '@/data/partners';
import { DESKTOP_BREAKPOINT, MAX_WIDTH, colors, radius } from '@/theme';

const TOOLS: { id: ToolId; href: '/profit' | '/fx' | '/expenses'; label: string; short: string }[] = [
  { id: 'profit', href: '/profit', label: 'Profit & Break-Even ROAS', short: 'Profit & ROAS' },
  { id: 'fx', href: '/fx', label: 'FX & Cross-Border Tax', short: 'FX & Tax' },
  { id: 'expenses', href: '/expenses', label: 'Expense & Overhead Tracker', short: 'Overhead' },
];

export function Shell() {
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_BREAKPOINT;
  const pathname = usePathname();
  const router = useRouter();
  const active = TOOLS.find((t) => pathname.startsWith(t.href)) ?? TOOLS[0];
  const { profit, fx, overhead } = useToolkit();
  const showCharts = desktop;

  const nav = TOOLS.map((t) => (
    <Pressable
      key={t.id}
      onPress={() => router.push(t.href)}
      accessibilityRole="tab"
      accessibilityState={{ selected: t.id === active.id }}
      style={[desktop ? styles.sideItem : styles.tab, t.id === active.id && styles.itemActive]}
    >
      <Text style={[styles.itemText, t.id === active.id && styles.itemTextActive]}>{desktop ? t.label : t.short}</Text>
    </Pressable>
  ));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Merchant Toolkit</Text>
          <Text style={styles.brandSub}>Profit · FX · Overhead</Text>
        </View>

        {!desktop && <View style={styles.tabs}>{nav}</View>}

        <View style={[styles.body, desktop && styles.bodyDesktop]}>
          {desktop && <View style={styles.sidebar}>{nav}</View>}
          <View style={styles.main}>
            <Slot />
          </View>
          <View style={desktop ? [styles.aside, showCharts && styles.asideWide] : undefined}>
            {desktop && active.id === 'fx' && <FxResultsCards />}
            {showCharts && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  {active.id === 'fx' ? 'Landed cost chart' : active.id === 'expenses' ? 'Cost charts' : 'Profit chart'}
                </Text>
                {active.id === 'fx' ? (
                  <FxGraph price={fx.price} rate={fx.rateStr} spread={fx.spread} tariff={fx.tariff} vat={fx.taxStr} currency={fx.market.currency} />
                ) : active.id === 'expenses' ? (
                  <OverheadGraph fixed={overhead.fixedByCategory} varCost={overhead.varCost} volume={overhead.volume} unitPrice={overhead.unitPrice} />
                ) : (
                  <ProfitGraph inputs={profit.inputs} />
                )}
              </View>
            )}
            <PartnersPanel tool={active.id} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  pageContent: { alignItems: 'center', padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: MAX_WIDTH, gap: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  brand: { color: colors.text, fontSize: 22, fontWeight: '800' },
  brandSub: { color: colors.muted, fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  body: { gap: 16 },
  bodyDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  sidebar: { width: 210, gap: 6 },
  sideItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  itemText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  itemTextActive: { color: colors.accentText },
  main: { flex: 1, minWidth: 0, gap: 16 },
  aside: { width: 260, gap: 16 },
  asideWide: { flex: 1, minWidth: 440, maxWidth: 640 },
  chartCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  chartTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
