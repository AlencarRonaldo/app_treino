import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  useUsuario, 
  useTreinos, 
  useProgresso, 
  useExercicios, 
  useSeries,
  useEstatisticas
} from '../hooks/useFitnessStorage';
import { CacheService, CacheManager } from '../services/CacheService';
import { 
  Usuario, 
  Treino, 
  ItemTreino, 
  Serie, 
  Exercicio, 
  ProgressoExercicio,
  EstatisticasSemana
} from '../types/fitness';

// Interface do contexto fitness
interface FitnessContextType {
  // Estado de carregamento geral
  carregando: boolean;
  erro: Error | null;
  
  // Usuário
  usuario: Usuario | null;
  criarUsuario: (dados: Omit<Usuario, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Usuario>;
  atualizarPerfil: (dados: Partial<Usuario>) => Promise<void>;
  
  // Treinos
  treinos: Treino[];
  criarTreino: (dados: Omit<Treino, 'id' | 'criadoEm' | 'atualizadoEm' | 'sincronizado'>) => Promise<Treino>;
  concluirTreino: (id: string) => Promise<void>;
  editarTreino: (id: string, dados: Partial<Treino>) => Promise<void>;
  removerTreino: (id: string) => Promise<void>;
  buscarTreinos: (filtros?: any) => Treino[];
  
  // Exercícios
  exercicios: Exercicio[];
  buscarExercicios: (filtros?: any) => Exercicio[];
  adicionarExercicio: (dados: Omit<Exercicio, 'id' | 'criadoEm'>) => Promise<Exercicio>;
  
  // Séries
  series: Serie[];
  adicionarSerie: (dados: Omit<Serie, 'id' | 'criadoEm'>) => Promise<Serie>;
  concluirSerie: (id: string, tempoDescanso?: number) => Promise<void>;
  obterSeriesPorItem: (itemTreinoId: string) => Serie[];
  
  // Progresso
  progresso: ProgressoExercicio[];
  registrarProgresso: (exercicioId: string, peso: number, repeticoes: number, usuarioId: string) => Promise<void>;
  obterEstatisticas: (exercicioId: string) => any;
  obterRecordesPessoais: () => any[];
  
  // Estatísticas
  estatisticas: EstatisticasSemana[];
  calcularEstatisticasSemana: (treinos: Treino[], series: Serie[]) => Promise<EstatisticasSemana>;
  
  // Funções de sistema
  sincronizarDados: () => Promise<void>;
  limparCache: () => Promise<void>;
  criarBackup: () => Promise<void>;
  recarregarTodos: () => Promise<void>;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

// Props do provider
interface FitnessProviderProps {
  children: ReactNode;
}

/**
 * Provider principal do contexto Fitness
 * Integra todos os hooks de persistência e fornece API unificada
 */
export function FitnessProvider({ children }: FitnessProviderProps) {
  // Hooks de dados
  const { 
    usuario, 
    criarUsuario, 
    atualizarPerfil, 
    carregando: carregandoUsuario,
    erro: erroUsuario,
    recarregar: recarregarUsuario
  } = useUsuario();

  const { 
    treinos, 
    criarTreino, 
    concluirTreino, 
    editarTreino, 
    removerTreino, 
    buscarTreinos,
    carregando: carregandoTreinos,
    erro: erroTreinos,
    recarregar: recarregarTreinos
  } = useTreinos();

  const { 
    exercicios, 
    buscarExercicios, 
    adicionarExercicio,
    carregando: carregandoExercicios,
    erro: erroExercicios,
    recarregar: recarregarExercicios
  } = useExercicios();

  const { 
    series, 
    adicionarSerie, 
    concluirSerie, 
    obterSeriesPorItem,
    carregando: carregandoSeries,
    erro: erroSeries,
    recarregar: recarregarSeries
  } = useSeries();

  const { 
    progresso, 
    registrarProgresso, 
    obterEstatisticas, 
    obterRecordesPessoais,
    carregando: carregandoProgresso,
    erro: erroProgresso,
    recarregar: recarregarProgresso
  } = useProgresso();

  const { 
    estatisticas, 
    calcularEstatisticasSemana,
    carregando: carregandoEstatisticas,
    erro: erroEstatisticas,
    recarregar: recarregarEstatisticas
  } = useEstatisticas();

  // Estado geral
  const carregando = carregandoUsuario || carregandoTreinos || carregandoExercicios || 
                    carregandoSeries || carregandoProgresso || carregandoEstatisticas;

  const erro = erroUsuario || erroTreinos || erroExercicios || 
               erroSeries || erroProgresso || erroEstatisticas;

  // Inicialização do sistema
  useEffect(() => {
    inicializarSistema();
    return () => {
      // Cleanup
      CacheManager.pararLimpezaAutomatica();
    };
  }, []);

  /**
   * Inicializa sistema de cache e limpeza automática
   */
  const inicializarSistema = async () => {
    try {
      console.log('🚀 Inicializando sistema TreinosApp...');
      
      // Iniciar limpeza automática de cache
      CacheManager.iniciarLimpezaAutomatica();
      
      // Tentar sincronização inicial se online
      await sincronizarDados();
      
      // Carregar exercícios padrão se necessário
      await carregarExerciciosPadrao();
      
      // Carregar treino padrão se necessário
      await carregarTreinoPadrao();
      
      console.log('✅ Sistema TreinosApp inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      tratarErro(error as Error, 'Inicialização do sistema');
    }
  };

  /**
   * Carrega exercícios padrão se não existirem
   */
  const carregarExerciciosPadrao = async () => {
    if (exercicios.length === 0) {
      console.log('📚 Carregando exercícios padrão...');
      
      // Exercícios básicos brasileiros
      const exerciciosPadrao: Omit<Exercicio, 'id' | 'criadoEm'>[] = [
        {
          nome: 'Supino Reto',
          grupoMuscular: 'peito',
          subgrupos: ['peitoral maior', 'triceps', 'deltoides anterior'],
          equipamento: 'barra',
          tipo: 'forca',
          nivel: 'intermediario',
          instrucoes: 'Deite no banco, pegada na largura dos ombros, desça controlado até o peito e empurre para cima.',
          dicas: ['Mantenha os pés firmes no chão', 'Contraia o abdômen', 'Respiração: inspire na descida, expire na subida']
        },
        {
          nome: 'Agachamento Livre',
          grupoMuscular: 'pernas',
          subgrupos: ['quadriceps', 'gluteos', 'isquiotibiais'],
          equipamento: 'barra',
          tipo: 'forca',
          nivel: 'intermediario',
          instrucoes: 'Pés na largura dos ombros, desça até 90 graus mantendo as costas retas, suba contraindo glúteos.',
          dicas: ['Joelhos alinhados com os pés', 'Peito para frente', 'Peso nos calcanhares']
        },
        {
          nome: 'Puxada Frontal',
          grupoMuscular: 'costas',
          subgrupos: ['latissimo dorso', 'romboides', 'biceps'],
          equipamento: 'polia',
          tipo: 'forca',
          nivel: 'iniciante',
          instrucoes: 'Sentado, puxe a barra até a altura do peito contraindo as escápulas.',
          dicas: ['Peito para frente', 'Cotovelos para trás', 'Contraia as costas']
        },
        {
          nome: 'Desenvolvimento com Halteres',
          grupoMuscular: 'ombros',
          subgrupos: ['deltoides anterior', 'deltoides medial', 'triceps'],
          equipamento: 'halteres',
          tipo: 'forca',
          nivel: 'iniciante',
          instrucoes: 'Sentado, empurre os halteres acima da cabeça, controle a descida.',
          dicas: ['Abdômen contraído', 'Movimento controlado', 'Não trave os cotovelos']
        },
        {
          nome: 'Rosca Direta',
          grupoMuscular: 'biceps',
          subgrupos: ['biceps braquial', 'braquiorradial'],
          equipamento: 'barra',
          tipo: 'forca',
          nivel: 'iniciante',
          instrucoes: 'Em pé, cotovelos fixos, flexione os braços contraindo o bíceps.',
          dicas: ['Cotovelos colados ao corpo', 'Movimento controlado', 'Não balance o corpo']
        }
      ];

      for (const exercicio of exerciciosPadrao) {
        await adicionarExercicio(exercicio);
      }
      
      console.log(`✅ ${exerciciosPadrao.length} exercícios padrão carregados`);
    }
  };

  /**
   * Carrega treino padrão se não existir nenhum
   */
  const carregarTreinoPadrao = async () => {
    if (treinos.length === 0) {
      console.log('🏋️ Carregando treino padrão...');
      
      // Treino padrão brasileiro
      const treinoPadrao: Omit<Treino, 'id' | 'criadoEm' | 'atualizadoEm' | 'sincronizado'> = {
        nome: 'Peito e Tríceps',
        descricao: 'Treino focado em peito e tríceps para iniciantes',
        categoria: 'forca',
        usuarioId: 'user_default',
        data: new Date().toISOString(),
        duracaoMinutos: 45,
        concluido: false,
        itens: [
          {
            id: 'item_1',
            exercicioId: 'Supino Reto',
            series: 3,
            repeticoes: 12,
            pesoKg: 60,
            tempoDescanso: 60,
            observacoes: 'Manter controle total do movimento'
          },
          {
            id: 'item_2', 
            exercicioId: 'Desenvolvimento com Halteres',
            series: 3,
            repeticoes: 10,
            pesoKg: 20,
            tempoDescanso: 60,
            observacoes: 'Focar na amplitude completa'
          },
          {
            id: 'item_3',
            exercicioId: 'Rosca Direta', 
            series: 3,
            repeticoes: 15,
            pesoKg: 15,
            tempoDescanso: 45,
            observacoes: 'Controlar a descida do peso'
          }
        ]
      };

      await criarTreino(treinoPadrao);
      console.log('✅ Treino padrão criado: Peito e Tríceps');
    }
  };

  /**
   * Sincroniza dados com backend
   */
  const sincronizarDados = async () => {
    try {
      console.log('🔄 Iniciando sincronização...');
      const resultado = await CacheService.sincronizarDados();
      
      if (resultado.sucesso) {
        console.log(`✅ Sincronização bem-sucedida: ${resultado.itensSincronizados} itens`);
      } else {
        console.warn(`⚠️ Sincronização com problemas: ${resultado.erros.length} erros`);
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      tratarErro(error as Error, 'Sincronização de dados');
    }
  };

  /**
   * Limpa cache expirado
   */
  const limparCache = async () => {
    try {
      console.log('🧹 Iniciando limpeza de cache...');
      const resultado = await CacheService.limparCacheExpirado();
      
      if (resultado.itensRemovidos > 0) {
        console.log(`🗑️ Cache limpo: ${resultado.itensRemovidos} itens removidos`);
        Alert.alert(
          'Cache Limpo',
          `${resultado.itensRemovidos} itens antigos foram removidos para liberar espaço.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Cache', 'Nenhum item expirado encontrado.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      tratarErro(error as Error, 'Limpeza de cache');
    }
  };

  /**
   * Cria backup completo
   */
  const criarBackup = async () => {
    try {
      console.log('💾 Criando backup...');
      const sucesso = await CacheService.criarBackupCompleto();
      
      if (sucesso) {
        Alert.alert(
          'Backup Criado',
          'Backup completo dos seus dados foi criado com sucesso.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erro no Backup',
          'Não foi possível criar o backup. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Erro no backup:', error);
      tratarErro(error as Error, 'Criação de backup');
    }
  };

  /**
   * Recarrega todos os dados
   */
  const recarregarTodos = async () => {
    try {
      console.log('🔄 Recarregando todos os dados...');
      
      await Promise.all([
        recarregarUsuario(),
        recarregarTreinos(),
        recarregarExercicios(),
        recarregarSeries(),
        recarregarProgresso(),
        recarregarEstatisticas()
      ]);
      
      console.log('✅ Todos os dados recarregados');
    } catch (error) {
      console.error('❌ Erro ao recarregar:', error);
      tratarErro(error as Error, 'Recarregamento de dados');
    }
  };

  /**
   * Tratamento centralizado de erros
   */
  const tratarErro = (error: Error, contexto: string) => {
    console.error(`❌ Erro em ${contexto}:`, error);
    
    // Determinar tipo de erro e mensagem amigável
    let mensagem = 'Algo deu errado. Tente novamente.';
    
    if (error.message.includes('Network')) {
      mensagem = 'Verifique sua conexão com a internet.';
    } else if (error.message.includes('Storage')) {
      mensagem = 'Erro ao salvar dados. Reinicie o app.';
    } else if (error.message.includes('Parse')) {
      mensagem = 'Dados corrompidos. Um backup pode ser restaurado.';
    }

    Alert.alert(
      'Erro',
      `${contexto}: ${mensagem}`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Recarregar', 
          style: 'cancel', 
          onPress: () => recarregarTodos() 
        }
      ]
    );
  };

  // Valor do contexto
  const contextValue: FitnessContextType = {
    // Estado
    carregando,
    erro,
    
    // Usuário
    usuario,
    criarUsuario,
    atualizarPerfil,
    
    // Treinos
    treinos,
    criarTreino,
    concluirTreino,
    editarTreino,
    removerTreino,
    buscarTreinos,
    
    // Exercícios
    exercicios,
    buscarExercicios,
    adicionarExercicio,
    
    // Séries
    series,
    adicionarSerie,
    concluirSerie,
    obterSeriesPorItem,
    
    // Progresso
    progresso,
    registrarProgresso,
    obterEstatisticas,
    obterRecordesPessoais,
    
    // Estatísticas
    estatisticas,
    calcularEstatisticasSemana,
    
    // Sistema
    sincronizarDados,
    limparCache,
    criarBackup,
    recarregarTodos
  };

  return (
    <FitnessContext.Provider value={contextValue}>
      {children}
    </FitnessContext.Provider>
  );
}

/**
 * Hook para usar o contexto fitness
 */
export function useFitness(): FitnessContextType {
  const context = useContext(FitnessContext);
  
  if (context === undefined) {
    throw new Error('useFitness deve ser usado dentro de FitnessProvider');
  }
  
  return context;
}

/**
 * Hook para estatísticas rápidas
 */
export function useFitnessStats() {
  const { treinos, progresso, series } = useFitness();

  const stats = {
    totalTreinos: treinos.length,
    treinosCompletos: treinos.filter(t => t.concluido).length,
    totalExercicios: progresso.length,
    recordesPessoais: progresso.length,
    volumeTotal: series
      .filter(s => s.concluida && s.peso)
      .reduce((total, s) => total + (s.peso! * s.repeticoes), 0),
    tempoTotal: treinos
      .filter(t => t.concluido)
      .reduce((total, t) => total + t.duracaoMinutos, 0)
  };

  return stats;
}