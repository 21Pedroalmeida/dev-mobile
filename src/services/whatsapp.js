import { Linking } from 'react-native';
import { JOINT_NAMES } from './protocol';

/**
 * RECURSO DO CELULAR: WhatsApp (aula 6 — "Recursos de celular").
 * Usa o Linking (aula 2) para abrir o WhatsApp com a mensagem pronta.
 * O link https://wa.me/?text=... funciona no Android e no iPhone.
 */

export function poseMessage(pose) {
  const angulos = pose.angles.map((a, i) => `${JOINT_NAMES[i]}: ${a}°`).join('\n');
  return `🦾 Pose "${pose.name}" do braço BMP Tech\n${angulos}`;
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function sharePoseOnWhatsApp(pose) {
  const url = whatsappUrl(poseMessage(pose));
  await Linking.openURL(url);
  return url;
}
