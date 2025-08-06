import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CacheMetadata, ItemSincronizacao } from '../types/fitness';

/**
 * Serviço de Cache Inteligente para TreinosApp
 * Gerencia persistência local, expiração e sincronização de dados
 */
export class CacheService {
  // Chaves do cache organizadas por categoria
  public static readonly CACHE_KEYS = {
    // Dados do usuário
    USUARIO: 'fitness_usuario',
    PREFERENCIAS: 'fitness_preferencias',
    
    // Dados de treino
    TREINOS: 'fitness_treinos',
    ITENS_TREINO: 'fitness_itens_treino', 
    SERIES: 'fitness_series',
    TEMPLATES: 'fitness_templates',
    
    // Exercícios e progresso
    EXERCICIOS: 'fitness_exercicios',
    PROGRESSO: 'fitness_progresso',
    ESTATISTICAS: 'fitness_estatisticas',
    METAS: 'fitness_metas',
    
    // Sistema
    FILA_SYNC: 'fitness_fila_sincronizacao',
    ERROR_LOGS: 'fitness_error_logs',
    BACKUP: 'fitness_backup',
    METADATA: 'fitness_metadata'
  };

  // Configurações de expiração por tipo de dado
  private static readonly EXPIRACAO_HORAS = {
    USUARIO: 168, // 1 semana
    TREINOS: 720, // 30 dias  
    EXERCICIOS: 168, // 1 semana
    PROGRESSO: 168, // 1 semana
    TEMPLATES: 72, // 3 dias
    ESTATISTICAS: 24, // 1 dia
    SISTEMA: 24 // 1 dia
  };

  /**
   * Armazena dados com metadata de expiração
   */
  static async armazenarComExpiracao<T>(
    chave: string, 
    dados: T, 
    expiracaoHoras?: number
  ): Promise<void> {
    try {
      const expiracao = expiracaoHoras || this.EXPIRACAO_HORAS.SISTEMA;
      const dadosString = JSON.stringify(dados);
      
      const metadata: CacheMetadata = {
        chave,
        ultimaAtualizacao: new Date().toISOString(),
        expiracaoHoras: expiracao,
        versao: 1,
        tamanhoBytes: dadosString.length
      };

      const dadosCache = { dados, metadata };
      await AsyncStorage.setItem(chave, JSON.stringify(dadosCache));
      
      // Atualizar registro de metadata
      await this.atualizarRegistroMetadata(chave, metadata);
      
      console.log(`✅ Cache atualizado: ${chave} (${this.formatarTamanho(metadata.tamanhoBytes)})`);
    } catch (error) {
      console.error(`❌ Erro ao armazenar cache ${chave}:`, error);
      throw new Error(`Falha ao cachear ${chave}: ${error}`);
    }
  }

  /**
   * Recupera dados do cache com validação de expiração
   */
  static async recuperarCache<T>(chave: string): Promise<T | null> {
    try {
      const dadosJson = await AsyncStorage.getItem(chave);
      if (!dadosJson) return null;

      const { dados, metadata } = JSON.parse(dadosJson);
      
      // Verificar expiração
      if (this.verificarExpiracao(metadata)) {
        await this.removerCache(chave);
        console.log(`🗑️ Cache expirado removido: ${chave}`);
        return null;
      }

      console.log(`📦 Cache recuperado: ${chave}`);
      return dados as T;
    } catch (error) {
      console.error(`❌ Erro ao recuperar cache ${chave}:`, error);
      return null;
    }
  }

