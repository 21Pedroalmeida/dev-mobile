import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Button, Card, Field, styles } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { JOINT_NAMES } from '../services/protocol';
import { colors } from '../theme';

export default function ArmScreen() {
  const esp = useEsp();
  const { cfg } = esp;
  const [live, setLive] = useState(null); // valor exibido enquanto arrasta
  const [poseName, setPoseName] = useState('');

  const value = (i) => (live && live.i === i ? live.a : cfg.pos[i]);

  async function save() {
    try {
      await esp.savePose(poseName, cfg.pos);
      setPoseName('');
      esp.vibrate('tap');
      Alert.alert('Pose salva', 'Veja na aba Poses.');
    } catch (e) {
      Alert.alert('Atenção', e.message);
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

      <Card title="Salvar pose atual">
        <Text style={[styles.muted, { marginBottom: 10 }]}>Ângulos: {cfg.pos.join('° · ')}°</Text>
        <Field testID="pose-name" placeholder="Nome da pose (ex.: Pegar copo)" value={poseName} onChangeText={setPoseName} />
        <Button testID="save-pose" title="Salvar pose" variant="accent" onPress={save} />
      </Card>
    </ScrollView>
  );
}
