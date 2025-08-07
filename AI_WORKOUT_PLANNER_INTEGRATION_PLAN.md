# 🤖 Plano de Integração: AI Workout Planner API

**Data:** 05 de Janeiro de 2025  
**Projeto:** TreinosApp - Integração com IA  
**API:** AI Workout Planner | Exercise | Fitness | Nutrition Guide  
**Fornecedor:** RapidAPI (ltdbilgisam)  

---

## 📋 **Visão Geral do Projeto**

### **Objetivo Principal**
Integrar IA avançada ao TreinosApp para geração automática de treinos personalizados, transformando um app de tracking em uma plataforma inteligente de fitness.

### **Escopo da Integração**
- Geração automática de treinos com IA
- Personalização baseada no perfil do usuário brasileiro
- Sistema híbrido: dados locais + inteligência artificial
- Feature premium para monetização

---

## 🏗️ **Arquitetura de Integração**

### **1. Estrutura de Dados Expandida**

```typescript
// Novos tipos para integração com IA
interface AIWorkoutRequest {
  userId: string;
  fitnessLevel: 'iniciante' | 'intermediario' | 'avancado';
  objective: 'ganho_massa' | 'perda_peso' | 'resistencia' | 'forca';
  availableTime: number; // minutos
  equipment: 'academia' | 'casa' | 'peso_corporal';
  restrictions?: string[]; // lesões, limitações
  preferences?: string[]; // tipos de exercício preferidos
}

interface AIWorkoutResponse {
  id: string;
  name: string;
  duration: number;
  difficulty: number;
  exercises: AIExercise[];
  nutritionTips?: string[];
  restDays: number;
}

interface AIExercise {
  name: string;
  namePortuguese: string; // tradução automática
  category: string;
  muscleGroups: string[];
  sets: number;
  reps: string; // pode ser "8-12" ou "30 segundos"
  restTime: number;
  instructions: string;
  instructionsPortuguese: string;
  difficulty: number;
  equipment: string;
  alternatives?: string[]; // exercícios alternativos
}
```

### **2. Nova Camada de Serviços**

```typescript
// services/AIWorkoutService.ts
export class AIWorkoutService {
  private static readonly API_BASE = 'https://ai-workout-planner.p.rapidapi.com';
  private static readonly API_KEY = process.env.RAPIDAPI_KEY;

  static async generateWorkout(request: AIWorkoutRequest): Promise<AIWorkoutResponse> {
    // Implementação da chamada à API
  }

  static async translateToPortuguese(text: string): Promise<string> {
    // Tradução automática para português brasileiro
  }

  static async adaptToBrazilianContext(workout: AIWorkoutResponse): Promise<Treino> {
    // Adapta resposta da IA para formato brasileiro
  }
}
```

### **3. Sistema de Cache Inteligente**

```typescript
// services/AICache.ts
export class AICacheService extends CacheService {
  private static readonly AI_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

  // Cache específico para planos de IA
  static async cacheAIWorkout(userId: string, workout: AIWorkoutResponse): Promise<void> {
    const key = `ai_workout_${userId}_${Date.now()}`;
    await this.set(key, workout, this.AI_CACHE_DURATION);
  }

  // Recuperar planos em cache para uso offline
  static async getCachedWorkouts(userId: string): Promise<AIWorkoutResponse[]> {
    // Implementação
  }
}
```

---

## 🚀 **Implementação em Fases**

### **FASE 1: Infraestrutura Base (Semana 1-2)**

**Objetivos:**
- Configurar integração com RapidAPI
- Criar serviços base de comunicação
- Implementar sistema de tradução

**Deliverables:**
- ✅ AIWorkoutService funcional
- ✅ Sistema de autenticação RapidAPI
- ✅ Tradução automática português/inglês
- ✅ Testes unitários dos serviços