  /**
   * Remove item específico do cache
   */
  static async removerCache(chave: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(chave);
      await this.removerRegistroMetadata(chave);
      console.log(`🗑️ Cache removido: ${chave}`);
    } catch (error) {
      console.error(`❌ Erro ao remover cache ${chave}:`, error);
    }
  }

  /**
   * Verifica se dados estão expirados
   */
  private static verificarExpiracao(metadata: CacheMetadata): boolean {
    const agora = new Date();
    const ultimaAtualizacao = new Date(metadata.ultimaAtualizacao);
    const diferencaHoras = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60);
    
    return diferencaHoras > metadata.expiracaoHoras;
  }

  /**
   * Sincronização inteligente com backend
   */
  static async sincronizarDados(): Promise<{
    sucesso: boolean;
    itensSincronizados: number;
    erros: string[];
  }> {
    const resultado = {
      sucesso: false,
      itensSincronizados: 0,
      erros: [] as string[]
    };

    try {
      // Verificar conectividade
      const estadoRede = await NetInfo.fetch();
      
      if (!estadoRede.isConnected) {
        resultado.erros.push('Dispositivo offline - sincronização adiada');
        return resultado;
      }

      // Recuperar fila de sincronização
      const filaSync = await this.recuperarCache<ItemSincronizacao[]>(this.CACHE_KEYS.FILA_SYNC) || [];
      const itensParaSincronizar = filaSync.filter(item => !item.sucesso && item.tentativas < 3);

      console.log(`🔄 Iniciando sincronização de ${itensParaSincronizar.length} itens`);

      // Processar cada item
      for (const item of itensParaSincronizar) {
        try {
          await this.processarItemSincronizacao(item);
          item.sucesso = true;
          resultado.itensSincronizados++;
          console.log(`✅ Item sincronizado: ${item.tipo} - ${item.id}`);
        } catch (error) {
          item.tentativas++;
          resultado.erros.push(`Erro ao sincronizar ${item.tipo}: ${error}`);
          console.error(`❌ Falha na sincronização ${item.tipo}:`, error);
        }
      }

      // Atualizar fila com resultados
      await this.armazenarComExpiracao(this.CACHE_KEYS.FILA_SYNC, filaSync, 168);
      
      resultado.sucesso = resultado.erros.length === 0;
      console.log(`🎯 Sincronização concluída: ${resultado.itensSincronizados} sucessos, ${resultado.erros.length} erros`);
      
      return resultado;
    } catch (error) {
      resultado.erros.push(`Erro geral na sincronização: ${error}`);
      console.error('❌ Erro na sincronização:', error);
      return resultado;
    }
  }

  /**
   * Adiciona item à fila de sincronização
   */
  static async adicionarFilaSincronizacao(
    tipo: ItemSincronizacao['tipo'],
    dados: any
  ): Promise<void> {
    try {
      const fila = await this.recuperarCache<ItemSincronizacao[]>(this.CACHE_KEYS.FILA_SYNC) || [];
      
      const novoItem: ItemSincronizacao = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tipo,
        dados,
        timestamp: new Date().toISOString(),
        tentativas: 0,
        sucesso: false
      };
      
      fila.push(novoItem);
      await this.armazenarComExpiracao(this.CACHE_KEYS.FILA_SYNC, fila, 168);
      
      console.log(`📤 Adicionado à fila de sincronização: ${tipo}`);
    } catch (error) {
      console.error('❌ Erro ao adicionar à fila de sincronização:', error);
    }
  }

  /**
   * Processa item individual de sincronização
   */
  private static async processarItemSincronizacao(item: ItemSincronizacao): Promise<void> {
    // Simular API call - aqui seria integração com backend real
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular sucesso na maioria dos casos
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Falha simulada na API'));
        }
      }, 1000);
    });
  }

  /**
   * Limpeza automática de cache expirado
   */
  static async limparCacheExpirado(): Promise<{
    itensRemovidos: number;
    espacoLiberado: number;
  }> {
    let itensRemovidos = 0;
    let espacoLiberado = 0;

    try {
      const chaves = await AsyncStorage.getAllKeys();
      const chavesFitness = chaves.filter(chave => chave.startsWith('fitness_'));

      for (const chave of chavesFitness) {
        try {
          const dadosJson = await AsyncStorage.getItem(chave);
          if (!dadosJson) continue;

          const { metadata } = JSON.parse(dadosJson);
          
          if (metadata && this.verificarExpiracao(metadata)) {
            espacoLiberado += dadosJson.length;
            await this.removerCache(chave);
            itensRemovidos++;
          }
        } catch (error) {
          console.error(`Erro ao verificar expiração de ${chave}:`, error);
        }
      }

      console.log(`🧹 Limpeza concluída: ${itensRemovidos} itens removidos, ${this.formatarTamanho(espacoLiberado)} liberados`);
      
      return { itensRemovidos, espacoLiberado };
    } catch (error) {
      console.error('❌ Erro na limpeza de cache:', error);
      return { itensRemovidos: 0, espacoLiberado: 0 };
    }
  }

  /**
   * Obter estatísticas do cache
   */
  static async obterEstatisticasCache(): Promise<{
    totalItens: number;
    tamanhoTotal: number;
    itensExpirados: number;
    ultimaLimpeza: string | null;
    fragmentacao: number;
  }> {
    try {
      const chaves = await AsyncStorage.getAllKeys();
      const chavesFitness = chaves.filter(chave => chave.startsWith('fitness_'));
      
      let tamanhoTotal = 0;
      let itensExpirados = 0;

      for (const chave of chavesFitness) {
        try {
          const dadosJson = await AsyncStorage.getItem(chave);
          if (dadosJson) {
            tamanhoTotal += dadosJson.length;
            
            const { metadata } = JSON.parse(dadosJson);
            if (metadata && this.verificarExpiracao(metadata)) {
              itensExpirados++;
            }
          }
        } catch (error) {
          console.error(`Erro ao analisar ${chave}:`, error);
        }
      }

      const fragmentacao = chavesFitness.length > 0 ? (itensExpirados / chavesFitness.length) * 100 : 0;

      return {
        totalItens: chavesFitness.length,
        tamanhoTotal,
        itensExpirados,
        ultimaLimpeza: null, // Implementar registro de última limpeza
        fragmentacao
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalItens: 0,
        tamanhoTotal: 0,
        itensExpirados: 0,
        ultimaLimpeza: null,
        fragmentacao: 0
      };
    }
  }

  /**
   * Backup completo dos dados
   */
  static async criarBackupCompleto(): Promise<boolean> {
    try {
      const dadosBackup = {
        usuario: await AsyncStorage.getItem(this.CACHE_KEYS.USUARIO),
        treinos: await AsyncStorage.getItem(this.CACHE_KEYS.TREINOS),
        itens_treino: await AsyncStorage.getItem(this.CACHE_KEYS.ITENS_TREINO),
        series: await AsyncStorage.getItem(this.CACHE_KEYS.SERIES),
        exercicios: await AsyncStorage.getItem(this.CACHE_KEYS.EXERCICIOS),
        progresso: await AsyncStorage.getItem(this.CACHE_KEYS.PROGRESSO),
        timestamp: new Date().toISOString(),
        versao: '1.0'
      };

      await this.armazenarComExpiracao(this.CACHE_KEYS.BACKUP, dadosBackup, 168);
      console.log('💾 Backup completo criado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      return false;
    }
  }

  /**
   * Utilitários privados
   */
  private static async atualizarRegistroMetadata(chave: string, metadata: CacheMetadata): Promise<void> {
    try {
      const registros = await this.recuperarCache<Record<string, CacheMetadata>>(this.CACHE_KEYS.METADATA) || {};
      registros[chave] = metadata;
      await AsyncStorage.setItem(this.CACHE_KEYS.METADATA, JSON.stringify(registros));
    } catch (error) {
      console.error('Erro ao atualizar metadata:', error);
    }
  }

  private static async removerRegistroMetadata(chave: string): Promise<void> {
    try {
      const registros = await this.recuperarCache<Record<string, CacheMetadata>>(this.CACHE_KEYS.METADATA) || {};
      delete registros[chave];
      await AsyncStorage.setItem(this.CACHE_KEYS.METADATA, JSON.stringify(registros));
    } catch (error) {
      console.error('Erro ao remover metadata:', error);
    }
  }

  private static formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Configuração automática para limpeza periódica
export class CacheManager {
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Inicia limpeza automática a cada 6 horas
   */
  static iniciarLimpezaAutomatica(): void {
    if (this.intervalId) return;

    // Limpeza a cada 6 horas
    this.intervalId = setInterval(async () => {
      console.log('🔄 Iniciando limpeza automática de cache...');
      const resultado = await CacheService.limparCacheExpirado();
      
      if (resultado.itensRemovidos > 0) {
        console.log(`✨ Limpeza automática: ${resultado.itensRemovidos} itens removidos`);
      }
    }, 6 * 60 * 60 * 1000); // 6 horas

    console.log('⏰ Limpeza automática de cache iniciada');
  }

  /**
   * Para limpeza automática
   */
  static pararLimpezaAutomatica(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏸️ Limpeza automática de cache parada');
    }
  }
}