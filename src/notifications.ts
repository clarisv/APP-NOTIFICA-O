import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Lembrete } from './types';

// nome do canal de notificações no android
export const CANAL_ID = 'lembretes';
// nome do grupo de botões que aparece na notificação
export const CATEGORIA_ID = 'lembrete';
// identificador do botão concluir
export const ACAO_CONCLUIR = 'concluir';
// identificador do botão adiar
export const ACAO_ADIAR = 'adiar';
// quantos minutos o botão adiar espera
export const MINUTOS_ADIAR = 10;

// prepara tudo que as notificações precisam para funcionar
export async function configurarNotificacoes(): Promise<void> {
  // cria o canal de notificação, obrigatório no android 8 ou superior
  // no android 13 o pedido de permissão só aparece depois que existe um canal
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: 'Lembretes',
      description: 'Avisos dos seus lembretes',
      // prioridade alta faz a notificação aparecer no topo da tela
      importance: Notifications.AndroidImportance.HIGH,
      // padrão de vibração: espera, vibra, pausa, vibra
      vibrationPattern: [0, 250, 250, 250],
      // cor da luz de notificação, nos aparelhos que têm
      lightColor: '#EC4899',
      sound: 'default',
    });
  }

  // registra os botões que aparecem dentro da notificação
  // opensAppToForeground abre o app ao tocar, assim o clique nunca se perde
  // mesmo que o app esteja fechado
  await Notifications.setNotificationCategoryAsync(CATEGORIA_ID, [
    // botão para marcar o lembrete como feito
    {
      identifier: ACAO_CONCLUIR,
      buttonTitle: '✅ Concluir',
      options: { opensAppToForeground: true },
    },
    // botão para lembrar de novo daqui a alguns minutos
    {
      identifier: ACAO_ADIAR,
      buttonTitle: `⏰ Adiar ${MINUTOS_ADIAR} min`,
      options: { opensAppToForeground: true },
    },
  ]);

  // define como a notificação aparece quando o app está aberto
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // mostra o aviso no topo da tela
      shouldShowBanner: true,
      // deixa a notificação na lista da barra de notificações
      shouldShowList: true,
      // toca o som
      shouldPlaySound: true,
      // não mexe no número em cima do ícone do app
      shouldSetBadge: false,
    }),
  });
}

// pede permissão ao usuário para mostrar notificações
export async function pedirPermissao(): Promise<boolean> {
  // verifica se a permissão já foi dada antes
  const atual = await Notifications.getPermissionsAsync();
  if (atual.status === 'granted') return true;

  // se ainda não foi dada, mostra o pedido na tela
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// calcula a próxima vez que o horário escolhido vai acontecer
export function proximaOcorrencia(hora: number, minuto: number): Date {
  // pega a data e hora de agora
  const agora = new Date();
  // monta uma data de hoje com o horário escolhido
  const alvo = new Date();
  alvo.setHours(hora, minuto, 0, 0);
  // se esse horário já passou hoje, joga para amanhã
  if (alvo.getTime() <= agora.getTime()) {
    alvo.setDate(alvo.getDate() + 1);
  }
  return alvo;
}

// monta o conteúdo que aparece na notificação
function conteudo(lembrete: Lembrete, adiado = false): Notifications.NotificationContentInput {
  return {
    // muda o ícone do título quando a notificação foi adiada
    title: adiado ? `⏰ ${lembrete.titulo}` : `💗 ${lembrete.titulo}`,
    // se não tiver descrição, usa uma frase padrão
    body: lembrete.descricao || 'Hora do seu lembrete!',
    // liga a notificação aos botões concluir e adiar
    categoryIdentifier: CATEGORIA_ID,
    // guarda o id do lembrete para saber qual foi clicado depois
    data: { lembreteId: lembrete.id },
    sound: 'default',
    // cor de destaque da notificação no android
    color: '#EC4899',
  };
}

// agenda a notificação principal do lembrete e devolve o id dela
export async function agendarLembrete(lembrete: Lembrete): Promise<string> {
  // lembrete diário usa o gatilho daily, que repete todo dia no mesmo horário
  if (lembrete.recorrencia === 'diaria') {
    return Notifications.scheduleNotificationAsync({
      content: conteudo(lembrete),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: lembrete.hora,
        minute: lembrete.minuto,
        channelId: CANAL_ID,
      },
    });
  }

  // lembrete único usa a data exata em que deve tocar
  const data = lembrete.dataAlvo
    ? new Date(lembrete.dataAlvo)
    : proximaOcorrencia(lembrete.hora, lembrete.minuto);

  // o gatilho date toca uma vez só na data informada
  return Notifications.scheduleNotificationAsync({
    content: conteudo(lembrete),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: data,
      channelId: CANAL_ID,
    },
  });
}

// agenda a mesma notificação de novo para daqui a alguns minutos
export async function agendarAdiamento(lembrete: Lembrete): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: conteudo(lembrete, true),
    // o gatilho time interval conta os segundos a partir de agora
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: MINUTOS_ADIAR * 60,
      channelId: CANAL_ID,
    },
  });
}

// agenda uma notificação de teste que chega em poucos segundos
export async function agendarTeste(lembrete: Lembrete, segundos = 10): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: conteudo(lembrete),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: segundos,
      channelId: CANAL_ID,
    },
  });
}

// cancela todas as notificações de um lembrete, a principal e as adiadas
export async function cancelarNotificacoesDoLembrete(lembrete: Lembrete): Promise<void> {
  // junta todos os ids e remove os vazios
  const ids = [lembrete.notificationId, ...lembrete.idsAdiados].filter(Boolean) as string[];
  // cancela todas ao mesmo tempo
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

// cancela todas as notificações do app
export async function cancelarTodas(): Promise<void> {
  // remove as que ainda vão tocar
  await Notifications.cancelAllScheduledNotificationsAsync();
  // limpa as que já estão na barra de notificações
  await Notifications.dismissAllNotificationsAsync();
}

// transforma hora e minuto em texto no formato 08:00
export function formatarHorario(hora: number, minuto: number): string {
  // padStart coloca um zero na frente quando o número tem um dígito só
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}
