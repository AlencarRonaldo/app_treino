import * as yup from 'yup';

// Esquema de validação para cadastro - Etapa 1 (Dados Básicos)
export const signupStep1Schema = yup.object({
  firstName: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  lastName: yup
    .string()
    .required('Sobrenome é obrigatório')
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'
    ),
  
  confirmPassword: yup
    .string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('password')], 'Senhas não coincidem'),
  
  acceptsTerms: yup
    .boolean()
    .required('Você deve aceitar os termos de uso')
    .oneOf([true], 'Você deve aceitar os termos de uso'),
});

// Esquema de validação para cadastro - Etapa 2 (Dados Pessoais)
export const signupStep2Schema = yup.object({
  dateOfBirth: yup
    .string()
    .optional()
    .test('age', 'Você deve ter pelo menos 13 anos', function(value) {
      if (!value) return true; // Opcional
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13;
    }),
  
  gender: yup
    .string()
    .optional()
    .oneOf(['masculino', 'feminino', 'outro', 'prefiro_nao_dizer']),
  
  phone: yup
    .string()
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (xx) xxxxx-xxxx'),
  
  height: yup
    .number()
    .optional()
    .min(100, 'Altura deve ser pelo menos 100cm')
    .max(250, 'Altura deve ser no máximo 250cm'),
  
  weight: yup
    .number()
    .optional()
    .min(30, 'Peso deve ser pelo menos 30kg')
    .max(300, 'Peso deve ser no máximo 300kg'),
  
  activityLevel: yup
    .string()
    .optional()
    .oneOf(['sedentario', 'pouco_ativo', 'moderadamente_ativo', 'muito_ativo', 'extremamente_ativo']),
});

// Esquema de validação para cadastro - Etapa 3 (Objetivos)
export const signupStep3Schema = yup.object({
  fitnessGoal: yup
    .string()
    .optional()
    .oneOf(['perda_peso', 'ganho_massa', 'manutencao', 'resistencia', 'forca', 'bem_estar']),
  
  experienceLevel: yup
    .string()
    .optional()
    .oneOf(['iniciante', 'intermediario', 'avancado']),
  
  preferredWorkoutDays: yup
    .number()
    .optional()
    .min(1, 'Mínimo 1 dia por semana')
    .max(7, 'Máximo 7 dias por semana'),
  
  preferredWorkoutDuration: yup
    .number()
    .optional()
    .min(15, 'Mínimo 15 minutos')
    .max(180, 'Máximo 3 horas'),
  
  hasInjuries: yup
    .boolean()
    .required(),
  
  injuriesDescription: yup
    .string()
    .when('hasInjuries', {
      is: true,
      then: (schema) => schema.required('Descreva suas lesões/limitações'),
      otherwise: (schema) => schema.optional(),
    })
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  
  acceptsMarketing: yup
    .boolean()
    .optional(),
});

// Esquema de validação para login
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido'),
  
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  
  rememberMe: yup
    .boolean()
    .optional(),
});

// Esquema de validação para edição de perfil
export const editProfileSchema = yup.object({
  firstName: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  
  lastName: yup
    .string()
    .required('Sobrenome é obrigatório')
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres'),
  
  phone: yup
    .string()
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (xx) xxxxx-xxxx'),
  
  height: yup
    .number()
    .optional()
    .min(100, 'Altura deve ser pelo menos 100cm')
    .max(250, 'Altura deve ser no máximo 250cm'),
  
  weight: yup
    .number()
    .optional()
    .min(30, 'Peso deve ser pelo menos 30kg')
    .max(300, 'Peso deve ser no máximo 300kg'),
});

// Esquema de validação para alteração de senha
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Senha atual é obrigatória'),
  
  newPassword: yup
    .string()
    .required('Nova senha é obrigatória')
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'
    ),
  
  confirmNewPassword: yup
    .string()
    .required('Confirmação da nova senha é obrigatória')
    .oneOf([yup.ref('newPassword')], 'Senhas não coincidem'),
});