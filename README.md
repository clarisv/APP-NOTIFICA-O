# Lembretes — Atividade de Ciclo de Vida e Notificação

App de lembretes em **React Native + Expo (TypeScript)** feito para a atividade da aula 07 (Prof. Filipe Lopes).

## Requisitos da atividade

| Requisito | Onde está |
|---|---|
| Criar lembrete personalizado | Aba **Novo** (`src/screens/NovoLembreteScreen.tsx`) |
| Nome, descrição, horário e recorrência | Campos Título, Descrição, Horário e Repetição (Única / Diária) |
| Concluir ou adiar pela notificação | Botões **Concluir** e **Adiar 10 min** (`src/notifications.ts`) |
| Cancelar notificações | Aba **Agendados**: lixeira em cada item + **Cancelar todos** |
| Navegação | Abas (`@react-navigation/bottom-tabs`) |

## Conceitos da aula aplicados

- **Ciclo de vida do componente:** `useEffect` com cleanup no `LembretesProvider` registra e remove os listeners de notificação.
- **Ciclo de vida da tela:** `useFocusEffect` na tela Agendados recarrega a lista sempre que a aba ganha foco.
- **Ciclo de vida do app:** `AppState.addEventListener('change')` atualiza os dados quando o app volta para o primeiro plano.
- **Closures:** `useRef` guarda a lista mais recente para que os listeners (criados uma vez só) não usem dados antigos.
- **Notificação local e interna:** `Alert.alert` para confirmações e avisos.
- **Notificação local e externa:** `expo-notifications` com permissão, canal Android, categoria com ações e gatilhos `DAILY`, `DATE` e `TIME_INTERVAL`.

## Como rodar

1. Instale o app **Expo Go** no celular Android (Play Store).
2. No computador, dentro da pasta do projeto:
   ```bash
   npm install
   npx expo start
   ```
3. Escaneie o QR Code com o Expo Go (celular e computador na mesma rede Wi-Fi).
   - Se a rede bloquear, use `npx expo start --tunnel`.
4. Aceite a permissão de notificações.

**Teste rápido:** preencha um título e toque em **"Testar agora (chega em 10 s)"**. Minimize o app, espere a notificação, expanda-a e use **Concluir** ou **Adiar**.

## Estrutura

```
App.tsx                         # Navegação por abas + Provider
src/
  LembretesContext.tsx          # Estado global, listeners e regras de concluir/adiar/cancelar
  notifications.ts              # Canal, categoria (botões), agendamento e cancelamento
  storage.ts                    # Persistência com AsyncStorage
  types.ts                      # Tipos do lembrete
  theme.ts                      # Paleta em tons de rosa
  components/Cabecalho.tsx      # Cabeçalho com gradiente
  screens/NovoLembreteScreen.tsx
  screens/AgendadosScreen.tsx
```

## Observações

- Os botões da notificação abrem o app (`opensAppToForeground: true`). Assim o clique é sempre processado, mesmo que o app esteja fechado.
- **Concluir** em lembrete **único** marca como concluído; em lembrete **diário** registra a conclusão e mantém o agendamento para o dia seguinte.
- **Adiar** agenda uma nova notificação para daqui a 10 minutos.
