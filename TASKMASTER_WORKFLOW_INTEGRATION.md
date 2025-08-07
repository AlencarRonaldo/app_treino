# 🎯 Task Master + MCP Context7 + Claude Flow - Workflow Integrado

## 📋 Visão Geral do Workflow Completo

Este documento define o workflow integrado para desenvolvimento do TreinosApp usando:
- **Task Master**: Gerenciamento e organização de tarefas
- **MCP Context7**: Documentação oficial e best practices
- **Claude Flow**: Análise sistemática e debugging
- **Validação**: Testes obrigatórios antes de prosseguir

## 🔄 Workflow de Desenvolvimento Integrado

### 1️⃣ **INÍCIO DA TAREFA**

```bash
# 1. Obter próxima tarefa
npx task-master next

# 2. Ver detalhes completos
npx task-master show <id>

# 3. Marcar como em progresso
npx task-master set-status --id=<id> --status=in-progress
```

### 2️⃣ **PESQUISA COM MCP CONTEXT7**

Antes de implementar, pesquisar documentação oficial:

```bash
# Via Claude Flow com Context7
--c7 --seq "Research React Native [feature] best practices"

# Exemplos específicos:
--c7 "React Navigation v6 authentication flow"
--c7 "AsyncStorage data persistence patterns"
--c7 "React Native Paper form validation"
```

**Quando usar Context7:**
- Implementação de bibliotecas específicas
- Padrões de arquitetura
- Best practices oficiais
- Configurações recomendadas

### 3️⃣ **ANÁLISE COM CLAUDE FLOW**

Usar flags do Claude Flow para análise profunda:

```bash
# Análise simples
--think "Como implementar [feature]"

# Análise complexa
--think-hard "Arquitetura para sistema de autenticação"

# Análise crítica
--ultrathink "Refatoração completa do sistema de state management"
```

**Flags úteis:**
- `--validate`: Validação automática antes de executar
- `--safe-mode`: Modo seguro para operações críticas
- `--uc`: Modo ultra comprimido para economizar tokens

### 4️⃣ **IMPLEMENTAÇÃO**

```javascript
// Estrutura padrão de implementação
// 1. Pesquisar com Context7
// 2. Analisar com Claude Flow
// 3. Implementar seguindo padrões
// 4. Validar com testes
```

### 5️⃣ **VALIDAÇÃO OBRIGATÓRIA**

**REGRA CRÍTICA**: Não prosseguir para próxima tarefa sem validação completa!

#### A. Testes Unitários
```bash
# Executar testes da feature
npm test -- --coverage --watchAll=false

# Verificar cobertura mínima (80%)
npm run test:coverage
```

#### B. Testes de Integração
```bash
# Testar integração com backend
node test-integration.js

# Testar app mobile
node test-mobile.js
```

#### C. Validação Visual (Web)
```bash
# Iniciar app e verificar
cd treinosapp-mobile
npx expo start --web --clear

# Executar teste Playwright
node playwright-diagnostic.js
```

#### D. Checklist de Validação
- [ ] Código compila sem erros
- [ ] Testes passando (mínimo 80% cobertura)
- [ ] Sem erros no console
- [ ] Feature funcionando conforme especificação
- [ ] Performance adequada (<3s load time)
- [ ] Acessibilidade verificada
- [ ] Documentação atualizada

### 6️⃣ **DOCUMENTAÇÃO DA IMPLEMENTAÇÃO**

```bash
# Atualizar subtask com notas de implementação
npx task-master update-subtask --id=<id> --prompt="
Implementado: [descrição do que foi feito]
Tecnologias: [libs/frameworks usados]
Desafios: [problemas encontrados]
Solução: [como foram resolvidos]
Testes: [cobertura e resultados]
"
```

### 7️⃣ **CONCLUSÃO DA TAREFA**

```bash
# Só marcar como completa após TODOS os testes passarem
npx task-master set-status --id=<id> --status=done

# Sincronizar com README
npx task-master sync-readme
```

## 🛠️ Comandos Integrados por Tipo de Tarefa

### 🔐 **Autenticação (Task 2)**

```bash
# 1. Pesquisar padrões
--c7 "JWT authentication React Native"
--c7 "AsyncStorage secure token storage"

# 2. Analisar arquitetura
--think-hard "Sistema de autenticação com refresh token"

# 3. Implementar
# - AuthContext.tsx
# - AuthApiService.ts
# - LoginScreen.tsx

# 4. Validar
npm test auth
node test-integration.js --auth
```

### 💪 **Workout Management (Task 3)**

```bash
# 1. Pesquisar
--c7 "React Native CRUD patterns"
--c7 "Context API state management"

# 2. Analisar
--think "Estrutura de dados para workouts"

# 3. Implementar
# - WorkoutContext.tsx
# - WorkoutApiService.ts
# - CreateWorkoutScreen.tsx

# 4. Validar
npm test workouts
```

