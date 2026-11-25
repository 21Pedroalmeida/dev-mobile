# Como rodar o app e abrir no VS Code

## 1. Preparar o computador (só na primeira vez)

1. Instale o **Node.js** (versão LTS): https://nodejs.org
2. Instale o **VS Code**: https://code.visualstudio.com
3. Baixe o projeto:
   - pelo GitHub: botão verde **Code → Download ZIP** e descompacte; **ou**
   - pelo terminal: `git clone https://github.com/21Pedroalmeida/dev-mobile.git`

## 2. Abrir no VS Code

1. Abra o VS Code → **File → Open Folder** → escolha a pasta `dev-mobile`.
2. O VS Code vai sugerir extensões (Expo Tools e Jest). Clique em **Install All**.
3. Abra o terminal do VS Code: menu **Terminal → New Terminal** (ou `Ctrl + '`).
4. Rode uma vez: `npm install` (instala as bibliotecas; leva 1–3 minutos).

### Onde está cada coisa (painel da esquerda)

| Pasta / arquivo | O que tem |
|---|---|
| `App.js` | Navegação: Stack (login), Drawer (menu), Tab (abas) |
| `src/screens/` | As 10 telas |
| `src/services/` | A lógica: senha, WebSocket, AsyncStorage, axios, regex, WhatsApp |
| `src/context/` | Estado global: usuário logado e conexão com o carrinho |
| `src/components/` | Joystick e componentes visuais |
| `__tests__/` | Os 78 testes automatizados |
| `docs/` | Estas explicações |

## 3. Mostrar o app no computador (apresentação)

No terminal do VS Code:

```
npx expo start --web
```

O app abre no navegador em `http://localhost:8081` (ou rode `npx expo start` e aperte **w**). Para ficar com formato de celular: **F12** e depois **Ctrl + Shift + M**.
No navegador não há vibração, notificação nem as janelas de confirmação; isso só aparece no celular.

## 4. Rodar no celular

1. No terminal do VS Code: `npx expo start` → aparece um **QR code**.
2. Celular e computador no **mesmo Wi-Fi**.
3. Instale o **Expo Go** no celular (Play Store / App Store).
4. Android: abra o Expo Go → *Scan QR code*. iPhone: aponte a **Câmera** para o QR code.
5. No iPhone, permita **Rede Local** quando pedir.
6. O app abre em **modo demonstração** (carrinho simulado). Crie uma conta.

Para o carrinho de verdade: com o app aberto, conecte o celular no Wi-Fi **BMPTECH-Car** (senha `12345678`) → menu → **Configurações** → desligue **Modo demonstração**.

**Problemas comuns**
- QR code não conecta (Wi-Fi da faculdade): `npx expo start --tunnel`
- "Projeto incompatível com o Expo Go": o projeto usa o **Expo SDK 54**; no Android, baixe o Expo Go para o SDK 54 em https://expo.dev/go
- Tela vermelha: `Ctrl + C` no terminal e `npx expo start -c`

## 5. Rodar os testes

| Comando | O que faz |
|---|---|
| `npm test` | Roda os 78 testes (uns 5 segundos) |
| `npx jest __tests__/aulaRecursos.test.js` | Roda só um arquivo |
| `npx jest --verbose` | Mostra o nome de cada teste |
| `npm run test:coverage` | Mostra quanto do código os testes cobrem |

**Mostrar um teste falhando (bom para a apresentação):** abra `__tests__/protocol.test.js`, troque um número esperado (por exemplo `x: 100` por `x: 99`), salve e rode `npm test`: aparece **FAIL** em vermelho, com o valor esperado e o recebido. Desfaça (`Ctrl + Z`), salve e rode de novo: volta a passar.
