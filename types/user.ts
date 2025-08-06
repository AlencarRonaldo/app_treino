// Tipos para dados do usuário
export interface UserRegistrationData {
  // Dados básicos
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Dados pessoais
  dateOfBirth?: string;
  gender?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer';
  phone?: string;
  
  // Dados físicos
  height?: number; // em cm
  weight?: number; // em kg
  activityLevel?: 'sedentario' | 'pouco_ativo' | 'moderadamente_ativo' | 'muito_ativo' | 'extremamente_ativo';
  
  // Objetivos
  fitnessGoal?: 'perda_peso' | 'ganho_massa' | 'manutencao' | 'resistencia' | 'forca' | 'bem_estar';
  experienceLevel?: 'iniciante' | 'intermediario' | 'avancado';
  
  // Preferências
  preferredWorkoutDays?: number; // dias por semana
  preferredWorkoutDuration?: number; // minutos
  hasInjuries?: boolean;
  injuriesDescription?: string;
  
  // Configurações
  acceptsTerms: boolean;
  acceptsMarketing?: boolean;
}

export interface UserProfile extends Omit<UserRegistrationData, 'password' | 'confirmPassword'> {
  id: string;
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  avatar?: string;
  
  // Estatísticas
  totalWorkouts?: number;
  totalWorkoutTime?: number; // em minutos
  currentStreak?: number; // dias consecutivos
  longestStreak?: number;
  joinedDate: string;
}

// Dados para login
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Opções para seletores
export const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefiro não dizer', value: 'prefiro_nao_dizer' },
];

export const ACTIVITY_LEVEL_OPTIONS = [
  { 
    label: 'Sedentário', 
    value: 'sedentario',
    description: 'Pouco ou nenhum exercício'
  },
  { 
    label: 'Pouco Ativo', 
    value: 'pouco_ativo',
    description: 'Exercício leve 1-3 dias/semana'
  },
  { 
    label: 'Moderadamente Ativo', 
    value: 'moderadamente_ativo',
    description: 'Exercício moderado 3-5 dias/semana'
  },
  { 
    label: 'Muito Ativo', 
    value: 'muito_ativo',
    description: 'Exercício intenso 6-7 dias/semana'
  },
  { 
    label: 'Extremamente Ativo', 
    value: 'extremamente_ativo',
    description: 'Exercício muito intenso, trabalho físico'
  },
];

export const FITNESS_GOAL_OPTIONS = [
  { label: 'Perda de Peso', value: 'perda_peso', icon: 'trending-down' },
  { label: 'Ganho de Massa', value: 'ganho_massa', icon: 'trending-up' },
  { label: 'Manutenção', value: 'manutencao', icon: 'remove' },
  { label: 'Resistência', value: 'resistencia', icon: 'time' },
  { label: 'Força', value: 'forca', icon: 'barbell' },
  { label: 'Bem-estar Geral', value: 'bem_estar', icon: 'heart' },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { 
    label: 'Iniciante', 
    value: 'iniciante',
    description: 'Começando agora ou pouca experiência'
  },
  { 
    label: 'Intermediário', 
    value: 'intermediario',
    description: 'Alguns meses/anos de experiência'
  },
  { 
    label: 'Avançado', 
    value: 'avancado',
    description: 'Muitos anos de experiência'
  },
];