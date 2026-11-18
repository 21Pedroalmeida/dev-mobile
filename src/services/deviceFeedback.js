import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * RECURSOS DO CELULAR:
 *  - Vibração (API Vibration do React Native)
 *  - Notificações locais (expo-notifications)
 */

export const PATTERNS = {
  tap: 30,              // toque no joystick / botão
  stop: [0, 120, 80, 120], // PARAR TUDO
  connected: [0, 60, 60, 60],
  disconnected: [0, 400],
};

export function vibrate(kind, enabled = true) {
  if (!enabled) return;
  const p = PATTERNS[kind] ?? PATTERNS.tap;
  Vibration.vibrate(p);
}

let configured = false;
export async function setupNotifications() {
  if (configured) return true;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('carro', {
      name: 'Status do carro',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export async function notify(title, body, enabled = true) {
  if (!enabled) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: Platform.OS === 'android' ? { channelId: 'carro' } : null,
    });
  } catch {
    // notificação é um extra: nunca deve derrubar o app
  }
}