**Código de Exemplo:**
```typescript
// contexts/AIContext.tsx
export const AIContext = createContext<{
  generating: boolean;
  generateWorkout: (params: AIWorkoutRequest) => Promise<Treino>;
  lastGenerated?: Treino;
}>({
  generating: false,
  generateWorkout: async () => null as any,
});
```

### **FASE 2: Interface de Usuário (Semana 3)**

**Objetivos:**
- Criar telas de configuração de IA
- Interface para geração de treinos
- Preview e customização dos planos gerados

**Novas Telas:**
- `AIWorkoutGeneratorScreen.tsx`: Configuração de parâmetros
- `AIWorkoutPreviewScreen.tsx`: Preview do treino gerado
- `AISettingsScreen.tsx`: Configurações avançadas de IA

**Componentes:**
```typescript
// components/AIWorkoutGenerator.tsx
interface Props {
  onWorkoutGenerated: (workout: Treino) => void;
  userProfile: Usuario;
}

export function AIWorkoutGenerator({ onWorkoutGenerated, userProfile }: Props) {
  // Interface intuitiva para gerar treinos com IA
}
```

### **FASE 3: Integração com Sistema Existente (Semana 4)**

**Objetivos:**
- Integrar IA com sistema de treinos atual
- Permitir edição de treinos gerados por IA
- Sistema de feedback e aprendizado

**Funcionalidades:**
- Salvar treinos de IA no sistema local
- Permitir edição manual dos treinos gerados
- Sistema de rating para melhorar recomendações
- Histórico de treinos gerados por IA

### **FASE 4: Features Premium (Semana 5-6)**

**Objetivos:**
- Implementar sistema de monetização
- Features avançadas de IA
- Analytics e relatórios personalizados

**Features Premium:**
- Geração ilimitada de treinos
- Planos nutricionais com IA
- Adaptação automática baseada em progresso
- Relatórios avançados de performance

---

## 💰 **Modelo de Monetização**

### **Freemium Strategy**

**Plano Gratuito:**
- 3 treinos gerados por mês
- Templates básicos de IA
- Exercícios padrão

**Plano Premium (R$ 19,90/mês):**
- Treinos ilimitados com IA
- Personalização avançada
- Planos nutricionais
- Adaptação automática

**Plano Personal Trainer (R$ 39,90/mês):**
- Todas as features premium
- Gerenciamento de múltiplos alunos
- Analytics avançados
- API de terceiros

---

## 🔧 **Implementação Técnica Detalhada**

### **1. Configuração RapidAPI**

```typescript
// config/rapidapi.ts
export const RAPIDAPI_CONFIG = {
  baseURL: 'https://ai-workout-planner.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
    'X-RapidAPI-Host': 'ai-workout-planner.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 segundos
};
```

### **2. Service de Integração**

