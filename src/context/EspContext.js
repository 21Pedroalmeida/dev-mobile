import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EspClient } from '../services/espClient';
import { createSimulatedWebSocket } from '../services/espSimulator';
import { cmd, wsUrl, DEFAULT_CFG } from '../services/protocol';
import * as storage from '../services/storage';
import { vibrate, notify, setupNotifications } from '../services/deviceFeedback';

const EspContext = createContext(null);

/**
 * Estado global da conexão com o carrinho + dados persistidos do usuário
 * (configurações, poses e histórico).
 */
export function EspProvider({ user, children }) {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState('idle');
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [poses, setPoses] = useState([]);
  const [history, setHistory] = useState([]);
  const clientRef = useRef(null);
  const prevStatus = useRef('idle');
  const settingsRef = useRef(null);
  settingsRef.current = settings;

  const log = useCallback(
    async (type, message) => setHistory(await storage.addHistory(user, type, message)),
    [user],
  );

  // Carrega dados persistidos do usuário (useEffect roda depois da 1ª renderização — aula 3/4)
  const loadData = useCallback(async () => {
    const [s, p, h] = await Promise.all([storage.loadSettings(user), storage.loadPoses(user), storage.loadHistory(user)]);
    setSettings(s);
    setPoses(p);
    setHistory(h);
    return s;
  }, [user]);

  useEffect(() => {
    loadData().then((s) => {
      if (s.notifications) setupNotifications().catch(() => {});
    });
  }, [loadData]);

  // Reação às mudanças de conexão: vibra, notifica e registra no histórico
  const handleStatus = useCallback(
    (s) => {
      setStatus(s);
      const before = prevStatus.current;
      prevStatus.current = s;
      const st = settingsRef.current || storage.DEFAULT_SETTINGS;
      const where = st.demo ? 'ESP32 simulado' : st.host;
      if (s === 'connected' && before !== 'connected') {
        vibrate('connected', st.vibration);
        notify('BMP Tech conectado', `Carrinho pronto (${where}).`, st.notifications);
        log('conexao', `Conectado a ${where}`);
      } else if (s === 'disconnected' && before === 'connected') {
        vibrate('disconnected', st.vibration);
        notify('BMP Tech desconectado', 'A conexão com o carrinho caiu. Tentando reconectar…', st.notifications);
        log('conexao', 'Conexão perdida');
      }
    },
    [log],
  );

  // (Re)cria o cliente quando IP ou modo demonstração mudam
  useEffect(() => {
    if (!settings) return undefined;
    const client = new EspClient({
      url: wsUrl(settings.host),
      WebSocketImpl: settings.demo ? createSimulatedWebSocket() : undefined,
      onStatus: handleStatus,
      onConfig: setCfg,
    });
    clientRef.current = client;
    prevStatus.current = 'idle';
    client.connect();
    return () => client.disconnect();
  }, [settings?.host, settings?.demo, handleStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback((obj) => clientRef.current?.send(obj) ?? false, []);

  const api = useMemo(() => {
    const vib = (k) => vibrate(k, settings?.vibration !== false);
    return {
      user,
      settings,
      status,
      cfg,
      poses,
      history,
      connected: status === 'connected',
      vibrate: vib,
      async updateSettings(patch) {
        const next = { ...settings, ...patch };
        setSettings(next);
        await storage.saveSettings(user, next);
        if (patch.notifications) setupNotifications().catch(() => {});
      },
      reconnect() {
        clientRef.current?.disconnect();
        clientRef.current?.connect();
      },
      joystickStart: () => {
        vib('tap');
        clientRef.current?.beginHold();
      },
      joystickMove: (x, y) => clientRef.current?.setVector(x, y),
      joystickEnd: () => clientRef.current?.endHold(),
      stopAll() {
        vib('stop');
        clientRef.current?.stopAll();
        log('comando', 'PARAR TUDO');
      },
      setSpeed(v) {
        setCfg((c) => ({ ...c, speed: v }));
        send(cmd.speed(v));
        log('comando', `Velocidade máxima ${v}%`);
      },
      setServo(i, a) {
        setCfg((c) => {
          const pos = c.pos.slice();
          pos[i] = a;
          return { ...c, pos };
        });
        send(cmd.servo(i, a));
      },
      applyPose(pose) {
        pose.angles.forEach((a, i) => api.setServo(i, Math.min(cfg.max[i], Math.max(cfg.min[i], a))));
        vib('tap');
        log('pose', `Pose aplicada: ${pose.name}`);
      },
      goHome() {
        send(cmd.goHome());
        setCfg((c) => ({ ...c, pos: c.home.slice() }));
        log('pose', 'Braço para posição inicial');
      },
      async savePose(name, angles) {
        const next = await storage.addPose(user, name, angles);
        setPoses(next);
        log('pose', `Pose salva: ${String(name).trim()}`);
      },
      async removePose(id) {
        setPoses(await storage.deletePose(user, id));
      },
      setInvert(l, r, s) {
        setCfg((c) => ({ ...c, invL: l, invR: r, swap: s }));
        send(cmd.setInvert(l, r, s));
        log('config', `Inversão: esq=${l ? 'sim' : 'não'} dir=${r ? 'sim' : 'não'} troca=${s ? 'sim' : 'não'}`);
      },
      runDiag() {
        send(cmd.diag());
        log('config', 'Diagnóstico executado');
      },
      async clearHistory() {
        setHistory(await storage.clearHistory(user));
      },
      async clearAllData() {
        const n = await storage.clearUserData(user);
        await loadData();
        return n;
      },
      log,
    };
  }, [user, settings, status, cfg, poses, history, send, log, loadData]);

  return <EspContext.Provider value={api}>{children}</EspContext.Provider>;
}

export function useEsp() {
  const ctx = useContext(EspContext);
  if (!ctx) throw new Error('useEsp precisa estar dentro de <EspProvider>');
  return ctx;
}
