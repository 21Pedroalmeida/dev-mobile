import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, styles as ui } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { JOINT_NAMES } from '../services/protocol';
import { colors, radius } from '../theme';

export function PoseItem({ pose, onApply, onDelete }) {
  return (
    <View style={s.item} testID={`pose-${pose.id}`}>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{pose.name}</Text>
        <Text style={s.angles}>{pose.angles.map((a, i) => `${JOINT_NAMES[i]} ${a}°`).join('  ·  ')}</Text>
      </View>
      <View style={{ gap: 6 }}>
        <Button small variant="accent" title="Aplicar" onPress={() => onApply(pose)} testID={`apply-${pose.id}`} />
        <Button small variant="outline" title="Excluir" onPress={() => onDelete(pose)} testID={`delete-${pose.id}`} />
      </View>
    </View>
  );
}

/** Lista de poses salvas — usa FlatList. */
export default function PosesScreen() {
  const esp = useEsp();

  const confirmDelete = (pose) =>
    Alert.alert('Excluir pose', `Excluir "${pose.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => esp.removePose(pose.id) },
    ]);

  return (
    <FlatList
      testID="poses-list"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={esp.poses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PoseItem pose={item} onApply={esp.applyPose} onDelete={confirmDelete} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={<Text style={[ui.muted, { marginBottom: 12 }]}>Toque em Aplicar para mover o braço até a pose.</Text>}
      ListEmptyComponent={
        <Text testID="poses-empty" style={[ui.muted, { textAlign: 'center', marginTop: 40 }]}>
          Nenhuma pose salva. Crie uma na aba Braço.
        </Text>
      }
    />
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  angles: { color: colors.muted, fontSize: 12 },
});