```typescript
// services/AIWorkoutService.ts
export class AIWorkoutService {
  static async generateWorkout(params: AIWorkoutRequest): Promise<Treino> {
    try {
      // 1. Preparar parâmetros para API
      const apiParams = this.mapToAPIFormat(params);
      
      // 2. Chamar API
      const response = await fetch(`${RAPIDAPI_CONFIG.baseURL}/generate-workout`, {
        method: 'POST',
        headers: RAPIDAPI_CONFIG.headers,
        body: JSON.stringify(apiParams)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const aiWorkout = await response.json();

      // 3. Traduzir para português
      const translatedWorkout = await this.translateWorkout(aiWorkout);

      // 4. Converter para formato TreinosApp
      const treinoApp = await this.convertToTreinosAppFormat(translatedWorkout, params);

      // 5. Salvar no cache
      await AICacheService.cacheAIWorkout(params.userId, treinoApp);

      return treinoApp;

    } catch (error) {
      console.error('Erro ao gerar treino com IA:', error);
      
      // Fallback: gerar treino básico local
      return this.generateFallbackWorkout(params);
    }
  }

  private static mapToAPIFormat(params: AIWorkoutRequest): any {
    return {
      fitness_level: params.fitnessLevel,
      goal: params.objective,
      duration_minutes: params.availableTime,
      equipment_available: params.equipment,
      restrictions: params.restrictions?.join(',') || '',
      preferences: params.preferences?.join(',') || ''
    };
  }

  private static async translateWorkout(workout: any): Promise<any> {
    // Implementar tradução usando serviço de tradução
    // Pode usar Google Translate API ou similar
    return workout;
  }

  private static async convertToTreinosAppFormat(aiWorkout: any, params: AIWorkoutRequest): Promise<Treino> {
    const treino: Treino = {
      id: `ai-${Date.now()}`,
      usuarioId: params.userId,
      nome: aiWorkout.name || 'Treino Gerado por IA',
      descricao: 'Treino personalizado gerado por inteligência artificial',
      categoria: 'personalizado',
      data: new Date().toISOString(),
      duracaoMinutos: aiWorkout.duration || params.availableTime,
      observacoes: `Gerado por IA - Nível: ${params.fitnessLevel}`,
      concluido: false,
      sincronizado: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    return treino;
  }

  private static generateFallbackWorkout(params: AIWorkoutRequest): Treino {
    // Gerar treino básico local em caso de falha da API
    return {
      id: `fallback-${Date.now()}`,
      usuarioId: params.userId,
      nome: 'Treino Básico',
      descricao: 'Treino gerado localmente (modo offline)',
      categoria: 'personalizado',
      data: new Date().toISOString(),
      duracaoMinutos: params.availableTime,
      observacoes: 'Treino básico - API indisponível',
      concluido: false,
      sincronizado: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
  }
}
```

### **3. Context para IA**

```typescript
// contexts/AIContext.tsx
interface AIContextType {
  // Estado
  generating: boolean;
  lastGenerated?: Treino;
  quotaUsed: number;
  quotaLimit: number;
  isPremium: boolean;

  // Ações
  generateWorkout: (params: AIWorkoutRequest) => Promise<Treino>;
  regenerateWorkout: (workoutId: string) => Promise<Treino>;
  rateWorkout: (workoutId: string, rating: number) => Promise<void>;
  checkQuota: () => Promise<void>;
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Treino>();
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(3); // Free tier
  const [isPremium, setIsPremium] = useState(false);

  const generateWorkout = async (params: AIWorkoutRequest): Promise<Treino> => {
    // Verificar quota
    if (!isPremium && quotaUsed >= quotaLimit) {
      throw new Error('Limite de treinos gratuitos atingido. Faça upgrade para Premium!');
    }

    setGenerating(true);
    
    try {
      const workout = await AIWorkoutService.generateWorkout(params);
      setLastGenerated(workout);
      
      if (!isPremium) {
        setQuotaUsed(prev => prev + 1);
      }
      
      return workout;
    } finally {
      setGenerating(false);
    }
  };

  const value: AIContextType = {
    generating,
    lastGenerated,
    quotaUsed,
    quotaLimit,
    isPremium,
    generateWorkout,
    regenerateWorkout: async (id) => { /* implementar */ return {} as Treino; },
    rateWorkout: async (id, rating) => { /* implementar */ },
    checkQuota: async () => { /* implementar */ }
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}
```

### **4. Tela de Geração de Treinos**

