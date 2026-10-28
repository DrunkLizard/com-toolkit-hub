import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

export function Card({ title, children, style }: { title?: string; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  prefix,
  suffix,
  keyboardType = 'decimal-pad',
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  prefix?: string;
  suffix?: string;
  keyboardType?: 'decimal-pad' | 'default';
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          selectTextOnFocus
          accessibilityLabel={label}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function Stat({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'bad';
  hint?: string;
}) {
  const color = tone === 'good' ? colors.accent : tone === 'bad' ? colors.danger : colors.text;
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, primary ? styles.buttonPrimary : styles.buttonGhost, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.buttonText, { color: primary ? colors.accentText : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export const Hint = ({ children }: { children: ReactNode }) => <Text style={styles.hint}>{children}</Text>;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  field: { flex: 1, minWidth: 140, gap: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    gap: 6,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 11, minWidth: 0 },
  affix: { color: colors.muted, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.accentText },
  button: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonGhost: { borderWidth: 1, borderColor: colors.border },
  buttonText: { fontSize: 14, fontWeight: '700' },
});
