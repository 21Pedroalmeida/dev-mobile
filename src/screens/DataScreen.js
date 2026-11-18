import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, styles } from '../components/ui';
import { useEsp } from '../context/EspContext';
import { listUserData } from '../services/storage';
import { colors } from '../theme';

const NOMES = { settings: 'Configurações', poses: 'Poses do braço', history: 'Histórico' };

/**
 * Mostra tudo o que o app salvou no celular para este usuário.
 * Usa AsyncStorage.getAllKeys() + AsyncStorage.multiGet() (aula 4).
 */
export default function DataScreen({ navigation }) {
  const esp = useEsp();
  const [dados, setDados] = useState(null);

  const carregar = useCallback(async () => setDados(await listUserData(esp.user)), [esp.user]);

  // recarrega sempre que a tela ganha foco
  useEffect(() => navigation?.addListener?.('focus', carregar), [navigation, carregar]);
  useEffect(() => {
    carregar();
  }, [carregar, esp.poses, esp.history]);

  const apagar = () =>
    Alert.alert('Apagar dados', 'Apagar poses, histórico e configurações deste usuário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await esp.clearAllData();
          carregar();
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title={`Dados salvos de ${esp.user}`}>
        {!dados ? (
          <ActivityIndicator color={colors.accent} />
        ) : dados.length === 0 ? (
          <Text style={styles.muted}>Nada salvo ainda.</Text>
        ) : (
          dados.map((d) => (
            <View key={d.key} style={{ marginBottom: 12 }}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.text}>{NOMES[d.nome] || d.nome}</Text>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>
                  {d.itens} {d.itens === 1 ? 'registro' : 'registros'}
                </Text>
              </View>
              <Text style={[styles.muted, { fontSize: 11 }]}>
                chave: {d.key} · {d.bytes} bytes
              </Text>
            </View>
          ))
        )}
      </Card>
      <Text style={[styles.muted, { fontSize: 12, marginBottom: 14 }]}>
        Os dados ficam no AsyncStorage do celular e continuam lá quando o app é fechado. A senha não aparece aqui: ela
        fica criptografada (hash) no armazenamento seguro.
      </Text>
      <Button title="Apagar meus dados" variant="danger" onPress={apagar} />
    </ScrollView>
  );
}