```typescript
// screens/AIWorkoutGeneratorScreen.tsx
export default function AIWorkoutGeneratorScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { generateWorkout, generating, quotaUsed, quotaLimit, isPremium } = useAI();
  
  const [params, setParams] = useState<AIWorkoutRequest>({
    userId: user?.id!,
    fitnessLevel: 'intermediario',
    objective: 'ganho_massa',
    availableTime: 60,
    equipment: 'academia',
    restrictions: [],
    preferences: []
  });

  const handleGenerate = async () => {
    try {
      const workout = await generateWorkout(params);
      
      // Navegar para preview do treino
      navigation.navigate('AIWorkoutPreview', { workout });
      
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <FigmaScreen title="Gerar Treino com IA" showBack>
      <ScrollView style={styles.container}>
        
        {/* Quota Display */}
        {!isPremium && (
          <Card style={styles.quotaCard}>
            <Card.Content>
              <Text variant="titleMedium">Treinos Gratuitos</Text>
              <Text variant="bodyMedium">
                {quotaUsed}/{quotaLimit} utilizados este mês
              </Text>
              <ProgressBar 
                progress={quotaUsed / quotaLimit} 
                color={FigmaTheme.colors.primary}
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
        )}

        {/* Configurações */}
        <Card style={styles.configCard}>
          <Card.Title title="Configurações do Treino" />
          <Card.Content>
            
            {/* Nível de Fitness */}
            <Text variant="labelLarge" style={styles.label}>Nível de Fitness</Text>
            <SegmentedButtons
              value={params.fitnessLevel}
              onValueChange={(value) => setParams(prev => ({ ...prev, fitnessLevel: value as any }))}
              buttons={[
                { value: 'iniciante', label: 'Iniciante' },
                { value: 'intermediario', label: 'Intermediário' },
                { value: 'avancado', label: 'Avançado' }
              ]}
              style={styles.segmented}
            />

            {/* Objetivo */}
            <Text variant="labelLarge" style={styles.label}>Objetivo Principal</Text>
            <SegmentedButtons
              value={params.objective}
              onValueChange={(value) => setParams(prev => ({ ...prev, objective: value as any }))}
              buttons={[
                { value: 'ganho_massa', label: 'Ganho de Massa' },
                { value: 'perda_peso', label: 'Perda de Peso' },
                { value: 'resistencia', label: 'Resistência' },
                { value: 'forca', label: 'Força' }
              ]}
              style={styles.segmented}
            />

            {/* Tempo Disponível */}
            <Text variant="labelLarge" style={styles.label}>
              Tempo Disponível: {params.availableTime} minutos
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={15}
              maximumValue={120}
              step={15}
              value={params.availableTime}
              onValueChange={(value) => setParams(prev => ({ ...prev, availableTime: value }))}
              minimumTrackTintColor={FigmaTheme.colors.primary}
              maximumTrackTintColor={FigmaTheme.colors.surfaceVariant}
              thumbTintColor={FigmaTheme.colors.primary}
            />

            {/* Equipamentos */}
            <Text variant="labelLarge" style={styles.label}>Equipamentos Disponíveis</Text>
            <SegmentedButtons
              value={params.equipment}
              onValueChange={(value) => setParams(prev => ({ ...prev, equipment: value as any }))}
              buttons={[
                { value: 'academia', label: 'Academia' },
                { value: 'casa', label: 'Casa' },
                { value: 'peso_corporal', label: 'Peso Corporal' }
              ]}
              style={styles.segmented}
            />

          </Card.Content>
        </Card>

        {/* Botão Gerar */}
        <FitnessButton
          mode="contained"
          onPress={handleGenerate}
          loading={generating}
          disabled={generating || (!isPremium && quotaUsed >= quotaLimit)}
          style={styles.generateButton}
        >
          {generating ? 'Gerando Treino...' : 'Gerar Treino com IA'}
        </FitnessButton>

        {/* Upgrade para Premium */}
        {!isPremium && quotaUsed >= quotaLimit && (
          <Card style={styles.upgradeCard}>
            <Card.Content>
              <Text variant="titleMedium">Limite Atingido</Text>
              <Text variant="bodyMedium" style={styles.upgradeText}>
                Você atingiu o limite de treinos gratuitos. 
                Faça upgrade para Premium e tenha treinos ilimitados!
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Premium')}
                style={styles.upgradeButton}
              >
                Fazer Upgrade
              </Button>
            </Card.Content>
          </Card>
        )}

      </ScrollView>
    </FigmaScreen>
  );
}
```

