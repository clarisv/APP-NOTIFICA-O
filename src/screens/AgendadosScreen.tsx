import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import { useLembretes } from '../LembretesContext';
import { formatarHorario } from '../notifications';
import { Lembrete } from '../types';
import { cores, raio, sombra } from '../theme';

// monta o texto de quando o lembrete toca, por exemplo "todo dia, 08:00"
function descreverQuando(l: Lembrete): string {
  const horario = formatarHorario(l.hora, l.minuto);
  if (l.recorrencia === 'diaria') return `Todo dia, ${horario}`;
  if (!l.dataAlvo) return `Única, ${horario}`;

  // compara a data do lembrete com hoje e amanhã
  const alvo = new Date(l.dataAlvo);
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);
  if (alvo.toDateString() === hoje.toDateString()) return `Hoje, ${horario}`;
  if (alvo.toDateString() === amanha.toDateString()) return `Amanhã, ${horario}`;
  // se não for hoje nem amanhã, mostra a data completa
  return `${alvo.toLocaleDateString('pt-BR')}, ${horario}`;
}

// escolhe o texto e as cores da etiqueta de status
function etiqueta(l: Lembrete) {
  if (l.status === 'concluido') {
    return { texto: 'Concluído', cor: cores.sucesso, fundo: cores.sucessoClaro };
  }
  if (l.status === 'adiado') {
    return { texto: 'Adiado', cor: '#B45309', fundo: cores.alertaClaro };
  }
  // lembrete único cujo horário já passou
  if (l.recorrencia === 'unica' && l.dataAlvo && new Date(l.dataAlvo) < new Date()) {
    return { texto: 'Já tocou', cor: cores.textoSuave, fundo: cores.rosaSuave };
  }
  return { texto: 'Ativo', cor: cores.rosaEscuro, fundo: cores.rosaClaro };
}

