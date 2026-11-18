import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

export function Card({ title, color = colors.primary, right, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={[styles.cardHeader, { backgroundColor: color }]}>
          <Text style={styles.cardTitle}>{title}</Text>
          {right}
        </View>
      ) : null}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, testID, small }) {
  const bg = { primary: colors.primary, accent: colors.accent, danger: colors.danger, outline: 'transparent', dark: '#24324a' }[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
        variant === 'outline' && styles.btnOutline,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, small && { fontSize: 13 }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

const STATUS = {
  connected: { color: colors.success, text: 'Conectado' },
  connecting: { color: colors.warning, text: 'Conectando…' },
  disconnected: { color: colors.danger, text: 'Desconectado' },
  idle: { color: colors.muted, text: 'Parado' },
};

export function StatusBadge({ status, demo }) {
  const s = STATUS[status] || STATUS.idle;
  return (
    <View style={[styles.badge, { backgroundColor: s.color + '33' }]} testID="status-badge">
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={styles.badgeText}>
        {s.text}
        {demo ? ' · demo' : ''}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: { paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardBody: { padding: 14 },
  btn: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  btnOutline: { borderWidth: 1, borderColor: colors.muted },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  label: { color: colors.muted, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  text: { color: colors.text },
  muted: { color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center' },
});
