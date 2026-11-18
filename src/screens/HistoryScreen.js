import React, { useMemo } from 'react';
import { SectionList, Text, View } from 'react-native';
import { Button, styles as ui } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { groupHistoryByDay } from '../services/storage';
import { colors } from '../theme';

const ICON = { conexao: '📶', comando: '🛑', pose: '🦾', config: '⚙️' };

export function formatTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * Histórico de eventos agrupado por dia — SectionList (aula 2):
 * igual à FlatList, mas com "sections" e um renderSectionHeader.
 */
export default function HistoryScreen() {
  const { history, clearHistory } = useEsp();
  const sections = useMemo(() => groupHistoryByDay(history), [history]);

  return (
    <SectionList
      testID="history-list"
      style={ui.screen}
      contentContainerStyle={ui.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        history.length ? <Button small variant="outline" title="Limpar histórico" onPress={clearHistory} style={{ marginBottom: 4 }} /> : null
      }
      renderSectionHeader={({ section: { title } }) => (
        <Text style={{ color: colors.accent, fontWeight: '800', marginTop: 16, marginBottom: 4 }}>{title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
          <Text style={{ width: 30, fontSize: 16 }}>{ICON[item.type] || '•'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={ui.text}>{item.message}</Text>
            <Text style={[ui.muted, { fontSize: 12, marginTop: 2 }]}>{formatTime(item.at)}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={[ui.muted, { textAlign: 'center', marginTop: 40 }]}>Nenhum evento ainda.</Text>}
    />
  );
}
