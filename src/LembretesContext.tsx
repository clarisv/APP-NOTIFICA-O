import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Lembrete, NovoLembreteInput } from './types';
import {
  carregarLembretes,
  gravarUltimaResposta,
  lerUltimaResposta,
  salvarLembretes,
} from './storage';
import {
  ACAO_ADIAR,
  ACAO_CONCLUIR,
  MINUTOS_ADIAR,
  agendarAdiamento,
  agendarLembrete,
  agendarTeste,
  cancelarNotificacoesDoLembrete,
  cancelarTodas,
  configurarNotificacoes,
  pedirPermissao,
  proximaOcorrencia,
} from './notifications';

// tudo que as telas conseguem acessar pelo contexto
interface ContextoLembretes {
  // lista de lembretes salvos
  lembretes: Lembrete[];
  // indica se os dados ainda estão sendo carregados
  carregando: boolean;
  // indica se o usuário permitiu as notificações
  permitido: boolean;
  // cria um lembrete novo, ou um de teste
  criar: (dados: NovoLembreteInput, opcoes?: { teste?: boolean }) => Promise<boolean>;
  // cancela um lembrete pelo id
  cancelar: (id: string) => Promise<void>;
  // cancela todos os lembretes
  cancelarTudo: () => Promise<void>;
  // lê a lista salva de novo
  recarregar: () => Promise<void>;
  // pede a permissão de notificação mais uma vez
  pedirPermissaoNovamente: () => Promise<boolean>;
}

// cria o contexto que compartilha os lembretes entre as telas
const Contexto = createContext<ContextoLembretes | null>(null);