### ⏱️ **Timer System (Task 5)**

```bash
# 1. Pesquisar
--c7 "React Native background timers"
--c7 "expo-notifications setup"

# 2. Analisar
--think-hard "Timer com notificações em background"

# 3. Implementar
# - TimerContext.tsx
# - WorkoutTimerScreen.tsx
# - NotificationService.ts

# 4. Validar
npm test timer
# Teste manual em dispositivo físico
```

## 📊 Quality Gates Obrigatórios

### **Gate 1: Código**
```javascript
// Checklist de código
✅ Sem any types no TypeScript
✅ Sem console.log em produção
✅ Tratamento de erros completo
✅ Loading states implementados
✅ Componentes memoizados quando necessário
```

### **Gate 2: Performance**
```javascript
// Métricas obrigatórias
✅ Bundle size < 50MB
✅ Load time < 3s
✅ Memory usage < 150MB
✅ 60fps animations
✅ Lighthouse score > 90
```

### **Gate 3: Testes**
```javascript
// Cobertura mínima
✅ Unit tests: 80%
✅ Integration tests: Critical paths
✅ E2E tests: User journeys
✅ Accessibility: WCAG 2.1 AA
```

## 🔄 Workflow de Debug com Claude Flow

Quando encontrar problemas:

```bash
# 1. Diagnóstico inicial
--think "Analyzing error: [error message]"

# 2. Pesquisa de solução
--c7 --seq "Solution for [specific error]"

# 3. Debug profundo
--ultrathink --validate "Root cause analysis"

# 4. Implementar fix
# ... código ...

# 5. Validar correção
npm test -- --testNamePattern="[test relacionado]"
```

## 📈 Métricas de Progresso

### **Dashboard de Tarefas**
```bash
# Ver progresso geral
npx task-master list

# Ver complexidade
npx task-master complexity-report

# Ver dependências
npx task-master validate-dependencies
```

### **Critérios de Sucesso por Sprint**
- Sprint 1 (Auth + Data): 100% testes, 0 bugs críticos
- Sprint 2 (Workouts): 80% cobertura, <3s load
- Sprint 3 (Timer + Progress): Funcional offline
- Sprint 4 (Polish): Lighthouse >90, Bundle <50MB

## 🚨 Regras Críticas

### **NUNCA:**
- ❌ Pular testes para "ganhar tempo"
- ❌ Marcar tarefa como done sem validação
- ❌ Implementar sem pesquisar documentação
- ❌ Ignorar erros no console
- ❌ Deixar TODO/FIXME no código

### **SEMPRE:**
- ✅ Testar em múltiplos dispositivos
- ✅ Validar offline functionality
- ✅ Documentar decisões técnicas
- ✅ Usar Context7 para libs externas
- ✅ Aplicar Claude Flow para análise

## 📝 Template de Implementação

```typescript
/**
 * Feature: [Nome da Feature]
 * Task ID: [Task Master ID]
 * 
 * Pesquisa Context7:
 * - [Link/referência documentação]
 * 
 * Análise Claude Flow:
 * - [Decisões arquiteturais]
 * 
 * Testes:
 * - Unit: [coverage %]
 * - Integration: [status]
 * - E2E: [status]
 */

// Implementação seguindo padrões validados
```

## 🎯 Fluxo de Comando Rápido

```bash
# Início do dia
npx task-master next
npx task-master show [id]

# Durante desenvolvimento
--c7 "[pesquisa]"           # Documentação
--think "[análise]"          # Análise
--validate                   # Validação

# Testes contínuos
npm test -- --watch
node test-integration.js

# Fim da tarefa
npx task-master update-subtask --id=[id] --prompt="[notas]"
npx task-master set-status --id=[id] --status=done

# Próxima tarefa (só após validação!)
npx task-master next
```

## 🔗 Integração com CI/CD

```yaml
# .github/workflows/taskmaster.yml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    steps:
      - name: Run Tests
        run: npm test -- --coverage
      
      - name: Check Task Status
        run: npx task-master show $TASK_ID
      
      - name: Validate Integration
        run: node test-integration.js
```

## 📊 KPIs do Projeto

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| Tarefas Completas | 10 | 1 | 🔄 |
| Cobertura de Testes | 80% | 0% | ❌ |
| Bundle Size | <50MB | TBD | ⏳ |
| Load Time | <3s | TBD | ⏳ |
| Bugs Críticos | 0 | 1 | 🔄 |

---

**LEMBRETE CRÍTICO**: 
🚨 **NÃO PROSSEGUIR** para próxima tarefa sem:
1. ✅ Todos os testes passando
2. ✅ Zero erros no console
3. ✅ Feature funcionando em produção
4. ✅ Documentação atualizada
5. ✅ Code review (self ou peer)

---

*Este workflow garante qualidade e velocidade sustentável no desenvolvimento do TreinosApp.*