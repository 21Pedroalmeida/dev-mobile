import axios from 'axios';
import { infoUrl } from './protocol';
import { SIMULATED_INFO } from './espSimulator';

/**
 * Chamada de API com AXIOS (aula 6): GET http://<ip>/api/info do ESP32.
 * Retorna { firmware, build, ssid, ip, mac, clients, uptime, heap }.
 */
export async function getDeviceInfo(host, demo = false) {
  if (demo) return SIMULATED_INFO;
  const response = await axios.get(infoUrl(host), { timeout: 4000 });
  return response.data;
}

export function formatUptime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min ${s % 60}s`;
}
