import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, Card, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const RECURSOS = [
  ['Navegação', 'Drawer + Tab + Stack, com telas protegidas por login'],
  ['Login', 'Senha com salt + SHA-256 (hash), guardada no SecureStore'],
  ['Persistência', 'AsyncStorage: poses, histórico e configurações'],
  ['Listas', 'FlatList (poses) e SectionList (histórico)'],
  ['Recursos do celular', 'Vibração, notificação e WhatsApp'],
  ['API', 'axios GET /api/info do ESP32 e WebSocket'],
  ['Testes', 'Jest + Testing Library (unitários, mocks e interface)'],
];

export default function AboutScreen() {
  const { logout } = useAuth();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title="BMP Tech Car" color={colors.accent}>
        <Text style={[styles.text, { lineHeight: 21 }]}>
          App para controlar o carrinho 4×4 com braço robótico de 4 servos (Base, Ombro, Cotovelo e Garra) do firmware
          BMPTECH_Car_Controller, rodando em um ESP32-S3.
        </Text>
      </Card>
      <Card title="O que o app usa">
        {RECURSOS.map(([k, v]) => (
          <Text key={k} style={[styles.text, { marginBottom: 8 }]}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>{k}: </Text>
            {v}
          </Text>
        ))}
      </Card>
      <Button testID="logout-about" title="Sair da conta" variant="danger" onPress={logout} />
      <Text style={[styles.muted, { fontSize: 12, marginTop: 12, textAlign: 'center' }]}>app v1.1</Text>
    </ScrollView>
  );
}
