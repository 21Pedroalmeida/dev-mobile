# BMP Tech Car — App Mobile

App em **React Native (Expo SDK 58)** para controlar o carrinho 4×4 com braço robótico
do firmware `BMPTECH_Car_Controller` (ESP32-S3), via WebSocket (`ws://192.168.4.1/ws`).

## Requisitos do trabalho → onde estão

| Requisito | Implementação | Arquivos |
|---|---|---|
| **Recurso do celular** | **Vibração** (joystick, PARAR TUDO, conectar/desconectar) e **Notificação local** (carrinho conectou/desconectou) | `src/services/deviceFeedback.js`, `src/context/EspContext.js` |
| **FlatList** | Lista de **poses salvas** do braço e **histórico** de eventos | `src/screens/PosesScreen.js`, `src/screens/HistoryScreen.js` |
| **Login com criptografia** | Senha nunca salva em texto puro: **salt aleatório (16 bytes) + SHA-256 com 1000 rodadas** (key stretching), comparação em tempo constante, guardado no **SecureStore** (Keychain/Keystore) | `src/services/passwordHasher.js`, `src/services/authService.js` |
| **Persistência de dados** | **AsyncStorage** por usuário: poses, histórico, configurações (IP, modo demo, vibração, notificações). Usuários e sessão no SecureStore | `src/services/storage.js` |
| **Git** | Repositório com histórico de commits (`git log`) | — |
| **Mínimo de 3 telas** | 7 telas: Login, Cadastro, Controle, Braço, Poses, Histórico, Config | `src/screens/` |
| **Testes automatizados** | **Jest + React Native Testing Library**: 54 testes (criptografia, login, persistência, protocolo, WebSocket, vibração/notificação, telas e FlatList) | `__tests__/` |

## Como rodar

```bash
npm install
npx expo start          # escaneie o QR code com o app Expo Go
npm test                # roda os testes automatizados
npm run test:coverage   # testes + relatório de cobertura
```

### Usando com o carrinho
1. Grave o firmware e a pasta `data/` no ESP32 (ver README do firmware).
2. Conecte o celular ao Wi-Fi **BMPTECH-Car** (senha `12345678`). Se o Android disser "sem internet", escolha **manter conectado** (e, se precisar, desligue os dados móveis).
3. No app: **Config → desligue "Modo demonstração"** → confira o IP `192.168.4.1` → Reconectar.

### Modo demonstração
Vem **ligado** por padrão: simula o ESP32 dentro do app, para apresentar e testar sem o carrinho.

## Estrutura

```
App.js                      navegação (Stack de login + Tabs principais)
src/
  context/AuthContext.js    sessão do usuário
  context/EspContext.js     conexão com o carrinho + dados persistidos
  services/
    passwordHasher.js       salt + SHA-256 + key stretching
    authService.js          cadastro / login / logout / sessão
    storage.js              persistência (AsyncStorage)
    protocol.js             comandos JSON do firmware, joystick, mistura das rodas
    espClient.js            WebSocket com reconexão e keepalive de 70 ms
    espSimulator.js         ESP32 simulado (modo demonstração)
    deviceFeedback.js       vibração + notificações
  components/               Joystick, botões, cards, badge de status
  screens/                  telas
__tests__/                  testes automatizados
```

## Protocolo usado (firmware v1.2)

| App → ESP32 | Ação |
|---|---|
| `{"cmd":"move","x":-100..100,"y":-100..100}` | joystick (reenviado a cada 70 ms; o firmware para os motores após 500 ms sem comando) |
| `{"cmd":"servo","i":0..3,"a":ângulo}` | 0 Base · 1 Ombro · 2 Cotovelo · 3 Garra |
| `{"cmd":"speed","v":0..100}` | velocidade máxima |
| `{"cmd":"stop"}` / `{"cmd":"gohome"}` / `{"cmd":"diag"}` | parar / braço em home / diagnóstico |
| `{"cmd":"setinvert","l":bool,"r":bool,"s":bool}` | inversão das rodas |
| `{"cmd":"getcfg"}` | pede a configuração (`{"type":"cfg",...}`) |

`GET /api/info` → dados do dispositivo (tela Config).

## Observação sobre o Expo Go
Vibração, notificações locais, SecureStore e AsyncStorage funcionam no **Expo Go**.
Para gerar um APK: `npx eas-cli@latest build -p android --profile preview`
(o `app.json` já libera tráfego `ws://` sem TLS no Android, necessário para falar com o ESP32).
