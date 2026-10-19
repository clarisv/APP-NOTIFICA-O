import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import { useLembretes } from '../LembretesContext';
import { formatarHorario, proximaOcorrencia } from '../notifications';
import { Recorrencia } from '../types';
import { cores, raio, sombra } from '../theme';

// horário que já vem preenchido: a próxima hora cheia
function horarioPadrao(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

// tela de cadastro de um lembrete novo
export default function NovoLembreteScreen() {
  // funções e dados que vêm do contexto
  const { criar, permitido, pedirPermissaoNovamente } = useLembretes();
  // usado para trocar de aba depois de salvar
  const navigation = useNavigation<any>();

  // valores digitados no formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [recorrencia, setRecorrencia] = useState<Recorrencia>('diaria');
  const [horario, setHorario] = useState<Date>(horarioPadrao);
  // controla se o relógio de escolher horário está aberto
  const [mostrarRelogio, setMostrarRelogio] = useState(false);
  // fica true enquanto o lembrete está sendo agendado
  const [salvando, setSalvando] = useState(false);

  // separa hora e minuto do horário escolhido
  const hora = horario.getHours();
  const minuto = horario.getMinutes();
  const textoHorario = formatarHorario(hora, minuto);

  // chamada quando o usuário escolhe um horário no relógio
  const onMudarHorario = (evento: DateTimePickerEvent, data?: Date) => {
    // no android o relógio fecha sozinho, no ios continua aberto
    setMostrarRelogio(Platform.OS === 'ios');
    // só troca o horário se o usuário confirmou
    if (evento.type === 'set' && data) setHorario(data);
  };

  // frase que resume quando o lembrete vai tocar
  const resumo = (() => {
    if (recorrencia === 'diaria') return `Todos os dias às ${textoHorario}`;
    // descobre se o lembrete único toca hoje ou amanhã
    const proxima = proximaOcorrencia(hora, minuto);
    const ehHoje = proxima.getDate() === new Date().getDate();
    return `${ehHoje ? 'Hoje' : 'Amanhã'} às ${textoHorario}, uma única vez`;
  })();

  // volta o formulário para o estado inicial
  const limpar = () => {
    setTitulo('');
    setDescricao('');
    setRecorrencia('diaria');
    setHorario(horarioPadrao());
  };

  // salva o lembrete, ou cria um teste quando teste for true
  const salvar = async (teste = false) => {
    // o título é obrigatório
    if (!titulo.trim()) {
      Alert.alert('Falta o título', 'Dê um nome para o seu lembrete. 💗');
      return;
    }
    setSalvando(true);
    const ok = await criar({ titulo, descricao, hora, minuto, recorrencia }, { teste });
    setSalvando(false);
    // se deu erro, o próprio contexto já avisou o usuário
    if (!ok) return;

    // alerta interno confirmando que deu certo
    Alert.alert(
      teste ? 'Teste agendado 🧪' : 'Lembrete agendado 💗',
      teste
        ? 'A notificação chega em 10 segundos. Pode minimizar o app para ver os botões.'
        : resumo,
      [{ text: 'Ver agendados', onPress: () => navigation.navigate('Agendados') }, { text: 'OK' }]
    );
    limpar();
  };

  return (
    <View style={styles.tela}>
      {/* evita que o teclado cubra os campos no ios */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* permite rolar a tela em celulares pequenos */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Cabecalho subtitulo="Bora se organizar ✨" titulo="Novo lembrete" />

          {/* aviso amarelo que aparece quando as notificações estão bloqueadas */}
          {!permitido && (
            <Pressable style={styles.avisoPermissao} onPress={pedirPermissaoNovamente}>
              <Ionicons name="notifications-off-outline" size={20} color={cores.alerta} />
              <Text style={styles.avisoTexto}>
                Notificações desativadas. Toque para permitir.
              </Text>
            </Pressable>
          )}

          {/* cartão branco com o formulário */}
          <View style={styles.card}>
            {/* campo onde o usuário digita o título do lembrete */}
            <Text style={styles.label}>Título</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="sparkles-outline" size={18} color={cores.rosa} />
              <TextInput
                style={styles.input}
                placeholder="Ex.: Beber água"
                placeholderTextColor={cores.textoSuave}
                value={titulo}
                onChangeText={setTitulo}
                maxLength={40}
              />
            </View>

            {/* campo da descrição, com mais de uma linha */}
            <Text style={styles.label}>Descrição</Text>
            <View style={[styles.inputWrap, styles.inputMultilinha]}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={cores.rosa}
                style={{ marginTop: 2 }}
              />
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Ex.: Um copo de 300 ml"
                placeholderTextColor={cores.textoSuave}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                maxLength={120}
              />
            </View>

            {/* botões para escolher entre única e diária */}
            <Text style={styles.label}>Repetição</Text>
            <View style={styles.segmento}>
              {(['unica', 'diaria'] as Recorrencia[]).map((opcao) => {
                // verifica se essa opção é a selecionada
                const ativo = recorrencia === opcao;
                return (
                  <Pressable
                    key={opcao}
                    style={[styles.segmentoBotao, ativo && styles.segmentoAtivo]}
                    onPress={() => setRecorrencia(opcao)}
                  >
                    <Ionicons
                      name={opcao === 'unica' ? 'calendar-outline' : 'repeat-outline'}
                      size={16}
                      color={ativo ? cores.branco : cores.rosaEscuro}
                    />
                    <Text style={[styles.segmentoTexto, ativo && { color: cores.branco }]}>
                      {opcao === 'unica' ? 'Única' : 'Diária'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* campo de horário, ao tocar abre o relógio */}
            <Text style={styles.label}>Horário</Text>
            <Pressable style={styles.horario} onPress={() => setMostrarRelogio(true)}>
              <Text style={styles.horarioTexto}>{textoHorario}</Text>
              <View style={styles.horarioIcone}>
                <Ionicons name="time-outline" size={22} color={cores.rosa} />
              </View>
            </Pressable>

            {/* relógio do sistema, só aparece quando o usuário toca no horário */}
            {mostrarRelogio && (
              <DateTimePicker
                value={horario}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onMudarHorario}
              />
            )}

            {/* etiqueta com o resumo de quando vai tocar */}
            <View style={styles.resumo}>
              <Ionicons name="notifications-outline" size={16} color={cores.rosaEscuro} />
              <Text style={styles.resumoTexto}>{resumo}</Text>
            </View>
          </View>

          {/* botão principal que agenda o lembrete */}
          <Pressable
            disabled={salvando}
            onPress={() => salvar(false)}
            // diminui um pouco o botão enquanto está pressionado
            style={({ pressed }) => [styles.botaoWrap, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={cores.gradiente}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.botao}
            >
              {/* mostra o carregando enquanto salva */}
              {salvando ? (
                <ActivityIndicator color={cores.branco} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={22} color={cores.branco} />
                  <Text style={styles.botaoTexto}>Agendar lembrete</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* botão de teste que dispara a notificação em 10 segundos */}
          <Pressable style={styles.botaoTeste} disabled={salvando} onPress={() => salvar(true)}>
            <Ionicons name="flask-outline" size={16} color={cores.rosaEscuro} />
            <Text style={styles.botaoTesteTexto}>Testar agora (chega em 10 s)</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// estilos da tela de cadastro
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  // caixa amarela do aviso de permissão
  avisoPermissao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.alertaClaro,
    marginHorizontal: 20,
    // margem negativa faz o aviso subir por cima do cabeçalho
    marginTop: -24,
    marginBottom: 32,
    padding: 12,
    borderRadius: raio.medio,
    zIndex: 2,
  },
  avisoTexto: { color: '#92400E', fontWeight: '600', flex: 1 },
  // cartão branco do formulário
  card: {
    backgroundColor: cores.card,
    marginHorizontal: 20,
    // margem negativa faz o cartão sobrepor o cabeçalho
    marginTop: -28,
    borderRadius: raio.grande,
    padding: 20,
    ...sombra,
  },
  // nome de cada campo
  label: {
    color: cores.texto,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 14,
  },
  // caixa em volta do ícone e do campo de texto
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.rosaSuave,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    paddingHorizontal: 14,
  },
  // ajuste para o campo de várias linhas
  inputMultilinha: { alignItems: 'flex-start', paddingTop: 12 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: cores.texto,
  },
  // fundo dos botões única e diária
  segmento: {
    flexDirection: 'row',
    backgroundColor: cores.rosaSuave,
    borderRadius: raio.pilula,
    padding: 4,
    borderWidth: 1.5,
    borderColor: cores.borda,
  },
  segmentoBotao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: raio.pilula,
  },
  // opção selecionada fica rosa
  segmentoAtivo: { backgroundColor: cores.rosa },
  segmentoTexto: { color: cores.rosaEscuro, fontWeight: '700', fontSize: 15 },
  // caixa do horário
  horario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cores.rosaSuave,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
  },
  // número do horário em destaque
  horarioTexto: {
    fontSize: 32,
    fontWeight: '800',
    color: cores.rosaEscuro,
    letterSpacing: 1,
  },
  horarioIcone: {
    backgroundColor: cores.branco,
    borderRadius: raio.pequeno,
    padding: 10,
  },
  // etiqueta do resumo
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: cores.rosaClaro,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: raio.pilula,
    alignSelf: 'flex-start',
  },
  resumoTexto: { color: cores.rosaEscuro, fontWeight: '600', fontSize: 13 },
  // área do botão principal, com sombra
  botaoWrap: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: raio.medio,
    ...sombra,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: raio.medio,
  },
  botaoTexto: { color: cores.branco, fontSize: 17, fontWeight: '800' },
  // botão de teste, mais discreto
  botaoTeste: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  botaoTesteTexto: { color: cores.rosaEscuro, fontWeight: '600' },
});