---

## 📊 **Métricas e Analytics**

### **KPIs de Sucesso**
- **Engagement**: % usuários que usam IA vs treinos manuais
- **Satisfação**: Rating médio dos treinos gerados
- **Conversão**: % usuários free que fazem upgrade
- **Retenção**: % usuários que continuam usando após primeiro treino IA

### **Analytics para Implementar**
```typescript
// analytics/AIAnalytics.ts
export class AIAnalrytis {
  static trackWorkoutGenerated(params: AIWorkoutRequest) {
    // Track geração de treino
  }
  
  static trackWorkoutCompleted(workoutId: string, rating: number) {
    // Track conclusão e rating
  }
  
  static trackUpgrade(userId: string, plan: string) {
    // Track conversão para premium
  }
}
```

---

## 🔐 **Segurança e Privacidade**

### **Proteção de Dados**
- Não enviar dados pessoais sensíveis para API externa
- Criptografar dados em cache local
- Implementar rate limiting para evitar abuso
- Logs de auditoria para uso da API

### **Fallback Strategy**
- Sistema offline para quando API estiver indisponível
- Cache inteligente de treinos gerados
- Geração local básica como backup

---

## 💰 **Análise de Custos**

### **Estimativa de Custos RapidAPI**
- **Free Tier**: 100 requests/mês (estimativa)
- **Paid Tier**: $0.001-0.01 por request (estimativa)
- **Monthly Budget**: $200-500/mês para base de usuários média

### **ROI Projetado**
- **Premium Conversions**: 15% dos usuários que testam IA
- **Revenue/Month**: R$ 19.90 × conversões
- **Break-even**: ~100 usuários premium/mês

---

## 🚀 **Roadmap de Lançamento**

### **Sprint 1 (Semanas 1-2): Foundation**
- ✅ Setup RapidAPI integration
- ✅ Basic AI service implementation
- ✅ Translation system
- ✅ Error handling and fallbacks

### **Sprint 2 (Semana 3): UI/UX**
- ✅ AI Generator screen
- ✅ Preview screen
- ✅ Settings integration
- ✅ User feedback system

### **Sprint 3 (Semana 4): Integration**
- ✅ Merge with existing workout system
- ✅ Cache and offline support
- ✅ Performance optimization
- ✅ Testing and QA

### **Sprint 4 (Semanas 5-6): Premium Features**
- ✅ Monetization system
- ✅ Advanced AI features
- ✅ Analytics dashboard
- ✅ Launch preparation

### **Sprint 5 (Semana 7): Launch**
- ✅ Beta testing with select users
- ✅ Performance monitoring
- ✅ Bug fixes and optimizations
- ✅ Public launch

---

## 📚 **Documentação Adicional**

### **Arquivos a Criar:**
1. `docs/AI_INTEGRATION_TECHNICAL_SPECS.md`
2. `docs/AI_API_REFERENCE.md`
3. `docs/AI_TESTING_STRATEGY.md`
4. `docs/AI_DEPLOYMENT_GUIDE.md`

### **Testes Necessários:**
- Unit tests para AIWorkoutService
- Integration tests com RapidAPI
- E2E tests para fluxo completo
- Performance tests para cache
- Security tests para API keys

---

## 🎯 **Conclusão**

Esta integração transformará o TreinosApp de um simples tracker em uma plataforma inteligente de fitness, oferecendo:

- **Diferencial Competitivo**: IA personalizada para mercado brasileiro
- **Monetização**: Modelo freemium bem estruturado
- **Escalabilidade**: Sistema que cresce com a base de usuários
- **User Experience**: Treinos sempre novos e personalizados

**Próximo Passo**: Aprovar orçamento e iniciar Sprint 1 da implementação.

---

*Documento criado em 05/01/2025 - TreinosApp Development Team*