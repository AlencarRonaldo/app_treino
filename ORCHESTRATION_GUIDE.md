# 🎼 TreinosApp - Guia de Orquestração

Sistema de desenvolvimento coordenado com Context7, Task Master e Claude Flow.

## 🚀 Inicialização Rápida

```bash
# 1. Execute o script de inicialização
./orchestrate.bat

# 2. No Claude Code, use comandos de orquestração
/orchestrate priority_1    # Sistema de autenticação
/orchestrate priority_2    # Integração ExerciseDB
/orchestrate all          # Desenvolvimento completo
```

## 🎯 Prioridades de Desenvolvimento

### **Priority 1: Authentication System** ⚡ CRÍTICO
- **Agent**: Backend Specialist
- **Context7**: JWT patterns, Express middleware, bcrypt best practices
- **Status**: IN-PROGRESS
- **Dependências**: Nenhuma
- **Próximo**: Finalizar Task 2.1 (Backend JWT setup)

### **Priority 2: ExerciseDB Integration** 🏋️ ALTO
- **Agent**: API Integration Specialist  
- **Context7**: RapidAPI patterns, caching strategies, video players
- **Status**: PENDING
- **Dependências**: Priority 1 completa
- **Features**: 5000+ exercícios + vídeos personalizados

### **Priority 3: Workout Management** 📋 ALTO
- **Agent**: Frontend Specialist
- **Context7**: React Navigation, Context API, form validation
- **Status**: PENDING
- **Dependências**: Priority 1 completa

## 🤖 Agentes Especializados

### **Architect** 🏗️
- **Focus**: System design, API architecture, ExerciseDB integration
- **Context7 Libraries**: react-native, expo, typescript, node.js, express
- **Auto-Flags**: `--c7 --ultrathink --seq`

### **Backend** 🔧  
- **Focus**: Node.js, Express, JWT authentication, RapidAPI integration
- **Context7 Libraries**: express, prisma, jwt, bcrypt, axios
- **Auto-Flags**: `--c7 --think --validate`

### **Frontend** 🎨
- **Focus**: React Native, UI components, Navigation, Video players
- **Context7 Libraries**: react-native, expo, react-navigation, react-native-paper
- **Auto-Flags**: `--c7 --magic --uc`

### **API Integrator** 🔗
- **Focus**: ExerciseDB API, RapidAPI, custom video services, cache management
- **Context7 Libraries**: axios, react-native-video, async-storage
- **Auto-Flags**: `--c7 --seq --validate`

### **Database** 🗄️
- **Focus**: AsyncStorage, PostgreSQL, data sync, cache optimization  
- **Context7 Libraries**: prisma, async-storage, postgresql
- **Auto-Flags**: `--c7 --think --validate`

## 📊 Context7 Integration

### **Consultas Automáticas por Task**

#### **Authentication**
- `jwt authentication node.js`
- `express middleware authentication`  
- `bcrypt password hashing`
- `refresh token strategies`

#### **ExerciseDB Integration**
- `rapidapi integration react-native`
- `axios caching strategies`
- `react-native-video implementation`
- `async storage best practices`

#### **Workout Management**  
- `react-native context api patterns`
- `react-navigation best practices`
- `form validation react-native`

#### **Exercise Library**
- `prisma schema design`
- `postgresql optimization`
- `full-text search implementation`

## 🔄 Task Master Sync

### **Status Automático**
- ✅ **Task 1**: Login Screen Fix - DONE
- 🔄 **Task 2**: Authentication System - IN-PROGRESS  
- ⏳ **Task 5**: ExerciseDB Integration - PENDING
- ⏳ **Tasks 3-11**: Aguardando dependencies

### **Comandos Task Master**
```bash
npx task-master-ai next           # Próxima task disponível
npx task-master-ai show 2.1       # Detalhes Task 2.1
npx task-master-ai set-status --id=2.1 --status=done
```

## ⚡ Flags Automáticos

### **Por Contexto**
- **API Integration**: `--c7 --seq --validate`
- **React Native**: `--c7 --magic --uc` 
- **Backend**: `--c7 --think --validate`
- **Database**: `--c7 --think-hard --validate`
- **Complex Problems**: `--ultrathink --seq --delegate`

### **Por Operação**
- **CRUD Implementation**: `--c7 --loop --validate`
- **Performance Issues**: `--persona-performance --think-hard`
- **Security Tasks**: `--persona-security --validate --safe-mode`
- **Large Refactoring**: `--delegate --wave-mode --systematic-waves`

## 🎪 Workflow Orchestration

### **Dependency Management**
- Automático baseado em `claude-flow-config.json`
- Tasks desbloqueadas automaticamente
- Notificações de dependency conflicts

### **Quality Gates**  
1. **Lint**: ESLint + Prettier
2. **Test**: Jest + React Native Testing Library
3. **Build**: Expo build success
4. **Deploy**: Production deployment validation

### **Progress Monitoring**
- Status updates a cada 5 minutos
- Progress reports diários
- Error notifications imediatas
- Completion alerts habilitados

## 📱 ExerciseDB API Integration

### **Configuração RapidAPI**
```javascript
API_KEY: "dc7c70f7d5mshb16650ffa6549b7p1394c2jsn0ed454eedbda"
BASE_URL: "https://exercisedb.p.rapidapi.com"
CACHE_STRATEGY: "aggressive"
FALLBACK_ENABLED: true
```

### **Features Implementadas**
- ✅ **5000+ exercícios** profissionais
- ✅ **Vídeos personalizados** dos trainers
- ✅ **Cache inteligente** 24h duration
- ✅ **Busca offline** com fallback
- ✅ **Player híbrido** GIF + MP4

## 🔧 Comandos Essenciais

### **Orquestração**
```bash
/orchestrate priority_1    # Autenticação
/orchestrate priority_2    # ExerciseDB
/orchestrate all          # Desenvolvimento completo
```

### **Task Master**
```bash
npx task-master-ai next               # Próxima task
npx task-master-ai show <id>          # Ver detalhes
npx task-master-ai set-status <id>    # Atualizar status
```

### **Context7**
- Ativação automática por contexto
- Consultas inteligentes baseadas na task
- Cache de 24h para documentações

### **Claude Flow**
- Modo "orchestrated-hive-mind"
- Parallel execution habilitado
- Quality gates automáticos

---

## 🎯 **Próximos Passos**

1. **Execute**: `./orchestrate.bat`
2. **Configure**: API keys no .env
3. **Inicie**: `/orchestrate priority_1`
4. **Monitore**: Progress automático
5. **Valide**: Quality gates ativados

O sistema está configurado para desenvolvimento **autônomo e inteligente** com **Context7**, **Task Master** e **Claude Flow** trabalhando em **perfeita sintonia**! 🎼✨