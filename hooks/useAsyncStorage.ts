import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook genérico para gerenciar AsyncStorage com TypeScript
 * Fornece estado reativo, validação e tratamento de erros
 */
export function useAsyncStorage<T>(
  chave: string, 
  valorInicial: T,
  validador?: (valor: any) => valor is T
): [T, (valor: T) => Promise<void>, boolean, Error | null, () => Promise<void>] {
  const [valorArmazenado, setValorArmazenado] = useState<T>(valorInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<Error | null>(null);

  // Carregar valor do storage na inicialização
  useEffect(() => {
    carregarValor();
  }, [chave]);

  /**
   * Carrega valor do AsyncStorage
   */
  const carregarValor = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const item = await AsyncStorage.getItem(chave);
      if (item) {
        const valorParsed = JSON.parse(item);
        
        // Validar dados se validador fornecido
        if (validador && !validador(valorParsed)) {
          const msgErro = `Dados inválidos para a chave: ${chave}`;
          console.warn(msgErro, valorParsed);
          setErro(new Error(msgErro));
          return;
        }
        
        setValorArmazenado(valorParsed);
        console.log(`📦 Dados carregados: ${chave}`);
      } else {
        console.log(`📭 Nenhum dado encontrado para: ${chave}`);
      }
    } catch (error) {
      const msgErro = `Erro ao carregar ${chave}: ${error}`;
      console.error(msgErro);
      setErro(error as Error);
    } finally {
      setCarregando(false);
    }
  }, [chave]);

  /**
   * Salva valor no AsyncStorage
   */
  const salvarValor = useCallback(async (valor: T | ((current: T) => T)) => {
    try {
      setErro(null);
      
      // Suporte para função updater
      const novoValor = typeof valor === 'function' 
        ? (valor as (current: T) => T)(valorArmazenado)
        : valor;
      
      // Validar antes de salvar
      if (validador && !validador(novoValor)) {
        const msgErro = `Dados inválidos para salvar na chave: ${chave}`;
        console.error(msgErro, novoValor);
        throw new Error(msgErro);
      }
      
      const valorString = JSON.stringify(novoValor);
      await AsyncStorage.setItem(chave, valorString);
      setValorArmazenado(novoValor);
      
      console.log(`💾 Dados salvos: ${chave} (${valorString.length} chars)`);
    } catch (error) {
      const msgErro = `Erro ao salvar ${chave}: ${error}`;
      console.error(msgErro);
      setErro(error as Error);
      throw error;
    }
  }, [chave, validador, valorArmazenado]);

  /**
   * Recarrega dados do storage
   */
  const recarregar = useCallback(async () => {
    await carregarValor();
  }, [carregarValor]);

  return [valorArmazenado, salvarValor, carregando, erro, recarregar];
}

/**
 * Hook otimizado para arrays com operações específicas
 */
export function useAsyncStorageArray<T>(
  chave: string,
  validadorItem?: (item: any) => item is T
): {
  items: T[];
  adicionarItem: (item: T) => Promise<void>;
  removerItem: (predicate: (item: T) => boolean) => Promise<void>;
  atualizarItem: (predicate: (item: T) => boolean, novosDados: Partial<T>) => Promise<void>;
  limparTodos: () => Promise<void>;
  carregando: boolean;
  erro: Error | null;
  recarregar: () => Promise<void>;
} {
  const validadorArray = useCallback((valor: any): valor is T[] => {
    if (!Array.isArray(valor)) return false;
    if (validadorItem) {
      return valor.every(validadorItem);
    }
    return true;
  }, [validadorItem]);

  const [items, setItems, carregando, erro, recarregar] = useAsyncStorage<T[]>(
    chave,
    [],
    validadorArray
  );

  /**
   * Adiciona item ao array
   */
  const adicionarItem = useCallback(async (item: T) => {
    await setItems(currentItems => [...currentItems, item]);
  }, [setItems]);

  /**
   * Remove itens baseado em predicado
   */
  const removerItem = useCallback(async (predicate: (item: T) => boolean) => {
    await setItems(currentItems => currentItems.filter(item => !predicate(item)));
  }, [setItems]);

  /**
   * Atualiza itens baseado em predicado
   */
  const atualizarItem = useCallback(async (
    predicate: (item: T) => boolean, 
    novosDados: Partial<T>
  ) => {
    await setItems(currentItems => 
      currentItems.map(item =>
        predicate(item) ? { ...item, ...novosDados } : item
      )
    );
  }, [setItems]);

  /**
   * Limpa todos os itens
   */
  const limparTodos = useCallback(async () => {
    await setItems([]);
  }, [setItems]);

  return {
    items,
    adicionarItem,
    removerItem,
    atualizarItem,
    limparTodos,
    carregando,
    erro,
    recarregar
  };
}

/**
 * Hook para gerenciar cache com expiração
 */
export function useAsyncStorageWithExpiration<T>(
  chave: string,
  valorInicial: T,
  expiracaoHoras: number = 24
): {
  valor: T;
  salvar: (valor: T) => Promise<void>;
  carregando: boolean;
  erro: Error | null;
  expirado: boolean;
  recarregar: () => Promise<void>;
} {
  const [valor, setValor] = useState<T>(valorInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<Error | null>(null);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    carregarComExpiracao();
  }, [chave]);

  const carregarComExpiracao = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const item = await AsyncStorage.getItem(chave);
      if (item) {
        const { dados, timestamp } = JSON.parse(item);
        
        // Verificar expiração
        const agora = new Date();
        const criacao = new Date(timestamp);
        const diferencaHoras = (agora.getTime() - criacao.getTime()) / (1000 * 60 * 60);
        
        if (diferencaHoras > expiracaoHoras) {
          setExpirado(true);
          await AsyncStorage.removeItem(chave);
          console.log(`⏰ Dados expirados removidos: ${chave}`);
        } else {
          setValor(dados);
          setExpirado(false);
          console.log(`📦 Dados válidos carregados: ${chave}`);
        }
      }
    } catch (error) {
      console.error(`Erro ao carregar com expiração ${chave}:`, error);
      setErro(error as Error);
    } finally {
      setCarregando(false);
    }
  }, [chave, expiracaoHoras]);

  const salvar = useCallback(async (novoValor: T) => {
    try {
      setErro(null);
      
      const dadosComTimestamp = {
        dados: novoValor,
        timestamp: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(chave, JSON.stringify(dadosComTimestamp));
      setValor(novoValor);
      setExpirado(false);
      
      console.log(`💾 Dados salvos com expiração: ${chave}`);
    } catch (error) {
      console.error(`Erro ao salvar com expiração ${chave}:`, error);
      setErro(error as Error);
      throw error;
    }
  }, [chave]);

  const recarregar = useCallback(async () => {
    await carregarComExpiracao();
  }, [carregarComExpiracao]);

  return {
    valor,
    salvar,
    carregando,
    erro,
    expirado,
    recarregar
  };
}