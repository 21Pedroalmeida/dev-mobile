import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, styles } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { JOINT_NAMES } from '../services/protocol';
import { sharePoseOnWhatsApp } from '../services/whatsapp';
import { colors } from '../theme';

/**
 * Detalhe de uma pose. Recebe a pose por parâmetro de navegação:
 *   navigation.navigate('DetalhePose', { pose })  →  route.params.pose   (aula 3)
 */
export default function PoseDetailScreen({ navigation, route }) {
  const esp = useEsp();
  const { pose } = route.params;

  const compartilhar = () =>
    sharePoseOnWhatsApp(pose).catch(() => Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp.'));

  const excluir = () =>
    Alert.alert('Excluir pose', `Excluir "${pose.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await esp.removePose(pose.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title={pose.name} color={colors.accent}>
        {pose.angles.map((a, i) => (
          <View key={i} style={[styles.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Text style={styles.text}>{JOINT_NAMES[i]}</Text>
            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 20 }}>{a}°</Text>
          </View>
        ))}
        {pose.createdAt ? (
          <Text style={[styles.muted, { fontSize: 12 }]}>Criada em {new Date(pose.createdAt).toLocaleString('pt-BR')}</Text>
        ) : null}
      </Card>

      <Button testID="detail-apply" title="Aplicar no braço" onPress={() => esp.applyPose(pose)} />
      <Button
        testID="detail-whatsapp"
        title="Compartilhar no WhatsApp"
        onPress={compartilhar}
        style={{ marginTop: 10, backgroundColor: '#25D366' }}
      />
      <Button testID="detail-delete" title="Excluir pose" variant="outline" onPress={excluir} style={{ marginTop: 10 }} />
    </ScrollView>
  );
}
