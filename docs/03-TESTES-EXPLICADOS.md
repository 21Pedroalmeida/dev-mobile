# Testes automatizados explicados

**78 testes, 8 arquivos, todos passando.** Ferramentas: **Jest** + **jest-expo** + **Testing Library** (React Native). Rodar: `npm test`.
Os testes também rodam sozinhos no **GitHub Actions** a cada push (`.github/workflows/testes.yml`).

## Os 3 tipos de teste da aula 6 — onde estão

| Tipo (aula 6) | O que é | Arquivos |
|---|---|---|
| **Unitário** | Testa uma função sozinha, sem tela e sem internet | `passwordHasher`, `protocol`, `storage`, `authService` |
| **Com mock de API** | Troca a API real por uma falsa (`jest.mock('axios')`) | `aulaRecursos` (axios), `espClient` (WebSocket falso), `deviceFeedback` |
| **De interface** | Desenha a tela, "toca" nos botões e confere o que aparece | `screens` (Login, Cadastro, FlatList, Detalhe) |

| Arquivo | Testes | O que confere |
|---|---|---|
| `aulaRecursos.test.js` | 23 | axios com mock, regex do IP, WhatsApp, getAllKeys/multiGet, histórico por dia |
| `authService.test.js` | 12 | cadastro, login, senha errada, usuário repetido, sessão |
| `passwordHasher.test.js` | 8 | salt, hash SHA-256, senha certa/errada |
| `espClient.test.js` | 8 | conexão, reenvio a cada 70 ms, PARAR, reconexão |
| `storage.test.js` | 8 | salvar, excluir, separar dados por usuário |
| `screens.test.js` | 8 | telas de Login, Cadastro, FlatList e Detalhe |
| `protocol.test.js` | 6 | comandos JSON, joystick, rodas |
| `deviceFeedback.test.js` | 5 | vibração e notificação |

Cobertura (`npm run test:coverage`): os serviços principais ficam entre **89% e 100%** (senha 100%, axios 100%, regex 100%, AsyncStorage 98%, WebSocket 89%). O total do projeto é **cerca de 68%**, porque partes visuais e o simulador não são testadas.

## Como um teste funciona

```js
describe('Login com criptografia', () => {        // grupo de testes
  test('login com senha errada é recusado', async () => {   // um teste
    // 1. PREPARA
    const { auth } = setup();
    await auth.register('joao', 'abc12345');
    // 2. EXECUTA  +  3. CONFERE
    await expect(auth.login('joao', 'errada99')).rejects.toMatchObject({ code: 'credentials' });
  });
});
```

- `describe` agrupa; `test` é um teste; `expect(...)` confere. Se não bater, aparece **FAIL**.

## Exemplo 1 — Unitário: a senha nunca é salva (`authService.test.js`)

```js
test('cadastra usuário salvando apenas salt + hash (nunca a senha)', async () => {
  const { store, auth } = setup();                        // cofre falso na memória
  await auth.register('Maria', 'senha123', 'senha123');
  const saved = JSON.parse(store.data.get('bmp_user_maria'));
  expect(saved.salt).toMatch(/^[0-9a-f]{32}$/);            // salt de 16 bytes
  expect(saved.hash).toMatch(/^[0-9a-f]{64}$/);            // hash SHA-256
  expect(JSON.stringify(saved)).not.toContain('senha123'); // a senha NÃO aparece
});
```

## Exemplo 2 — Mock de API, igual à aula 6 (`aulaRecursos.test.js`)

```js
jest.mock('axios');                                  // axios falso

test('busca /api/info no IP configurado', async () => {
  axios.get.mockImplementation((url) =>
    url === 'http://192.168.4.1/api/info'
      ? Promise.resolve({ data: { firmware: 'v1.2', ip: '192.168.4.1', clients: 1 } })
      : Promise.reject(new Error('url errada')));
  await expect(getDeviceInfo('192.168.4.1')).resolves.toEqual({ firmware: 'v1.2', ip: '192.168.4.1', clients: 1 });
  expect(axios.get).toHaveBeenCalledWith('http://192.168.4.1/api/info', { timeout: 4000 });
});
```

**Por que mock?** O teste roda sem o carrinho ligado e sem internet, sempre com o mesmo resultado.

## Exemplo 3 — Mock + relógio falso (`espClient.test.js`)

```js
jest.useFakeTimers();                               // o teste controla o tempo

test('joystick pressionado reenvia o vetor a cada 70 ms', () => {
  const { ws, client } = connected();               // WebSocket falso conectado
  client.setVector(30, 80);
  client.beginHold();
  jest.advanceTimersByTime(700);                    // "pula" 700 ms
  const moves = ws.sent.filter((m) => m.cmd === 'move');
  expect(moves.length).toBeGreaterThanOrEqual(10);  // 700 / 70 = 10 envios
});
```

## Exemplo 4 — Interface (`screens.test.js`)

```js
test('mostra erro quando os campos estão vazios', async () => {
  await renderWithAuth(<LoginScreen navigation={{ navigate: jest.fn() }} />);  // desenha a tela
  await fireEvent.press(screen.getByTestId('login-submit'));                  // toca em "Entrar"
  expect(await screen.findByTestId('login-error'))
    .toHaveTextContent('Preencha usuário e senha.');                          // confere a mensagem
});
```

## Glossário rápido

| Termo | Significado |
|---|---|
| `jest.fn()` | Função falsa que registra se foi chamada e com o quê |
| `jest.spyOn(obj, 'metodo')` | "Espiona" uma função real (ex.: `Linking.openURL`) |
| `jest.mock('axios')` | Troca a biblioteca inteira por uma falsa |
| `mockResolvedValue(x)` | A função falsa devolve `x` (como uma Promise que deu certo) |
| `jest.useFakeTimers()` | Relógio falso; `advanceTimersByTime(ms)` avança o tempo |
| `render` / `fireEvent` / `screen` | Testing Library: desenhar, tocar, procurar na tela |
| `toBe`, `toEqual`, `toMatch`, `toContain` | Formas de comparar no `expect` |
