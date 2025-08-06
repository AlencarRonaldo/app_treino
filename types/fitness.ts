// Tipos para sistema de fitness brasileiro com terminologia local

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  altura: number; // cm
  peso: number; // kg
  objetivo: 'ganho_massa' | 'perda_peso' | 'resistencia' | 'forca';
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  tipo: 'personal' | 'student';
  criadoEm: string;
  atualizadoEm: string;
}

export interface Exercicio {
  id: string;
  nome: string; // "Supino reto", "Agachamento livre"
  grupoMuscular: string; // "peito", "pernas", "costas"
  subgrupos: string[]; // ["peitoral maior", "triceps", "deltoides anterior"]
  equipamento: string; // "halteres", "barra", "peso_corporal", "maquina"
  tipo: 'forca' | 'cardio' | 'flexibilidade' | 'funcional';
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  instrucoes: string;
  dicas: string[];
  imagemUrl?: string;
  videoUrl?: string;
  criadoEm: string;
}

export interface Treino {
  id: string;
  usuarioId: string;
  nome: string; // "Treino A - Peito e Tríceps"
  descricao?: string;
  categoria: 'abc' | 'upper_lower' | 'push_pull_legs' | 'full_body' | 'personalizado';
  data: string;
  duracaoMinutos: number;
  observacoes?: string;
  concluido: boolean;
  sincronizado: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemTreino {
  id: string;
  treinoId: string;
  exercicioId: string;
  ordem: number; // ordem do exercício no treino
  descansoSegundos: number; // tempo de descanso após o exercício
  observacoes?: string;
  criadoEm: string;
}

export interface Serie {
  id: string;
  itemTreinoId: string;
  numeroSerie: number;
  repeticoes: number;
  peso?: number; // kg
  duracaoSegundos?: number; // para exercícios de tempo
  rpe?: number; // Rate of Perceived Exertion (1-10)
  concluida: boolean;
  tempoDescanso?: number; // tempo real de descanso em segundos
  criadoEm: string;
}

export interface ProgressoExercicio {
  id: string;
  usuarioId: string;
  exercicioId: string;
  pesoMaximo: number;
  repeticaoMaxima: number;
  volumeMaximo: number; // peso x repetições x séries
  dataRecorde: string;
  evolucaoMensal: Array<{
    mes: string; // 'YYYY-MM'
    pesoMedio: number;
    volumeTotal: number;
    sessoesTreino: number;
  }>;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TemplatesTreino {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  duracaoSemanas: number;
  diasPorSemana: number;
  exercicios: Array<{
    exercicioId: string;
    series: number;
    repeticoes: string; // "8-12" ou "10"
    descanso: number; // segundos
    observacoes?: string;
  }>;
  autor: string;
  popularidade: number;
  criadoEm: string;
}

// Tipos para cache e sincronização
export interface CacheMetadata {
  chave: string;
  ultimaAtualizacao: string;
  expiracaoHoras: number;
  versao: number;
  tamanhoBytes: number;
}

export interface ItemSincronizacao {
  id: string;
  tipo: 'CREATE_TREINO' | 'UPDATE_TREINO' | 'DELETE_TREINO' | 'CREATE_PROGRESSO' | 'UPDATE_USUARIO';
  dados: any;
  timestamp: string;
  tentativas: number;
  sucesso: boolean;
}

// Tipos para estatísticas e métricas
export interface EstatisticasSemana {
  semana: string; // 'YYYY-MM-DD' (segunda-feira)
  treinosCompletos: number;
  treinosPrevistos: number;
  tempoTotalMinutos: number;
  volumeTotalKg: number;
  exerciciosMaisFeitos: Array<{
    exercicioId: string;
    quantidade: number;
  }>;
}

export interface MetasSemanal {
  id: string;
  usuarioId: string;
  semana: string;
  metaTreinos: number;
  metaTempo: number; // minutos
  metaVolume: number; // kg
  metaCalorias?: number;
  progresso: {
    treinos: number;
    tempo: number;
    volume: number;
    calorias?: number;
  };
  criadoEm: string;
  atualizadoEm: string;
}

// Tipos para grupos musculares brasileiros
export type GrupoMuscular = 
  | 'peito' 
  | 'costas' 
  | 'pernas' 
  | 'ombros' 
  | 'biceps' 
  | 'triceps' 
  | 'abdomen' 
  | 'panturrilha'
  | 'antebraco'
  | 'trapezio'
  | 'gluteos';

export interface GrupoMuscularInfo {
  nome: string;
  cor: string;
  icone: string;
  exerciciosPrincipais: string[];
  subgrupos: string[];
}

// Constantes brasileiras
export const GRUPOS_MUSCULARES_BRASIL: Record<GrupoMuscular, GrupoMuscularInfo> = {
  peito: {
    nome: 'Peitoral',
    cor: '#FF6B35',
    icone: 'body',
    exerciciosPrincipais: ['Supino reto', 'Supino inclinado', 'Crucifixo'],
    subgrupos: ['Peitoral maior', 'Peitoral menor']
  },
  costas: {
    nome: 'Costas',
    cor: '#2E86AB',
    icone: 'fitness',
    exerciciosPrincipais: ['Puxada frontal', 'Remada curvada', 'Barra fixa'],
    subgrupos: ['Latíssimo do dorso', 'Romboides', 'Trapézio médio']
  },
  pernas: {
    nome: 'Pernas',
    cor: '#27AE60',
    icone: 'walk',
    exerciciosPrincipais: ['Agachamento', 'Leg press', 'Stiff'],
    subgrupos: ['Quadríceps', 'Isquiotibiais', 'Glúteos']
  },
  ombros: {
    nome: 'Ombros',
    cor: '#F39C12',
    icone: 'arrow-up',
    exerciciosPrincipais: ['Desenvolvimento', 'Elevação lateral', 'Elevação frontal'],
    subgrupos: ['Deltóide anterior', 'Deltóide medial', 'Deltóide posterior']
  },
  biceps: {
    nome: 'Bíceps',
    cor: '#9B59B6',
    icone: 'fitness-outline',
    exerciciosPrincipais: ['Rosca direta', 'Rosca martelo', 'Rosca concentrada'],
    subgrupos: ['Bíceps braquial', 'Braquiorradial']
  },
  triceps: {
    nome: 'Tríceps',
    cor: '#E74C3C',
    icone: 'fitness-outline',
    exerciciosPrincipais: ['Testa', 'Paralelas', 'Corda'],
    subgrupos: ['Cabeça longa', 'Cabeça lateral', 'Cabeça medial']
  },
  abdomen: {
    nome: 'Abdômen',
    cor: '#34495E',
    icone: 'body-outline',
    exerciciosPrincipais: ['Abdominal', 'Prancha', 'Bicicleta'],
    subgrupos: ['Reto abdominal', 'Oblíquos', 'Transverso abdominal']
  },
  panturrilha: {
    nome: 'Panturrilha',
    cor: '#16A085',
    icone: 'walk-outline',
    exerciciosPrincipais: ['Panturrilha em pé', 'Panturrilha sentado'],
    subgrupos: ['Gastrocnêmio', 'Sóleo']
  },
  antebraco: {
    nome: 'Antebraço',
    cor: '#95A5A6',
    icone: 'hand-left',
    exerciciosPrincipais: ['Rosca punho', 'Rosca inversa'],
    subgrupos: ['Flexores', 'Extensores']
  },
  trapezio: {
    nome: 'Trapézio',
    cor: '#8E44AD',
    icone: 'triangle',
    exerciciosPrincipais: ['Encolhimento', 'Remada alta'],
    subgrupos: ['Trapézio superior', 'Trapézio médio', 'Trapézio inferior']
  },
  gluteos: {
    nome: 'Glúteos',
    cor: '#D35400',
    icone: 'ellipse',
    exerciciosPrincipais: ['Agachamento', 'Hip thrust', 'Stiff'],
    subgrupos: ['Glúteo máximo', 'Glúteo médio', 'Glúteo mínimo']
  }
};

export const EQUIPAMENTOS_BRASIL = {
  'peso_corporal': 'Peso corporal',
  'halteres': 'Halteres',
  'barra': 'Barra',
  'maquina': 'Máquina',
  'polia': 'Polia/Cabo',
  'elastico': 'Elástico',
  'ketlebell': 'Kettlebell',
  'medicine_ball': 'Medicine Ball',
  'banco': 'Banco',
  'smith': 'Smith Machine'
};

export const OBJETIVOS_BRASIL = {
  'ganho_massa': 'Ganho de Massa Muscular',
  'perda_peso': 'Perda de Peso',
  'resistencia': 'Resistência Cardiovascular',
  'forca': 'Ganho de Força'
};

export const NIVEIS_BRASIL = {
  'iniciante': 'Iniciante (0-6 meses)',
  'intermediario': 'Intermediário (6 meses - 2 anos)',
  'avancado': 'Avançado (2+ anos)'
};