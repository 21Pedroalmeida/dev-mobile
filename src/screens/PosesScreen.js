import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, styles as ui } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { JOINT_NAMES } from '../services/protocol';
import { colors, radius } from '../theme';

/** Item da lista: toque no card abre os detalhes; botão aplica a pose. */
export function PoseItem({ pose, onApply, onOpen }) {
  return (
    <Pressable style={s.item} testID={`pose-${pose.id}`} onPress={() => onOpen(pose)}>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{pose.name}</Text>
        <Text style={s.angles}>{pose.angles.map((a, i) => `${JOINT_NAMES[i]} ${a}°`).join('  ·  ')}</Text>
        <Text style={s.more}>Toque para ver detalhes ›</Text>
      </View>
      <Button small variant="accent" title="Aplicar" onPress={() => onApply(pose)} testID={`apply-${pose.id}`} />
    </Pressable>
  );
}

/**
 * Lista de poses salvas — FlatList (aula 2).
 * data → lista de objetos | renderItem → como desenhar cada um | keyExtractor → id de cada item
 * Ao tocar, navega para o Detalhe passando a pose como parâmetro (navigation.navigate — aula 3).
 */
export default function PosesScreen({ navigation }) {
  const esp = useEsp();

  return (
    <FlatList
      testID="poses-list"
      style={ui.screen}
      contentContainerStyle={ui.content}
      data={esp.poses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PoseItem
          pose={item}
          onApply={esp.applyPose}
          onOpen={(pose) => navigation.navigate('DetalhePose', { pose })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <Text style={[ui.muted, { marginBottom: 12 }]}>
          {esp.poses.length} pose(s) salva(s). Crie novas na aba Braço.
        </Text>
      }
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
  more: { color: colors.accent, fontSize: 12, marginTop: 6 },
});
