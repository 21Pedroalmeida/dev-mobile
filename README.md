# BMP Tech Car — App Mobile

App em **React Native (Expo SDK 54 — compatível com o Expo Go da App Store e da Play Store)** para controlar o carrinho 4×4 com braço robótico
do firmware `BMPTECH_Car_Controller` (ESP32-S3), via WebSocket (`ws://192.168.4.1/ws`).

## Requisitos do trabalho → onde estão

| Requisito | Implementação | Arquivos |
|---|---|---|
| **Recurso do celular** | **Vibração**, **Notificação** local e **WhatsApp** (compartilhar pose via `Linking`) | `src/services/deviceFeedback.js`, `src/services/whatsapp.js` |
| **FlatList** | Lista de **poses salvas** (+ SectionList no histórico) | `src/screens/PosesScreen.js`, `src/screens/HistoryScreen.js` |
| **Login com criptografia** | Senha nunca salva em texto puro: **hash SHA-256 com salt** (1000 rodadas), guardado no **SecureStore** | `src/services/passwordHasher.js`, `src/services/authService.js` |
| **Persistência de dados** | **AsyncStorage** por usuário (poses, histórico, configurações) + tela "Meus dados" com `getAllKeys`/`multiGet` | `src/services/storage.js`, `src/screens/DataScreen.js` |
| **Git** | Histórico de commits + **CI no GitHub Actions** rodando os testes | `.github/workflows/testes.yml` |
| **Mínimo de 3 telas** | 10 telas: Login, Cadastro, Controle, Braço, Poses, Detalhe da pose, Histórico, Configurações, Meus dados, Sobre | `src/screens/` |
| **Testes automatizados** | **Jest + Testing Library**: 78 testes (unitários, **mock do axios**, interface) | `__tests__/` |

## Conteúdo das aulas usado no app

| Aula | Conteúdo | Onde aparece |
|---|---|---|
| 1–2 | Expo, JSX, StyleSheet, `View`/`Text`/`TextInput`/`ScrollView`, `useState`, arrow functions | todas as telas |
| 2 | `ActivityIndicator` | carregamento do login e das informações do ESP32 |
| 2 | `Dimensions` / tela responsiva | joystick usa a largura da tela (`useWindowDimensions`) |
| 2 | **FlatList** e **SectionList** | Poses (FlatList) e Histórico agrupado por dia (SectionList) |
| 2 | `Linking.openURL` | botão "Compartilhar no WhatsApp" |
| 3 | **Modal** | "Salvar pose atual" (aba Braço) |
| 3 | **Stack + Tab + Drawer** e **navegação protegida** (`EstaLogado ? ... : ...`) | `App.js` |
| 3 | `navigation.navigate('Tela', {params})` / `route.params` | Poses → Detalhe da pose |
| 3–4 | `useEffect` | carregar dados salvos ao abrir o app |
| 4 | `JSON.stringify` / `JSON.parse`, funções `async`/`await` | `storage.js`, `authService.js` |
| 4 | **AsyncStorage** (`setItem`, `getItem`, `getAllKeys`, `multiGet`, `multiRemove`) | `storage.js`, tela Meus dados |
| 5 | Senha com **hash SHA-256** (nunca salvar a original) | `passwordHasher.js` (expo-crypto, pois o `react-native-hash` não roda no Expo Go) |
| 6 | **axios** GET em API | `espInfo.js` → `GET http://192.168.4.1/api/info` |
| 6 | **Jest** + **mock** de API + teste de interface | `__tests__/aulaRecursos.test.js`, `__tests__/screens.test.js` |
| 6 | Git e CI/CD | commits + GitHub Actions |
| Regex | validação com expressão regular | IP do ESP32, nome de usuário e nome de pose (`validators.js`) |

## Navegação (igual ao exercício da aula 3)

```
EstaLogado ? (
  Drawer
   ├─ Início → Tab
   │            ├─ Controle
   │            ├─ Braço
   │            ├─ Poses → Stack (Lista → Detalhe)
   │            └─ Histórico
   ├─ Configurações
   ├─ Meus dados
   └─ Sobre
) : (
  Stack
   ├─ Login
   └─ Cadastro
)
```

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
    validators.js           regex (IP, usuário, nome de pose)
    espInfo.js              axios GET /api/info
    whatsapp.js             compartilhar pose no WhatsApp (Linking)
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

## Rodando no iPhone

1. Instale o **Expo Go** pela App Store (ele roda projetos SDK 54, que é o deste app).
2. No computador (Windows/Mac/Linux, com Node.js 20+): `npm install` e `npx expo start`.
3. iPhone e computador no **mesmo Wi-Fi**. Abra a **Câmera** do iPhone e aponte para o QR code → "Abrir no Expo Go".
4. Quando o iOS perguntar sobre **"Rede Local"**, toque em **Permitir** (sem isso o app não acha o computador nem o ESP32).
   Se negou sem querer: Ajustes → Privacidade e Segurança → Rede Local → Expo Go.
5. Com o app aberto, vá em Ajustes → Wi-Fi e conecte no **BMPTECH-Car**. O app já carregado continua rodando
   (pode aparecer um aviso de que perdeu a conexão com o computador — pode ignorar).
6. No app: Config → desligue **Modo demonstração** → Reconectar.

Se a rede da faculdade bloquear a conexão celular↔computador, use `npx expo start --tunnel`.

## Observação sobre o Expo Go
Vibração, notificações locais, SecureStore e AsyncStorage funcionam no **Expo Go**.
Para gerar um APK: `npx eas-cli@latest build -p android --profile preview`
(o `app.json` já libera tráfego `ws://` sem TLS no Android, necessário para falar com o ESP32).
