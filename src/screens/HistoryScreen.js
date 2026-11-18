import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { Button, styles as ui } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { colors } from '../theme';

const ICON = { conexao: '📶', comando: '🛑', pose: '🦾', config: '⚙️' };

export function formatTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Histórico de eventos persistido — outra FlatList. */
export default function HistoryScreen() {
  const { history, clearHistory } = useEsp();
  return (
    <FlatList
      testID="history-list"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={history}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        history.length ? <Button small variant="outline" title="Limpar histórico" onPress={clearHistory} style={{ marginBottom: 12 }} /> : null
      }
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
