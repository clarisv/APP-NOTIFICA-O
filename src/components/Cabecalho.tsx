import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../theme';

// informações que o cabeçalho recebe de cada tela
interface Props {
  // texto grande do cabeçalho
  titulo: string;
  // texto pequeno acima do título
  subtitulo?: string;
  // espaço opcional para colocar algo do lado direito
  direita?: React.ReactNode;
}

// cabeçalho rosa com degradê usado no topo das telas
export default function Cabecalho({ titulo, subtitulo, direita }: Props) {
  // pega o tamanho da área da câmera e da barra de status
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={cores.gradienteHeader}
      // degradê vai do canto de cima esquerdo para o de baixo direito
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      // soma o espaço da barra de status para o texto não ficar escondido
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      {/* círculos transparentes só para decorar o fundo */}
      <View style={[styles.bolha, styles.bolhaGrande]} />
      <View style={[styles.bolha, styles.bolhaPequena]} />

      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          {/* só mostra o subtítulo se ele foi passado */}
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
          <Text style={styles.titulo}>{titulo}</Text>
        </View>
        {direita}
      </View>
    </LinearGradient>
  );
}

// estilos do cabeçalho
const styles = StyleSheet.create({
  // área rosa com os cantos de baixo arredondados
  container: {
    paddingHorizontal: 22,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    // esconde a parte das bolhas que passa da borda
    overflow: 'hidden',
  },
  // deixa título e conteúdo da direita lado a lado
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  titulo: {
    color: cores.branco,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // estilo comum das bolhas decorativas
  bolha: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
  },
  // bolha grande no canto de cima
  bolhaGrande: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  // bolha pequena perto da parte de baixo
  bolhaPequena: {
    width: 90,
    height: 90,
    bottom: -30,
    right: 110,
  },
});
