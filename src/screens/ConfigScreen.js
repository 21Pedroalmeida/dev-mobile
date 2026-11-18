import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, View } from 'react-native';
import { Button, Card, Field, StatusBadge, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useEsp } from '../context/EspContext';
import { getDeviceInfo, formatUptime } from '../services/espInfo';
import { isValidIp } from '../services/validators';
import { colors } from '../theme';

function ToggleRow({ label, hint, value, onValueChange, testID }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.text}>{label}</Text>
        {hint ? <Text style={[styles.muted, { fontSize: 12 }]}>{hint}</Text> : null}
      </View>
      <Switch
        testID={testID}
        value={!!value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: '#33415a' }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function ConfigScreen() {
  const { logout } = useAuth();
  const esp = useEsp();
  const { settings, cfg } = esp;
  const [host, setHost] = useState(settings.host);
  const [info, setInfo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [ipErro, setIpErro] = useState('');

  useEffect(() => setHost(settings.host), [settings.host]);

  // GET /api/info com axios (aula 6)
  async function loadInfo() {
    setCarregando(true);
    try {
      setInfo(await getDeviceInfo(settings.host, settings.demo));
    } catch {
      setInfo(null);
      Alert.alert('Erro', 'Não foi possível ler /api/info do ESP32.');
    } finally {
      setCarregando(false);
    }
  }

  // Valida o IP com regex antes de salvar (aula de Regex)
  function salvarIp() {
    if (!isValidIp(host)) {
      setIpErro('IP inválido. Use o formato 192.168.4.1');
      return;
    }
    setIpErro('');
    esp.updateSettings({ host: host.trim() });
  }

  useEffect(() => {
    if (esp.connected) loadInfo();
  }, [esp.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const diag = () =>
    Alert.alert('Diagnóstico', 'Cada servo e motor vai se mover em sequência. Deixe o carrinho suspenso. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Executar', onPress: esp.runDiag },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title="Conexão" right={<StatusBadge status={esp.status} demo={settings.demo} />}>
        <ToggleRow
          testID="demo-switch"
          label="Modo demonstração"
          hint="Simula o ESP32 (para testar sem o carrinho)"
          value={settings.demo}
          onValueChange={(demo) => esp.updateSettings({ demo })}
        />
        <Field
          label="IP do ESP32"
          testID="host-input"
          value={host}
          onChangeText={(t) => {
            setHost(t);
            setIpErro('');
          }}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          editable={!settings.demo}
        />
        {ipErro ? (
          <Text testID="ip-error" style={{ color: colors.danger, marginTop: -6, marginBottom: 10 }}>
            {ipErro}
          </Text>
        ) : null}
        <Button
          testID="save-ip"
          title={host.trim() !== settings.host ? 'Salvar IP e conectar' : 'Reconectar'}
          onPress={() => (host.trim() !== settings.host ? salvarIp() : esp.reconnect())}
        />
        <Text style={[styles.muted, { fontSize: 12, marginTop: 10 }]}>
          Conecte o celular ao Wi-Fi "BMPTECH-Car" (senha 12345678). Se o Android avisar "sem internet", escolha manter a conexão.
        </Text>
      </Card>

      <Card title="Recursos do celular" color={colors.accent}>
        <ToggleRow
          label="Vibração"
          hint="Vibra no joystick, no PARAR e ao conectar/desconectar"
          value={settings.vibration}
          onValueChange={(vibration) => {
            esp.updateSettings({ vibration });
            if (vibration) esp.vibrate('connected');
          }}
        />
        <ToggleRow
          label="Notificações"
          hint="Avisa quando o carrinho conecta ou desconecta"
          value={settings.notifications}
          onValueChange={(notifications) => esp.updateSettings({ notifications })}
        />
      </Card>

      <Card title="Inversão de rodas">
        <ToggleRow label="Inverter lado esquerdo" value={cfg.invL} onValueChange={(v) => esp.setInvert(v, cfg.invR, cfg.swap)} />
        <ToggleRow label="Inverter lado direito" value={cfg.invR} onValueChange={(v) => esp.setInvert(cfg.invL, v, cfg.swap)} />
        <ToggleRow label="Trocar lados" value={cfg.swap} onValueChange={(v) => esp.setInvert(cfg.invL, cfg.invR, v)} />
        <Button variant="dark" title="Executar diagnóstico" onPress={diag} disabled={!esp.connected} />
      </Card>

      <Card title="Dispositivo" color="#24324a" right={<Button small variant="outline" title="Atualizar" onPress={loadInfo} />}>
        {carregando ? (
          <ActivityIndicator color={colors.accent} />
        ) : info ? (
          [
            ['Firmware', info.firmware],
            ['Build', info.build],
            ['Rede', info.ssid],
            ['IP', info.ip],
            ['MAC', info.mac],
            ['Clientes', info.clients],
            ['Ligado há', formatUptime(info.uptime)],
            ['Memória livre', `${Math.round((info.heap || 0) / 1024)} KB`],
          ].map(([k, v]) => (
            <View key={k} style={[styles.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
              <Text style={styles.muted}>{k}</Text>
              <Text style={styles.text}>{String(v)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>Conecte-se ao carrinho para ver os dados.</Text>
        )}
      </Card>

      <Card title={`Conta: ${esp.user}`} color="#24324a">
        <Button testID="logout" variant="danger" title="Sair" onPress={logout} />
        <Text style={[styles.muted, { fontSize: 12, marginTop: 12, textAlign: 'center' }]}>
          BMP Tech · Módulo de Locomoção + Braço Robótico · app v1.0
        </Text>
      </Card>
    </ScrollView>
  );
}
