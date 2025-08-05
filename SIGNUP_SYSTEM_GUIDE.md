# 📝 Sistema de Cadastro com Email e Senha

Guia completo do sistema de cadastro implementado no TreinosApp.

## 🎯 O que foi implementado:

### ✅ **Sistema de Cadastro Completo**
- **SignupScreen**: Tela de cadastro multi-etapas com validação
- **FitnessInput**: Componente de input customizado com ícones
- **Validação robusta**: Usando React Hook Form + Yup
- **Tipos TypeScript**: Modelos de dados completos
- **Integração com AuthContext**: Login automático após cadastro

### 📱 **Funcionalidades da Tela de Cadastro**

#### **Dados Básicos (Etapa 1/3)**
```typescript
- Nome * (obrigatório, min 2 chars, apenas letras)
- Sobrenome * (obrigatório, min 2 chars, apenas letras)  
- Email * (formato válido, único)
- Senha * (min 6 chars, 1 maiúscula, 1 minúscula, 1 número)
- Confirmar Senha * (deve coincidir)
- Aceitar Termos * (obrigatório)
```

#### **Design da Interface**
- **Gradiente de fundo**: Laranja → Azul (tema do app)
- **Progress bar**: Indicador visual de progresso (1/3)
- **Ícones intuitivos**: Person, mail, lock com interação
- **Validação em tempo real**: Erros aparecem conforme digitação
- **Toggle senha**: Botão olho para mostrar/ocultar
- **Layout responsivo**: KeyboardAvoidingView para mobile

### 🛠️ **Componentes Criados**

#### **1. FitnessInput**
Componente de input reutilizável com:
```tsx
<FitnessInput
  label="Email *"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
  left={<FitnessInput.Icon name="mail" />}
  right={<FitnessInput.Icon name="checkmark" />}
/>
```

**Características**:
- Ícones à esquerda e direita
- Estados de foco e erro
- Suporte a texto multilinha
- Personalização completa
- Integração com React Hook Form

#### **2. Tipos TypeScript**
```typescript
interface UserRegistrationData {
  // Dados básicos
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  
  // Dados pessoais (futuras etapas)
  dateOfBirth?: string;
  gender?: 'masculino' | 'feminino' | 'outro';
  height?: number;
  weight?: number;
  
  // Objetivos fitness
  fitnessGoal?: 'perda_peso' | 'ganho_massa' | 'bem_estar';
  experienceLevel?: 'iniciante' | 'intermediario' | 'avancado';
}
```

#### **3. Validação com Yup**
```typescript
const signupStep1Schema = yup.object({
  firstName: yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
    
  email: yup.string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido'),
    
  password: yup.string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter: 1 maiúscula, 1 minúscula, 1 número'),
});
```

### 🔄 **Fluxo de Cadastro**

1. **Usuário clica "Criar nova conta"** no LoginScreen
2. **Navega para SignupScreen** (Etapa 1/3)
3. **Preenche dados básicos** com validação em tempo real
4. **Aceita termos de uso** (obrigatório)
5. **Clica "Continuar"** → Valida dados
6. **Verifica email duplicado** (simulado)
7. **Passa para próxima etapa** (futuras implementações)
8. **Cadastra no sistema** e faz login automático
9. **Redireciona para app principal**

### 💾 **Integração com AuthContext**

#### **Funções Adicionadas**
```typescript
interface AuthContextType {
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (userData: UserRegistrationData) => Promise<boolean>;
  // ... outras funções
}
```

#### **Simulação de API**
```typescript
// Para desenvolvimento - substituir por API real
async function simulateEmailSignup(userData: any) {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Delay
  
  if (userData.email === 'existente@teste.com') {
    return { success: false, error: 'Email já cadastrado' };
  }
  
  return {
    success: true,
    user: {
      id: Date.now().toString(),
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
    }
  };
}
```

### 🎨 **Design System**

#### **Cores e Estilos**
- **Gradiente**: Primary → Secondary
- **Cards**: Fundo branco com shadow
- **Inputs**: Outlined com foco azul
- **Botões**: Primary (gradiente), Outline (transparente)
- **Texto**: Primary escuro, Secondary médio

#### **Layout Responsivo**
- **KeyboardAvoidingView**: Para evitar sobreposição
- **ScrollView**: Para campos longos
- **SafeArea**: Respeitando notch e barras
- **Flexbox**: Layout adaptativo

### 🔒 **Segurança Implementada**

#### **Validação de Senha**
- Mínimo 6 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula  
- Pelo menos 1 número
- Confirmação obrigatória

#### **Validação de Email**
- Formato RFC válido
- Verificação de duplicidade (simulada)
- Normalização automática

#### **Dados Pessoais**
- Validação de caracteres especiais
- Máscaras para telefone/CPF (futuro)
- Sanitização de inputs

### 📋 **Futuras Etapas (Planejadas)**

#### **Etapa 2/3: Dados Pessoais**
```typescript
- Data de nascimento (validação de idade mínima)
- Gênero (seletor customizado)
- Telefone (máscara brasileira)  
- Altura/Peso (inputs numéricos)
- Nível de atividade (slider/seletor)
```

#### **Etapa 3/3: Objetivos Fitness**
```typescript
- Objetivo principal (cards seletivos)
- Nível de experiência (iniciante/intermediário/avançado)
- Dias preferidos de treino (seletor múltiplo)
- Duração preferida (slider)
- Lesões/limitações (textarea)
```

### 🧪 **Como Testar**

#### **Dados Válidos**
```
Nome: João
Sobrenome: Silva  
Email: joao@teste.com
Senha: MinhaSenh4
Confirmar: MinhaSenh4
✅ Aceitar termos
```

#### **Casos de Erro**
```
Email existente: existente@teste.com
Senha fraca: 123456
Senhas diferentes: senha ≠ confirmação
Nome inválido: João123 (números)
```

#### **Fluxo Completo**
1. Abra o app → LoginScreen
2. Clique "Criar nova conta"
3. Preencha dados válidos
4. Marque aceitar termos  
5. Clique "Continuar"
6. App simula cadastro (2s)
7. Login automático
8. Redireciona para HomeScreen

### 📁 **Arquivos Criados**

```
/screens/
  └── SignupScreen.tsx          # Tela de cadastro

/components/  
  └── FitnessInput.tsx          # Input customizado

/types/
  └── user.ts                   # Modelos de dados

/utils/
  └── validationSchemas.ts      # Esquemas Yup

/contexts/
  └── AuthContext.tsx           # + funções de cadastro
```

### 🚀 **Próximos Passos**

1. **Implementar Etapas 2 e 3** do cadastro
2. **Conectar com API real** (Firebase/Backend)
3. **Adicionar verificação de email** 
4. **Implementar recuperação de senha**
5. **Adicionar login com email/senha**
6. **Implementar perfil completo**

O sistema está **funcional e pronto** para uso! 🎉 

A base está sólida para expansão com mais etapas e funcionalidades.