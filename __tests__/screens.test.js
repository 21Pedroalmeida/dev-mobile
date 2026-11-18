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

  test('renderiza um item por pose e aciona Aplicar/Excluir', async () => {
    const onApply = jest.fn();
    const onDelete = jest.fn();
    await render(
      <FlatList
        data={poses}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PoseItem pose={item} onApply={onApply} onDelete={onDelete} />}
      />,
    );
    expect(screen.getByText('Repouso')).toBeTruthy();
    expect(screen.getByText('Pegar')).toBeTruthy();
    expect(screen.getByText(/Garra 160°/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('apply-b'));
    expect(onApply).toHaveBeenCalledWith(poses[1]);
    await fireEvent.press(screen.getByTestId('delete-a'));
    expect(onDelete).toHaveBeenCalledWith(poses[0]);
  });
});
