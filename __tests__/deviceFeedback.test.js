/**
 * TESTE com MOCK (aula 6): vibração e notificações do celular são trocadas por funções
 * falsas (jest.fn / jest.spyOn), e o teste confere se foram chamadas do jeito certo.
 * Rodar só este arquivo: npx jest __tests__/deviceFeedback.test.js
 */
import { Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { vibrate, notify, setupNotifications, PATTERNS } from '../src/services/deviceFeedback';

describe('Recursos do celular: vibração e notificação', () => {
  beforeEach(() => {
    jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  test('vibra com o padrão do PARAR TUDO', () => {
    vibrate('stop');
    expect(Vibration.vibrate).toHaveBeenCalledWith(PATTERNS.stop);
  });

  test('não vibra quando o usuário desativou a vibração', () => {
    vibrate('stop', false);
    expect(Vibration.vibrate).not.toHaveBeenCalled();
  });

  test('pede permissão e configura as notificações', async () => {
    await expect(setupNotifications()).resolves.toBe(true);
    expect(Notifications.setNotificationHandler).toHaveBeenCalled();
  });

  test('dispara notificação local imediata', async () => {
    await notify('BMP Tech conectado', 'Carrinho pronto');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: { title: 'BMP Tech conectado', body: 'Carrinho pronto' } }),
    );
  });

  test('não notifica quando desativado', async () => {
    await notify('x', 'y', false);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
