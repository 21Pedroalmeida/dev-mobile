# Código explicado

Visão geral: o celular conecta no Wi-Fi do carrinho (ESP32) e manda comandos em JSON por **WebSocket**. O app tem login com **hash de senha**, guarda dados com **AsyncStorage** e usa **vibração, notificação e WhatsApp**.

```
App.js ─ navegação (Stack / Drawer / Tab)
 ├─ src/context/AuthContext.js   quem está logado
 ├─ src/context/EspContext.js    conexão com o carrinho + dados salvos
 ├─ src/screens/*                as telas
 └─ src/services/*               a lógica (sem tela)
```

---

## 1. Navegação protegida — `App.js`

```js
return user ? (                       // tem usuário logado?
  <EspProvider user={user.username}>  // sim: conecta ao carrinho
    <MainDrawer />                    //      e mostra o menu lateral (Drawer)
  </EspProvider>
) : (
  <Stack.Navigator>                   // não: só Login e Cadastro
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Cadastro" component={RegisterScreen} />
  </Stack.Navigator>
);
```

**Como explicar:** é o `EstaLogado ? ... : ...` da aula 3. Sem login, as outras telas nem existem. Dentro do Drawer, a tela **Início** é um **Tab** (Controle, Braço, Poses, Histórico) e a aba Poses tem um **Stack** (Lista → Detalhe).

---

## 2. Senha com hash — `src/services/passwordHasher.js` e `authService.js`

```js
export async function hashPassword(password, salt, digest, iterations = 1000) {
  let hash = await digest(`${salt}:${password}`);   // SHA-256(salt + senha)
  for (let i = 1; i < iterations; i++) {
    hash = await digest(`${salt}:${hash}`);         // repete 1000 vezes
  }
  return hash;
}
```

No **cadastro**: sorteia um salt de 16 bytes, calcula o hash e salva `{ username, salt, hash }` no **SecureStore**. A senha nunca é salva.
No **login**: calcula o hash da senha digitada com o mesmo salt e compara. Usuário inexistente e senha errada dão a mesma mensagem.

**Como explicar:** "Hash é só de ida: nem nós conseguimos descobrir a senha. O salt faz senhas iguais terem hashes diferentes."

---

## 3. Conexão com o carrinho — `src/services/espClient.js`

```js
const ws = new WebSocket('ws://192.168.4.1/ws');  // abre a conexão
ws.onopen    = () => this.setStatus('connected'); // conectou: vibra e notifica
ws.onmessage = (e) => this.onConfig(parseMessage(e.data)); // resposta do ESP32
ws.onclose   = () => this.scheduleReconnect();    // caiu: tenta de novo em 1,5 s
```

```js
beginHold() {   // dedo no joystick
  this.holdTimer = setInterval(() => this.send(cmd.move(x, y)), 70);  // a cada 70 ms
}
endHold() {     // soltou
  clearInterval(this.holdTimer);
  this.send(cmd.move(0, 0));                       // manda parar uma vez
}
```

**Como explicar:** "O firmware para os motores se ficar 500 ms sem comando. Por isso repetimos a cada 70 ms. Se o sinal cair, o carrinho para sozinho."

Comandos JSON (`src/services/protocol.js`): `move`, `servo`, `speed`, `stop`, `gohome`, `setinvert`, `diag`, `getcfg`.

---

## 4. FlatList e parâmetros — `src/screens/PosesScreen.js` e `PoseDetailScreen.js`

```js
<FlatList
  data={esp.poses}                                   // os dados
  keyExtractor={(item) => item.id}                   // id de cada item
  renderItem={({ item }) => (                        // como desenhar cada um
    <PoseItem pose={item}
      onOpen={(pose) => navigation.navigate('DetalhePose', { pose })} />
  )}
/>
```
```js
const { pose } = route.params;   // na tela de detalhe
```

## 5. Modal — `src/screens/ArmScreen.js`

```js
const [modalVisible, setModalVisible] = useState(false);
<Modal visible={modalVisible} animationType="slide" transparent> ... </Modal>
```

## 6. SectionList — `src/screens/HistoryScreen.js`

Histórico agrupado por dia ("Hoje", "Ontem", data) com `sections` e `renderSectionHeader`.

---

## 7. Persistência — `src/services/storage.js`

```js
await AsyncStorage.setItem(`@bmptech/${user}/poses`, JSON.stringify(poses));  // salvar
const poses = JSON.parse(await AsyncStorage.getItem(`@bmptech/${user}/poses`)); // ler
const keys = await AsyncStorage.getAllKeys();      // tela "Meus dados"
const pares = await AsyncStorage.multiGet(keys);
```

**Como explicar:** "AsyncStorage guarda texto; usamos JSON. Cada usuário tem suas chaves."

---

## 8. Recursos do celular, axios e regex

| Arquivo | O que faz | Código-chave |
|---|---|---|
| `deviceFeedback.js` | Vibração e notificação | `Vibration.vibrate([0,120,80,120])`, `Notifications.scheduleNotificationAsync(...)` |
| `whatsapp.js` | Compartilhar pose | `Linking.openURL('https://wa.me/?text=' + encodeURIComponent(msg))` |
| `espInfo.js` | Info do carrinho (aula 6) | `axios.get('http://192.168.4.1/api/info', { timeout: 4000 })` |
| `validators.js` | Validar IP (aula de Regex) | `^(octeto\.){3}octeto$`, octeto = `25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d` |
| `espSimulator.js` | Modo demonstração | Um WebSocket "de mentira" que responde como o ESP32 |
