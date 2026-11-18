import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Field, styles } from '../components/ui';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!username.trim() || !password) {
      setError('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
    } catch (e) {
      setError(e.message || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.text }}>
            BMP <Text style={{ color: colors.accent }}>Tech</Text>
          </Text>
          <Text style={[styles.muted, { marginTop: 6 }]}>Controle do carrinho e braço robótico</Text>
        </View>

        <Card title="Entrar">
          <Field
            label="Usuário"
            testID="login-username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="seu.usuario"
          />
          <Field
            label="Senha"
            testID="login-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••"
            onSubmitEditing={handleLogin}
          />
          {error ? (
            <Text testID="login-error" style={{ color: colors.danger, marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <Button testID="login-submit" title="Entrar" onPress={handleLogin} loading={loading} />
          <Button
            testID="go-register"
            title="Criar conta"
            variant="outline"
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('Cadastro')}
          />
        </Card>
        <Text style={[styles.muted, { textAlign: 'center', fontSize: 12 }]}>
          🔒 Senhas protegidas com salt + SHA-256 e armazenamento seguro do aparelho
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
