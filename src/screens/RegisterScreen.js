import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateCredentials, MIN_PASSWORD } from '../services/authService';
import { Button, Card, Field, styles } from '../components/ui';
import { colors } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const invalid = validateCredentials(username, password);
    if (invalid) return setError(invalid);
    if (password !== confirm) return setError('As senhas não conferem.');
    setError('');
    setLoading(true);
    try {
      await register(username, password, confirm);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Nova conta" color={colors.accent}>
          <Field
            label="Usuário"
            testID="register-username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="3 a 20 caracteres"
          />
          <Field
            label="Senha"
            testID="register-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={`mínimo ${MIN_PASSWORD} caracteres`}
          />
          <Field
            label="Confirmar senha"
            testID="register-confirm"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            onSubmitEditing={handleRegister}
          />
          {error ? (
            <Text testID="register-error" style={{ color: colors.danger, marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <Button testID="register-submit" title="Cadastrar" variant="accent" onPress={handleRegister} loading={loading} />
          <Button title="Já tenho conta" variant="outline" style={{ marginTop: 10 }} onPress={() => navigation.goBack()} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
