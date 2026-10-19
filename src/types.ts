// tipos de repetição que o lembrete pode ter
export type Recorrencia = 'unica' | 'diaria';

// situações possíveis de um lembrete
export type StatusLembrete = 'ativo' | 'adiado' | 'concluido';

// formato de um lembrete salvo no app
export interface Lembrete {
  // identificador único do lembrete
  id: string;
  // nome do lembrete
  titulo: string;
  // texto que aparece no corpo da notificação
  descricao: string;
  // hora escolhida, de 0 a 23
  hora: number;
  // minuto escolhido, de 0 a 59
  minuto: number;
  // se toca uma vez só ou todo dia
  recorrencia: Recorrencia;
  // data e hora em que um lembrete único vai tocar
  dataAlvo?: string;
  // situação atual do lembrete
  status: StatusLembrete;
  // id da notificação principal agendada no celular
  notificationId?: string;
  // ids das notificações criadas pelo botão adiar
  idsAdiados: string[];
  // data da última vez que o usuário concluiu
  ultimaConclusao?: string;
  // data em que o lembrete foi criado
  criadoEm: string;
}

// campos que o usuário preenche na tela de cadastro
export type NovoLembreteInput = Pick<
  Lembrete,
  'titulo' | 'descricao' | 'hora' | 'minuto' | 'recorrencia'
>;
