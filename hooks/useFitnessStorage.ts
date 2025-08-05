import { useCallback } from 'react';
import { useAsyncStorage, useAsyncStorageArray } from './useAsyncStorage';
import { CacheService } from '../services/CacheService';
import { 
  Usuario, 
  Treino, 
  ItemTreino, 
  Serie, 
  Exercicio, 
  ProgressoExercicio,
  EstatisticasSemana,
  MetasSemanal
} from '../types/fitness';

// Validadores TypeScript para garantir integridade dos dados
const isUsuario = (obj: any): obj is Usuario => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.nome === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.altura === 'number' &&
    typeof obj.peso === 'number';
};

const isTreino = (obj: any): obj is Treino => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.nome === 'string' &&
    typeof obj.usuarioId === 'string' &&
    typeof obj.data === 'string';
};

const isExercicio = (obj: any): obj is Exercicio => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.nome === 'string' &&
    typeof obj.grupoMuscular === 'string';
};

const isSerie = (obj: any): obj is Serie => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.itemTreinoId === 'string' &&
    typeof obj.numeroSerie === 'number' &&
    typeof obj.repeticoes === 'number';
};

/**
 * Hook para gerenciar dados do usuário
 */
export function useUsuario() {
  const [usuario, setUsuario, carregando, erro, recarregar] = useAsyncStorage<Usuario | null>(
    CacheService.CACHE_KEYS.USUARIO,
    null,
    (valor): valor is Usuario | null => valor === null || isUsuario(valor)
  );

  /**
   * Atualiza perfil do usuário
   */
  const atualizarPerfil = useCallback(async (dadosUsuario: Partial<Usuario>) => {
    if (!usuario) return;
    
    const usuarioAtualizado: Usuario = { 
      ...usuario, 
      ...dadosUsuario,
      atualizadoEm: new Date().toISOString()
    };
    
    await setUsuario(usuarioAtualizado);
    
    // Adicionar à fila de sincronização
    await CacheService.adicionarFilaSincronizacao('UPDATE_USUARIO', usuarioAtualizado);
    
    console.log('👤 Perfil do usuário atualizado');
  }, [usuario, setUsuario]);

  /**
   * Criar novo usuário
   */
  const criarUsuario = useCallback(async (dadosUsuario: Omit<Usuario, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const novoUsuario: Usuario = {
      ...dadosUsuario,
      id: `user_${Date.now()}`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    await setUsuario(novoUsuario);
    console.log('👤 Novo usuário criado:', novoUsuario.nome);
    
    return novoUsuario;
  }, [setUsuario]);

  return {
    usuario,
    criarUsuario,
    atualizarPerfil,
    carregando,
    erro,
    recarregar
  };
}

/**
 * Hook para gerenciar treinos
 */
export function useTreinos() {
  const {
    items: treinos,
    adicionarItem,
    removerItem,
    atualizarItem,
    carregando,
    erro,
    recarregar
  } = useAsyncStorageArray<Treino>(CacheService.CACHE_KEYS.TREINOS, isTreino);

  /**
   * Cria novo treino
   */
  const criarTreino = useCallback(async (dadosTreino: Omit<Treino, 'id' | 'criadoEm' | 'atualizadoEm' | 'sincronizado'>) => {
    const novoTreino: Treino = {
      ...dadosTreino,
      id: `treino_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      concluido: false,
      sincronizado: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    await adicionarItem(novoTreino);
    
    // Adicionar à fila de sincronização
    await CacheService.adicionarFilaSincronizacao('CREATE_TREINO', novoTreino);
    
    console.log('💪 Novo treino criado:', novoTreino.nome);
    return novoTreino;
  }, [adicionarItem]);

  /**
   * Marca treino como concluído
   */
  const concluirTreino = useCallback(async (treinoId: string) => {
    await atualizarItem(
      treino => treino.id === treinoId,
      { 
        concluido: true, 
        sincronizado: false, 
        atualizadoEm: new Date().toISOString() 
      }
    );
    
    // Encontrar treino atualizado para sincronização
    const treino = treinos.find(t => t.id === treinoId);
    if (treino) {
      await CacheService.adicionarFilaSincronizacao('UPDATE_TREINO', { ...treino, concluido: true });
    }
    
    console.log('✅ Treino concluído:', treinoId);
  }, [atualizarItem, treinos]);

  /**
   * Edita treino existente
   */
  const editarTreino = useCallback(async (treinoId: string, novosDados: Partial<Treino>) => {
    await atualizarItem(
      treino => treino.id === treinoId,
      { 
        ...novosDados, 
        sincronizado: false, 
        atualizadoEm: new Date().toISOString() 
      }
    );
    
    console.log('✏️ Treino editado:', treinoId);
  }, [atualizarItem]);

  /**
   * Remove treino
   */
  const removerTreino = useCallback(async (treinoId: string) => {
    await removerItem(treino => treino.id === treinoId);
    console.log('🗑️ Treino removido:', treinoId);
  }, [removerItem]);

  /**
   * Busca treinos por filtros
   */
  const buscarTreinos = useCallback((filtros: {
    categoria?: string;
    concluido?: boolean;
    dataInicio?: string;
    dataFim?: string;
  } = {}) => {
    return treinos.filter(treino => {
      if (filtros.categoria && treino.categoria !== filtros.categoria) return false;
      if (filtros.concluido !== undefined && treino.concluido !== filtros.concluido) return false;
      if (filtros.dataInicio && treino.data < filtros.dataInicio) return false;
      if (filtros.dataFim && treino.data > filtros.dataFim) return false;
      return true;
    });
  }, [treinos]);

  return {
    treinos,
    criarTreino,
    concluirTreino,
    editarTreino,
    removerTreino,
    buscarTreinos,
    carregando,
    erro,
    recarregar
  };
}

/**
 * Hook para gerenciar exercícios
 */
export function useExercicios() {
  const {
    items: exercicios,
    adicionarItem,
    removerItem,
    atualizarItem,
    carregando,
    erro,
    recarregar
  } = useAsyncStorageArray<Exercicio>(CacheService.CACHE_KEYS.EXERCICIOS, isExercicio);

  /**
   * Busca exercícios por filtros
   */
  const buscarExercicios = useCallback((filtros: {
    grupoMuscular?: string;
    equipamento?: string;
    tipo?: string;
    nivel?: string;
    termo?: string;
  } = {}) => {
    return exercicios.filter(exercicio => {
      if (filtros.grupoMuscular && exercicio.grupoMuscular !== filtros.grupoMuscular) return false;
      if (filtros.equipamento && exercicio.equipamento !== filtros.equipamento) return false;
      if (filtros.tipo && exercicio.tipo !== filtros.tipo) return false;
      if (filtros.nivel && exercicio.nivel !== filtros.nivel) return false;
      if (filtros.termo) {
        const termo = filtros.termo.toLowerCase();
        const nomeMatch = exercicio.nome.toLowerCase().includes(termo);
        const grupoMatch = exercicio.grupoMuscular.toLowerCase().includes(termo);
        if (!nomeMatch && !grupoMatch) return false;
      }
      return true;
    });
  }, [exercicios]);

  /**
   * Adiciona novo exercício personalizado
   */
  const adicionarExercicio = useCallback(async (dadosExercicio: Omit<Exercicio, 'id' | 'criadoEm'>) => {
    const novoExercicio: Exercicio = {
      ...dadosExercicio,
      id: `ex_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString()
    };

    await adicionarItem(novoExercicio);
    console.log('💪 Novo exercício adicionado:', novoExercicio.nome);
    
    return novoExercicio;
  }, [adicionarItem]);

  return {
    exercicios,
    buscarExercicios,
    adicionarExercicio,
    carregando,
    erro,
    recarregar
  };
}

/**
 * Hook para gerenciar progresso
 */
export function useProgresso() {
  const {
    items: progresso,
    adicionarItem,
    atualizarItem,
    carregando,
    erro,
    recarregar
  } = useAsyncStorageArray<ProgressoExercicio>(CacheService.CACHE_KEYS.PROGRESSO);

  /**
   * Registra progresso de um exercício
   */
  const registrarProgresso = useCallback(async (
    exercicioId: string, 
    peso: number, 
    repeticoes: number,
    usuarioId: string
  ) => {
    const progressoExistente = progresso.find(p => p.exercicioId === exercicioId);
    
    if (progressoExistente) {
      // Atualizar progresso existente
      const novoRecorde = peso > progressoExistente.pesoMaximo;
      const volumeAtual = peso * repeticoes;
      
      await atualizarItem(
        p => p.exercicioId === exercicioId,
        {
          pesoMaximo: Math.max(peso, progressoExistente.pesoMaximo),
          repeticaoMaxima: novoRecorde ? repeticoes : progressoExistente.repeticaoMaxima,
          volumeMaximo: Math.max(volumeAtual, progressoExistente.volumeMaximo),
          dataRecorde: novoRecorde ? new Date().toISOString() : progressoExistente.dataRecorde,
          atualizadoEm: new Date().toISOString()
        }
      );
      
      console.log(`📈 Progresso atualizado para exercício: ${exercicioId}`);
    } else {
      // Criar novo progresso
      const novoProgresso: ProgressoExercicio = {
        id: `prog_${Date.now()}_${exercicioId}`,
        usuarioId,
        exercicioId,
        pesoMaximo: peso,
        repeticaoMaxima: repeticoes,
        volumeMaximo: peso * repeticoes,
        dataRecorde: new Date().toISOString(),
        evolucaoMensal: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      await adicionarItem(novoProgresso);
      console.log(`🆕 Novo progresso criado para exercício: ${exercicioId}`);
    }

    // Adicionar à fila de sincronização
    await CacheService.adicionarFilaSincronizacao('CREATE_PROGRESSO', { exercicioId, peso, repeticoes });
  }, [progresso, adicionarItem, atualizarItem]);

  /**
   * Obtém estatísticas de um exercício
   */
  const obterEstatisticas = useCallback((exercicioId: string) => {
    const progressoExercicio = progresso.find(p => p.exercicioId === exercicioId);
    if (!progressoExercicio) return null;

    return {
      pesoMaximo: progressoExercicio.pesoMaximo,
      repeticaoMaxima: progressoExercicio.repeticaoMaxima,
      volumeMaximo: progressoExercicio.volumeMaximo,
      dataUltimoRecorde: progressoExercicio.dataRecorde,
      evolucaoMensal: progressoExercicio.evolucaoMensal,
      temProgresso: true
    };
  }, [progresso]);

  /**
   * Obtém todos os recordes pessoais
   */
  const obterRecordesPessoais = useCallback(() => {
    return progresso.map(p => ({
      exercicioId: p.exercicioId,
      pesoMaximo: p.pesoMaximo,
      repeticaoMaxima: p.repeticaoMaxima,
      volumeMaximo: p.volumeMaximo,
      dataRecorde: p.dataRecorde
    }));
  }, [progresso]);

  return {
    progresso,
    registrarProgresso,
    obterEstatisticas,
    obterRecordesPessoais,
    carregando,
    erro,
    recarregar
  };
}

/**
 * Hook para gerenciar séries de treino
 */
export function useSeries() {
  const {
    items: series,
    adicionarItem,
    atualizarItem,
    removerItem,
    carregando,
    erro,
    recarregar
  } = useAsyncStorageArray<Serie>(CacheService.CACHE_KEYS.SERIES, isSerie);

  /**
   * Adiciona nova série
   */
  const adicionarSerie = useCallback(async (dadosSerie: Omit<Serie, 'id' | 'criadoEm'>) => {
    const novaSerie: Serie = {
      ...dadosSerie,
      id: `serie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString()
    };

    await adicionarItem(novaSerie);
    console.log('➕ Nova série adicionada');
    
    return novaSerie;
  }, [adicionarItem]);

  /**
   * Marca série como concluída
   */
  const concluirSerie = useCallback(async (serieId: string, tempoDescanso?: number) => {
    await atualizarItem(
      serie => serie.id === serieId,
      { 
        concluida: true,
        tempoDescanso: tempoDescanso
      }
    );
    
    console.log('✅ Série concluída:', serieId);
  }, [atualizarItem]);

  /**
   * Busca séries por item de treino
   */
  const obterSeriesPorItem = useCallback((itemTreinoId: string) => {
    return series
      .filter(serie => serie.itemTreinoId === itemTreinoId)
      .sort((a, b) => a.numeroSerie - b.numeroSerie);
  }, [series]);

  return {
    series,
    adicionarSerie,
    concluirSerie,
    obterSeriesPorItem,
    carregando,
    erro,
    recarregar
  };
}

/**
 * Hook para estatísticas semanais
 */
export function useEstatisticas() {
  const {
    items: estatisticas,
    adicionarItem,
    atualizarItem,
    carregando,
    erro,
    recarregar
  } = useAsyncStorageArray<EstatisticasSemana>(CacheService.CACHE_KEYS.ESTATISTICAS);

  /**
   * Calcula estatísticas da semana atual
   */
  const calcularEstatisticasSemana = useCallback(async (
    treinos: Treino[], 
    series: Serie[]
  ) => {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado
    fimSemana.setHours(23, 59, 59, 999);

    const treinosSemana = treinos.filter(treino => {
      const dataTreino = new Date(treino.data);
      return dataTreino >= inicioSemana && dataTreino <= fimSemana && treino.concluido;
    });

    const volumeTotal = series
      .filter(serie => serie.concluida && serie.peso)
      .reduce((total, serie) => total + (serie.peso! * serie.repeticoes), 0);

    const tempoTotal = treinosSemana.reduce((total, treino) => total + treino.duracaoMinutos, 0);

    const estatisticaSemana: EstatisticasSemana = {
      semana: inicioSemana.toISOString().split('T')[0],
      treinosCompletos: treinosSemana.length,
      treinosPrevistos: 6, // Padrão, pode ser configurável
      tempoTotalMinutos: tempoTotal,
      volumeTotalKg: Math.round(volumeTotal / 1000 * 100) / 100, // Converter para toneladas
      exerciciosMaisFeitos: [] // Implementar lógica de contagem
    };

    // Verificar se já existe estatística para esta semana
    const existente = estatisticas.find(e => e.semana === estatisticaSemana.semana);
    
    if (existente) {
      await atualizarItem(
        e => e.semana === estatisticaSemana.semana,
        estatisticaSemana
      );
    } else {
      await adicionarItem(estatisticaSemana);
    }

    return estatisticaSemana;
  }, [estatisticas, adicionarItem, atualizarItem]);

  return {
    estatisticas,
    calcularEstatisticasSemana,
    carregando,
    erro,
    recarregar
  };
}