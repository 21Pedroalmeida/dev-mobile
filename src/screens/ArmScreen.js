import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Button, Card, Field, styles } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { JOINT_NAMES } from '../services/protocol';
import { colors, radius } from '../theme';

export default function ArmScreen() {
  const esp = useEsp();
  const { cfg } = esp;
  const [live, setLive] = useState(null); // valor exibido enquanto arrasta
  const [modalVisible, setModalVisible] = useState(false); // Modal (aula 3)
  const [poseName, setPoseName] = useState('');
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState('');

  const value = (i) => (live && live.i === i ? live.a : cfg.pos[i]);

  function fecharModal() {
    setModalVisible(false);
    setPoseName('');
    setErro('');
  }

  async function salvar() {
    try {
      await esp.savePose(poseName, cfg.pos);
      esp.vibrate('tap');
      setSalvo(poseName.trim());
      fecharModal();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card
        title="Braço robótico"
        color={colors.accent}
        right={<Button small variant="dark" title="Home" onPress={esp.goHome} />}
      >
        {JOINT_NAMES.map((name, i) => (
          <View key={name} style={{ marginBottom: 10 }}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.text}>{name}</Text>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>{value(i)}°</Text>
            </View>
            <Slider
              testID={`servo-${i}`}
              minimumValue={cfg.min[i]}
              maximumValue={cfg.max[i]}
              step={1}
              value={cfg.pos[i]}
              onValueChange={(a) => {
                a = Math.round(a);
                setLive({ i, a });
                esp.setServo(i, a);
              }}
              onSlidingComplete={() => setLive(null)}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor="#33415a"
              thumbTintColor={colors.primary}
            />
          </View>
        ))}
        <View style={[styles.row, { flexWrap: 'wrap', gap: 8, marginTop: 6 }]}>
          <Button small variant="dark" title="Abrir garra" onPress={() => esp.setServo(3, Math.min(160, cfg.max[3]))} />
          <Button small variant="dark" title="Fechar garra" onPress={() => esp.setServo(3, Math.max(20, cfg.min[3]))} />
        </View>
      </Card>

      <Button testID="open-save-modal" title="Salvar pose atual" variant="accent" onPress={() => setModalVisible(true)} />
      {salvo ? (
        <Text style={{ color: colors.success, textAlign: 'center', marginTop: 10 }}>
          Pose "{salvo}" salva! Veja na aba Poses.
        </Text>
      ) : null}

      {/* Modal: nova janela por cima da tela, sem trocar de página (aula 3) */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={fecharModal}>
        <Pressable style={modal.fundo} onPress={fecharModal}>
          <Pressable style={modal.caixa} onPress={() => {}}>
            <Text style={modal.titulo}>Salvar pose</Text>
            <Text style={[styles.muted, { marginBottom: 12 }]}>Ângulos: {cfg.pos.join('° · ')}°</Text>
            <Field
              testID="pose-name"
              placeholder="Nome (ex.: Pegar copo)"
              value={poseName}
              onChangeText={setPoseName}
              autoFocus
            />
            {erro ? <Text style={{ color: colors.danger, marginBottom: 10 }}>{erro}</Text> : null}
            <Button testID="save-pose" title="Salvar" variant="accent" onPress={salvar} />
            <Button title="Cancelar" variant="outline" onPress={fecharModal} style={{ marginTop: 10 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const modal = {
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  caixa: {
    backgroundColor: colors.card,
    padding: 20,
    paddingBottom: 36,
    borderTopLeftRadius: radius * 1.5,
    borderTopRightRadius: radius * 1.5,
  },
  titulo: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
};