// gera um id único usando a hora atual e um pedaço aleatório
function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// componente que guarda o estado dos lembretes e envolve o app inteiro
export function LembretesProvider({ children }: { children: React.ReactNode }) {
  // lista de lembretes mostrada nas telas
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  // fica true até terminar de carregar os dados
  const [carregando, setCarregando] = useState(true);
  // guarda se a permissão de notificação foi aceita
  const [permitido, setPermitido] = useState(false);

  // guarda sempre a lista mais recente
  // os listeners de notificação são criados uma vez só (closure)
  // então sem o ref eles enxergariam uma lista antiga
  const lembretesRef = useRef<Lembrete[]>([]);
  // guarda as respostas já tratadas para não repetir a mesma ação
  const respostasTratadas = useRef<Set<string>>(new Set());

  // atualiza a lista na tela, no ref e no armazenamento de uma vez só
  const aplicar = useCallback(async (nova: Lembrete[]) => {
    lembretesRef.current = nova;
    setLembretes(nova);
    await salvarLembretes(nova);
  }, []);

  // busca a lista salva no celular e coloca na tela
  const recarregar = useCallback(async () => {
    const lista = await carregarLembretes();
    lembretesRef.current = lista;
    setLembretes(lista);
  }, []);

  // trata o clique do usuário na notificação, no corpo ou nos botões
  const tratarResposta = useCallback(
    async (resposta: Notifications.NotificationResponse) => {
      const notificacao = resposta.notification;
      // id da notificação que foi clicada
      const idNotificacao = notificacao.request.identifier;
      // chave que identifica esse clique específico
      const chave = `${idNotificacao}|${resposta.actionIdentifier}|${notificacao.date}`;

      // se esse clique já foi tratado, para aqui
      if (respostasTratadas.current.has(chave)) return;
      if ((await lerUltimaResposta()) === chave) return;
      // marca o clique como tratado
      respostasTratadas.current.add(chave);
      await gravarUltimaResposta(chave);

      // tira a notificação da barra do celular
      await Notifications.dismissNotificationAsync(idNotificacao).catch(() => {});

      // descobre qual lembrete gerou essa notificação
      const lembreteId = notificacao.request.content.data?.lembreteId as string | undefined;
      const lista = lembretesRef.current;
      const lembrete = lista.find((l) => l.id === lembreteId);
      // se o lembrete foi cancelado antes, não tem o que fazer
      if (!lembrete) return;

      // se a notificação clicada era um adiamento, ela já tocou e sai da lista
      const idsAdiados = lembrete.idsAdiados.filter((id) => id !== idNotificacao);

      // cópia do lembrete que vai receber as mudanças
      let atualizado: Lembrete = { ...lembrete, idsAdiados };

      // usuário tocou em concluir
      if (resposta.actionIdentifier === ACAO_CONCLUIR) {
        if (lembrete.recorrencia === 'unica') {
          // lembrete único concluído não precisa tocar mais
          await cancelarNotificacoesDoLembrete(atualizado);
          atualizado = {
            ...atualizado,
            status: 'concluido',
            idsAdiados: [],
            ultimaConclusao: new Date().toISOString(),
          };
        } else {
          // lembrete diário continua agendado para o próximo dia
          atualizado = {
            ...atualizado,
            status: 'ativo',
            ultimaConclusao: new Date().toISOString(),
          };
        }
        // avisa dentro do app que deu certo
        Alert.alert('Concluído! 💗', `"${lembrete.titulo}" foi marcado como concluído.`);
      // usuário tocou em adiar
      } else if (resposta.actionIdentifier === ACAO_ADIAR) {
        // agenda a mesma notificação para daqui a alguns minutos
        const novoId = await agendarAdiamento(lembrete);
        atualizado = {
          ...atualizado,
          status: 'adiado',
          // guarda o id novo para conseguir cancelar depois
          idsAdiados: [...idsAdiados, novoId],
        };
        // avisa dentro do app que deu certo
        Alert.alert('Adiado ⏰', `Vou te lembrar de novo em ${MINUTOS_ADIAR} minutos.`);
      }

      // troca o lembrete antigo pelo atualizado e salva
      await aplicar(lista.map((l) => (l.id === lembrete.id ? atualizado : l)));
    },
    [aplicar]
  );

  // montagem: roda uma vez quando o app abre
  useEffect(() => {
    // evita atualizar o estado depois que o componente foi desmontado
    let ativo = true;

    (async () => {
      // prepara canal, botões e forma de exibição
      await configurarNotificacoes();
      // pede a permissão ao usuário
      const ok = await pedirPermissao();
      if (!ativo) return;
      setPermitido(ok);

      // carrega os lembretes salvos
      await recarregar();
      setCarregando(false);

      // se o app estava fechado e foi aberto por um clique na notificação
      // pega esse clique e trata agora
      const ultima = Notifications.getLastNotificationResponse();
      if (ultima) {
        await tratarResposta(ultima);
        Notifications.clearLastNotificationResponse();
      }
    })();

    // escuta cliques na notificação com o app aberto ou em segundo plano
    const assinaturaResposta = Notifications.addNotificationResponseReceivedListener(
      async (resposta) => {
        await tratarResposta(resposta);
        Notifications.clearLastNotificationResponse();
      }
    );

    // ciclo de vida do app: quando volta para o primeiro plano, atualiza a lista
    const assinaturaApp = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recarregar();
    });

    // desmontagem: remove os listeners para não ficarem ocupando memória
    return () => {
      ativo = false;
      assinaturaResposta.remove();
      assinaturaApp.remove();
    };
  }, [recarregar, tratarResposta]);

  // pede a permissão de novo, usado no aviso amarelo da tela de cadastro
  const pedirPermissaoNovamente = useCallback(async () => {
    const ok = await pedirPermissao();
    setPermitido(ok);
    return ok;
  }, []);

  // cria e agenda um lembrete novo
  const criar = useCallback(
    async (dados: NovoLembreteInput, opcoes?: { teste?: boolean }) => {
      // sem permissão a notificação não aparece, então pede antes
      if (!permitido) {
        const ok = await pedirPermissaoNovamente();
        if (!ok) {
          Alert.alert(
            'Permissão necessária',
            'Ative as notificações do app nas configurações do celular para receber os lembretes.'
          );
          return false;
        }
      }

      // monta o objeto do lembrete com os dados do formulário
      const lembrete: Lembrete = {
        id: gerarId(),
        // trim tira os espaços sobrando no começo e no fim
        titulo: dados.titulo.trim(),
        descricao: dados.descricao.trim(),
        hora: dados.hora,
        minuto: dados.minuto,
        // o teste é sempre único
        recorrencia: opcoes?.teste ? 'unica' : dados.recorrencia,
        status: 'ativo',
        idsAdiados: [],
        criadoEm: new Date().toISOString(),
      };

      try {
        if (opcoes?.teste) {
          // no teste a notificação chega em 10 segundos
          const quando = new Date(Date.now() + 10 * 1000);
          lembrete.hora = quando.getHours();
          lembrete.minuto = quando.getMinutes();
          lembrete.dataAlvo = quando.toISOString();
          lembrete.notificationId = await agendarTeste(lembrete, 10);
        } else {
          // lembrete único guarda a data exata em que vai tocar
          if (lembrete.recorrencia === 'unica') {
            lembrete.dataAlvo = proximaOcorrencia(lembrete.hora, lembrete.minuto).toISOString();
          }
          // agenda e guarda o id para poder cancelar depois
          lembrete.notificationId = await agendarLembrete(lembrete);
        }
      } catch (erro) {
        console.log('Erro ao agendar', erro);
        Alert.alert('Ops!', 'Não foi possível agendar o lembrete. Tente novamente.');
        return false;
      }

      // coloca o lembrete novo no topo da lista
      await aplicar([lembrete, ...lembretesRef.current]);
      return true;
    },
    [aplicar, permitido, pedirPermissaoNovamente]
  );

  // cancela as notificações de um lembrete e tira ele da lista
  const cancelar = useCallback(
    async (id: string) => {
      const lembrete = lembretesRef.current.find((l) => l.id === id);
      if (lembrete) await cancelarNotificacoesDoLembrete(lembrete);
      await aplicar(lembretesRef.current.filter((l) => l.id !== id));
    },
    [aplicar]
  );

  // cancela todas as notificações e limpa a lista
  const cancelarTudo = useCallback(async () => {
    await cancelarTodas();
    await aplicar([]);
  }, [aplicar]);

  // entrega os dados e funções para as telas
  return (
    <Contexto.Provider
      value={{
        lembretes,
        carregando,
        permitido,
        criar,
        cancelar,
        cancelarTudo,
        recarregar,
        pedirPermissaoNovamente,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

// atalho para as telas usarem o contexto dos lembretes
export function useLembretes(): ContextoLembretes {
  const ctx = useContext(Contexto);
  // avisa se alguma tela tentar usar fora do provider
  if (!ctx) throw new Error('useLembretes precisa estar dentro de <LembretesProvider>');
  return ctx;
}
