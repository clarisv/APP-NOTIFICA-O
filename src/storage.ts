import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lembrete } from './types';

// chave onde a lista de lembretes fica salva no celular
const CHAVE_LEMBRETES = '@lembretes/lista';
// chave onde fica salva a última resposta de notificação já tratada
const CHAVE_ULTIMA_RESPOSTA = '@lembretes/ultima-resposta';

// busca a lista de lembretes salva no celular
export async function carregarLembretes(): Promise<Lembrete[]> {
  try {
    const json = await AsyncStorage.getItem(CHAVE_LEMBRETES);
    // se não tiver nada salvo, devolve uma lista vazia
    return json ? (JSON.parse(json) as Lembrete[]) : [];
  } catch (erro) {
    console.log('Erro ao carregar lembretes', erro);
    return [];
  }
}

// salva a lista de lembretes no celular para não perder ao fechar o app
export async function salvarLembretes(lista: Lembrete[]): Promise<void> {
  try {
    // o asyncstorage só guarda texto, por isso transforma em json
    await AsyncStorage.setItem(CHAVE_LEMBRETES, JSON.stringify(lista));
  } catch (erro) {
    console.log('Erro ao salvar lembretes', erro);
  }
}

// lê qual foi a última resposta de notificação já tratada
export async function lerUltimaResposta(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CHAVE_ULTIMA_RESPOSTA);
  } catch {
    return null;
  }
}

// grava a resposta tratada para não processar o mesmo clique duas vezes
export async function gravarUltimaResposta(chave: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE_ULTIMA_RESPOSTA, chave);
  } catch {
    // se falhar não tem problema, é só uma proteção extra
  }
}