// tela com a lista de lembretes agendados
export default function AgendadosScreen() {
  // dados e funções que vêm do contexto
  const { lembretes, cancelar, cancelarTudo, recarregar } = useLembretes();
  // usado no botão da lista vazia para ir até o cadastro
  const navigation = useNavigation<any>();

  // ciclo de vida da tela: toda vez que a aba ganha foco, atualiza a lista
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar])
  );

  // conta quantos lembretes ainda não foram concluídos
  const pendentes = lembretes.filter((l) => l.status !== 'concluido').length;

  // pergunta antes de cancelar um lembrete
  const confirmarCancelar = (l: Lembrete) => {
    Alert.alert('Cancelar lembrete?', `"${l.titulo}" não vai mais te notificar.`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar lembrete', style: 'destructive', onPress: () => cancelar(l.id) },
    ]);
  };

  // pergunta antes de cancelar todos
  const confirmarCancelarTodos = () => {
    Alert.alert('Cancelar todos?', 'Todas as notificações agendadas serão removidas.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar todos', style: 'destructive', onPress: cancelarTudo },
    ]);
  };

  // desenha cada cartão da lista
  const renderItem = ({ item }: { item: Lembrete }) => {
    const tag = etiqueta(item);
    const concluido = item.status === 'concluido';

    return (
      // lembretes concluídos ficam mais apagados
      <View style={[styles.item, concluido && { opacity: 0.6 }]}>
        {/* ícone da esquerda muda conforme o tipo e o status */}
        <View style={[styles.icone, concluido && { backgroundColor: cores.sucessoClaro }]}>
          <Ionicons
            name={
              concluido
                ? 'checkmark-done'
                : item.recorrencia === 'diaria'
                  ? 'repeat'
                  : 'calendar-clear-outline'
            }
            size={22}
            color={concluido ? cores.sucesso : cores.rosa}
          />
        </View>

        {/* textos do lembrete */}
        <View style={{ flex: 1 }}>
          {/* título riscado quando concluído */}
          <Text style={[styles.itemTitulo, concluido && styles.riscado]} numberOfLines={1}>
            {item.titulo}
          </Text>
          {/* só mostra a descrição se ela existir */}
          {item.descricao ? (
            <Text style={styles.itemDescricao} numberOfLines={1}>
              {item.descricao}
            </Text>
          ) : null}
          {/* linha com o horário e a etiqueta de status */}
          <View style={styles.itemRodape}>
            <Ionicons name="time-outline" size={13} color={cores.textoSuave} />
            <Text style={styles.itemQuando}>{descreverQuando(item)}</Text>
            <View style={[styles.tag, { backgroundColor: tag.fundo }]}>
              <Text style={[styles.tagTexto, { color: tag.cor }]}>{tag.texto}</Text>
            </View>
          </View>
        </View>

        {/* botão da lixeira para cancelar esse lembrete */}
        <Pressable
          onPress={() => confirmarCancelar(item)}
          style={styles.lixeira}
          // aumenta a área de toque do botão
          hitSlop={8}
          accessibilityLabel={`Cancelar ${item.titulo}`}
        >
          <Ionicons name="trash-outline" size={20} color={cores.perigo} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.tela}>
      {/* lista que só desenha os itens visíveis, mais leve que um map */}
      <FlatList
        data={lembretes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        // cabeçalho rola junto com a lista
        ListHeaderComponent={
          <>
            <Cabecalho
              // subtítulo muda conforme a quantidade de pendentes
              subtitulo={
                pendentes === 0
                  ? 'Nada pendente 🎉'
                  : `${pendentes} lembrete${pendentes > 1 ? 's' : ''} ativo${pendentes > 1 ? 's' : ''}`
              }
              titulo="Agendados"
            />
            <View style={{ height: 8 }} />
          </>
        }
        // o que aparece quando não tem nenhum lembrete
        ListEmptyComponent={
          <View style={styles.vazio}>
            <View style={styles.vazioIcone}>
              <Ionicons name="notifications-outline" size={40} color={cores.rosa} />
            </View>
            <Text style={styles.vazioTitulo}>Nenhum lembrete ainda</Text>
            <Text style={styles.vazioTexto}>Crie o primeiro e eu te aviso na hora certa 💗</Text>
            <Pressable style={styles.vazioBotao} onPress={() => navigation.navigate('Novo')}>
              <Text style={styles.vazioBotaoTexto}>Criar lembrete</Text>
            </Pressable>
          </View>
        }
        // botão cancelar todos no fim da lista, só quando tem lembretes
        ListFooterComponent={
          lembretes.length > 0 ? (
            <Pressable style={styles.cancelarTodos} onPress={confirmarCancelarTodos}>
              <Ionicons name="close-circle-outline" size={18} color={cores.perigo} />
              <Text style={styles.cancelarTodosTexto}>Cancelar todos</Text>
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}

// estilos da tela de agendados
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  // cartão de cada lembrete
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: cores.card,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: raio.grande,
    ...sombra,
  },
  // quadrado do ícone da esquerda
  icone: {
    width: 48,
    height: 48,
    borderRadius: raio.medio,
    backgroundColor: cores.rosaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: { fontSize: 17, fontWeight: '800', color: cores.texto },
  // risca o texto do título
  riscado: { textDecorationLine: 'line-through' },
  itemDescricao: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
  // linha de baixo do cartão
  itemRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    // deixa quebrar a linha em telas estreitas
    flexWrap: 'wrap',
  },
  itemQuando: { fontSize: 13, color: cores.textoSuave, fontWeight: '600', marginRight: 6 },
  // etiqueta de status
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: raio.pilula },
  tagTexto: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  // botão vermelho da lixeira
  lixeira: {
    width: 40,
    height: 40,
    borderRadius: raio.pequeno,
    backgroundColor: cores.perigoClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // área da lista vazia
  vazio: { alignItems: 'center', paddingHorizontal: 40, marginTop: 40 },
  vazioIcone: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: cores.rosaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vazioTitulo: { fontSize: 19, fontWeight: '800', color: cores.texto },
  vazioTexto: { fontSize: 15, color: cores.textoSuave, textAlign: 'center', marginTop: 6 },
  vazioBotao: {
    marginTop: 20,
    backgroundColor: cores.rosa,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: raio.pilula,
  },
  vazioBotaoTexto: { color: cores.branco, fontWeight: '800' },
  // botão cancelar todos
  cancelarTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: raio.pilula,
    borderWidth: 1.5,
    borderColor: cores.perigoClaro,
    backgroundColor: cores.card,
  },
  cancelarTodosTexto: { color: cores.perigo, fontWeight: '800' },
});
