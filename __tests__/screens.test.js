/**
 * TESTE DE INTERFACE (aula 6): usa a Testing Library para desenhar a tela (render),
 * "tocar" nos botões (fireEvent) e conferir o que aparece (expect). Telas: Login, Cadastro, FlatList e Detalhe.
 * Rodar só este arquivo: npx jest __tests__/screens.test.js
 */
import React from 'react';
import { FlatList } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../src/context/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import { PoseItem } from '../src/screens/PosesScreen';
import { createAuthService } from '../src/services/authService';
import { memoryStore, nodeDigest, nodeRandomBytes } from '../test-utils/helpers';

const makeAuth = () =>
  createAuthService({ store: memoryStore(), digest: nodeDigest, randomBytes: nodeRandomBytes, iterations: 5 });

async function renderWithAuth(ui, service = makeAuth()) {
  await render(<AuthProvider service={service}>{ui}</AuthProvider>);
  return service;
}

async function existingUser() {
  const service = makeAuth();
  await service.register('maria', 'senha123');
  await service.logout();
  return service;
}

describe('Tela de Login', () => {
  test('mostra erro quando os campos estão vazios', async () => {
    await renderWithAuth(<LoginScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('login-error')).toHaveTextContent('Preencha usuário e senha.');
  });

  test('mostra erro com senha errada', async () => {
    await renderWithAuth(<LoginScreen navigation={{ navigate: jest.fn() }} />, await existingUser());
    await fireEvent.changeText(screen.getByTestId('login-username'), 'maria');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'errada00');
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('login-error')).toHaveTextContent('Usuário ou senha inválidos.');
  });

  test('faz login com a senha certa', async () => {
    const service = await existingUser();
    const spy = jest.spyOn(service, 'login');
    await renderWithAuth(<LoginScreen navigation={{ navigate: jest.fn() }} />, service);
    await fireEvent.changeText(screen.getByTestId('login-username'), 'maria');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'senha123');
    await fireEvent.press(screen.getByTestId('login-submit'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('maria', 'senha123'));
    expect(await service.restoreSession()).toEqual({ username: 'maria' });
    expect(screen.queryByTestId('login-error')).toBeNull();
  });

  test('botão Criar conta navega para o Cadastro', async () => {
    const navigate = jest.fn();
    await renderWithAuth(<LoginScreen navigation={{ navigate }} />);
    await fireEvent.press(screen.getByTestId('go-register'));
    expect(navigate).toHaveBeenCalledWith('Cadastro');
  });
});

describe('Tela de Cadastro', () => {
  test('recusa senhas diferentes', async () => {
    await renderWithAuth(<RegisterScreen navigation={{ goBack: jest.fn() }} />);
    await fireEvent.changeText(screen.getByTestId('register-username'), 'novo.user');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'senha123');
    await fireEvent.changeText(screen.getByTestId('register-confirm'), 'senha999');
    await fireEvent.press(screen.getByTestId('register-submit'));
    expect(await screen.findByTestId('register-error')).toHaveTextContent('As senhas não conferem.');
  });

  test('cadastra um usuário válido', async () => {
    const service = makeAuth();
    const spy = jest.spyOn(service, 'register');
    await renderWithAuth(<RegisterScreen navigation={{ goBack: jest.fn() }} />, service);
    await fireEvent.changeText(screen.getByTestId('register-username'), 'novo.user');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'senha123');
    await fireEvent.changeText(screen.getByTestId('register-confirm'), 'senha123');
    await fireEvent.press(screen.getByTestId('register-submit'));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(await service.restoreSession()).toEqual({ username: 'novo.user' });
  });
});

describe('FlatList de poses', () => {
  const poses = [
    { id: 'a', name: 'Repouso', angles: [90, 90, 90, 20] },
    { id: 'b', name: 'Pegar', angles: [90, 60, 120, 160] },
  ];

  test('renderiza um item por pose e aciona Aplicar / abrir Detalhe', async () => {
    const onApply = jest.fn();
    const onOpen = jest.fn();
    await render(
      <FlatList
        data={poses}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PoseItem pose={item} onApply={onApply} onOpen={onOpen} />}
      />,
    );
    expect(screen.getByText('Repouso')).toBeTruthy();
    expect(screen.getByText('Pegar')).toBeTruthy();
    expect(screen.getByText(/Garra 160°/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('apply-b'));
    expect(onApply).toHaveBeenCalledWith(poses[1]);
    await fireEvent.press(screen.getByTestId('pose-a'));
    expect(onOpen).toHaveBeenCalledWith(poses[0]);
  });
});

describe('Navegação com parâmetros (Detalhe da pose)', () => {
  test('lê a pose de route.params e compartilha no WhatsApp', async () => {
    const { Linking } = require('react-native');
    const PoseDetailScreen = require('../src/screens/PoseDetailScreen').default;
    jest.spyOn(require('../src/context/EspContext'), 'useEsp').mockReturnValue({ applyPose: jest.fn(), removePose: jest.fn() });
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const pose = { id: 'x', name: 'Acenar', angles: [10, 20, 30, 40] };
    await render(<PoseDetailScreen navigation={{ goBack: jest.fn() }} route={{ params: { pose } }} />);
    expect(screen.getByText('Acenar')).toBeTruthy();
    expect(screen.getByText('40°')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('detail-whatsapp'));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/?text='));
  });
});
