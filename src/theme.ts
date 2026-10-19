// cores usadas em todo o app, todas em tons de rosa
export const cores = {
  // cor de fundo das telas
  fundo: '#FFF5F8',
  // cor de fundo dos cartões
  card: '#FFFFFF',
  // cor das bordas dos campos e cartões
  borda: '#FBE0EA',
  // rosa principal, usado nos destaques
  rosa: '#EC4899',
  // rosa mais escuro, usado em textos de destaque
  rosaEscuro: '#BE185D',
  // rosa claro, usado em etiquetas e seleções
  rosaClaro: '#FBCFE8',
  // rosa bem suave, usado no fundo dos campos
  rosaSuave: '#FDF2F8',
  // degradê do botão principal
  gradiente: ['#F472B6', '#DB2777'] as const,
  // degradê do cabeçalho das telas
  gradienteHeader: ['#FDA4CF', '#F472B6', '#EC4899'] as const,
  // cor principal dos textos
  texto: '#4A1D33',
  // cor dos textos secundários
  textoSuave: '#9D6B83',
  branco: '#FFFFFF',
  // verde para lembretes concluídos
  sucesso: '#10B981',
  sucessoClaro: '#D1FAE5',
  // amarelo para avisos e lembretes adiados
  alerta: '#F59E0B',
  alertaClaro: '#FEF3C7',
  // vermelho para ações de cancelar
  perigo: '#E11D48',
  perigoClaro: '#FFE4E6',
};

// tamanhos de arredondamento dos cantos
export const raio = {
  pequeno: 12,
  medio: 16,
  grande: 24,
  // valor alto deixa o elemento em formato de pílula
  pilula: 999,
};

// sombra suave usada nos cartões e botões
export const sombra = {
  shadowColor: '#BE185D',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 14,
  // elevation é a sombra no android
  elevation: 4,
};
