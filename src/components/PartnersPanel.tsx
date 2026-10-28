import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PARTNERS, ToolId } from '@/data/partners';
import { colors, radius } from '@/theme';

export function PartnersPanel({ tool }: { tool: ToolId }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Recommended E-Commerce Partners & Software</Text>
      {PARTNERS[tool].map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="link"
          onPress={() => Linking.openURL(p.affiliateUrl ?? p.url)}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.category}>{p.category}</Text>
          <Text style={styles.name}>{p.name} ↗</Text>
          <Text style={styles.blurb}>{p.blurb}</Text>
        </Pressable>
      ))}
      <Text style={styles.disclosure}>Some links may be affiliate links; we may earn a commission at no extra cost to you.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  item: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, gap: 3 },
  category: { color: colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  blurb: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  disclosure: { color: colors.muted, fontSize: 11, lineHeight: 15 },
});
