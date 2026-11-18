import React, { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Joystick from '../components/Joystick';
import { Button, Card, styles } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { mixDrive } from '../services/protocol';
import { colors } from '../theme';

export default function ControlScreen() {
  const esp = useEsp();
  const { width } = useWindowDimensions();
  const [vec, setVec] = useState({ x: 0, y: 0 });
  const [speed, setSpeed] = useState(esp.cfg.speed);
  const mix = mixDrive(vec.x, vec.y, speed);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!esp.connected ? (
        <Text style={{ color: colors.warning, textAlign: 'center', marginBottom: 12 }}>
          Sem conexão com o carrinho. Verifique o Wi-Fi "BMPTECH-Car" ou ative o modo demonstração em Config.
        </Text>
      ) : null}

      <Card title="Direção">
        <Joystick
          size={Math.min(width - 80, 260)}
          onStart={esp.joystickStart}
          onMove={(x, y) => {
            setVec({ x, y });
            esp.joystickMove(x, y);
          }}
          onEnd={esp.joystickEnd}
        />
        <View style={[styles.row, { justifyContent: 'space-around', marginTop: 14 }]}>
          <Text style={styles.muted}>
            X: <Text style={styles.text}>{vec.x}</Text>
          </Text>
          <Text style={styles.muted}>
            Y: <Text style={styles.text}>{vec.y}</Text>
          </Text>
          <Text style={styles.muted}>
            Esq: <Text style={styles.text}>{mix.left}%</Text>
          </Text>
          <Text style={styles.muted}>
            Dir: <Text style={styles.text}>{mix.right}%</Text>
          </Text>
        </View>

        <View style={[styles.row, { justifyContent: 'space-between', marginTop: 18 }]}>
          <Text style={styles.text}>Velocidade máxima</Text>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>{speed}%</Text>
        </View>
        <Slider
          testID="speed-slider"
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={esp.cfg.speed}
          onValueChange={(v) => setSpeed(Math.round(v))}
          onSlidingComplete={(v) => esp.setSpeed(Math.round(v))}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor="#33415a"
          thumbTintColor={colors.primary}
        />
      </Card>

      <Button testID="stop-all" title="PARAR TUDO" variant="danger" onPress={esp.stopAll} style={{ paddingVertical: 20 }} />
    </ScrollView>
  );
}
