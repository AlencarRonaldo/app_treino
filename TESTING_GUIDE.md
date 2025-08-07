# 🧪 Guia de Testes - TreinosApp Backend + Mobile Integration

**Data:** 05 de Janeiro de 2025  
**Versão:** 1.0.0  
**Status:** Pronto para testes  

---

## 📋 **Pré-requisitos**

### **Softwares Necessários:**
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Expo CLI: `npm install -g @expo/cli`
- [ ] Postman ou Insomnia (para testes de API)

### **Configuração do Ambiente:**
1. **PostgreSQL Database:**
   ```sql
   CREATE DATABASE treinosapp_dev;
   CREATE USER treinosapp WITH PASSWORD 'password123';
   GRANT ALL PRIVILEGES ON DATABASE treinosapp_dev TO treinosapp;
   ```

2. **Variáveis de Ambiente (.env):**
   ```bash
   cd treinosapp-backend
   cp .env.example .env
   # Editar .env com suas configurações
   ```

---

## 🚀 **TESTE 1: Backend Setup**

### **1.1 Instalar Dependências**
```bash
cd D:\treinosapp\treinosapp-backend
npm install
```

### **1.2 Configurar Database**
```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular com dados brasileiros
npm run db:seed
```

### **1.3 Iniciar Backend**
```bash
npm run dev
```

**✅ Resultado Esperado:**
```
🚀 TreinosApp API rodando na porta 3001
🌍 Environment: development
📍 Health check: http://localhost:3001/health
📚 API info: http://localhost:3001/api
🎯 API Base URL: http://localhost:3001/api/v1
```

### **1.4 Testar Health Check**
```bash
curl http://localhost:3001/health
```

**✅ Resultado Esperado:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-05T22:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 🔐 **TESTE 2: Autenticação API**

### **2.1 Registrar Novo Usuário**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "senha": "123456",
    "altura": 180,
    "peso": 75,
    "objetivo": "ganho_massa",
    "nivel": "intermediario",
    "tipo": "student"
  }'
```

**✅ Resultado Esperado:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "nome": "João Silva",
      "email": "joao@teste.com",
      "tipo": "student"
    },
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

### **2.2 Login**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "senha": "123456"
  }'
```

### **2.3 Testar Rota Protegida**
```bash
curl -X GET http://localhost:3001/api/v1/users/profile \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

---

## 📱 **TESTE 3: Mobile App**

### **3.1 Instalar Dependências Mobile**
```bash
cd D:\treinosapp\treinosapp-mobile
npm install
```

### **3.2 Configurar Ambiente Mobile**
Criar/editar `.env`:
```bash
API_BASE_URL=http://localhost:3001/api/v1
ENVIRONMENT=development
```

### **3.3 Iniciar App Mobile**
```bash
npx expo start --web --port 8091 --clear
```

**✅ Resultado Esperado:**
- App carrega sem erros
- Tela de login/cadastro aparece
- Console não mostra erros de API

### **3.4 Testar Fluxo Completo no App**

**A. Cadastro:**
1. Abrir app mobile
2. Ir para tela de cadastro
3. Preencher dados:
   - Nome: "Maria Santos"
   - Email: "maria@teste.com"
   - Senha: "123456"
   - Altura: 165
   - Peso: 60
   - Objetivo: "perda_peso"
   - Nível: "iniciante"
   - Tipo: "student"
4. Clicar em "Cadastrar"

**✅ Resultado Esperado:**
- Loading spinner aparece
- Cadastro realizado com sucesso
- App navega para tela principal
- Usuário logado automaticamente

**B. Login:**
1. Fazer logout
2. Tentar login com credenciais criadas
3. Verificar se app lembra do usuário

**C. Funcionalidades Offline:**
1. Desativar backend (Ctrl+C no terminal)
2. Tentar criar treino
3. Reativar backend
4. Verificar se dados sincronizam

---

## 🏋️ **TESTE 4: Funcionalidades Específicas**

### **4.1 Gerenciamento de Treinos**

**Via API (Postman/Insomnia):**
```bash
# Criar treino
curl -X POST http://localhost:3001/api/v1/workouts \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Treino A - Peito e Tríceps",
    "descricao": "Treino focado em peito e tríceps",
    "categoria": "abc",
    "duracaoMinutos": 60
  }'

# Listar treinos
curl -X GET http://localhost:3001/api/v1/workouts \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Via Mobile App:**
1. Navegar para "Meus Treinos"
2. Criar novo treino
3. Adicionar exercícios
4. Salvar treino
5. Executar treino
6. Marcar como concluído

### **4.2 Exercícios Brasileiros**
```bash
# Listar exercícios
curl -X GET http://localhost:3001/api/v1/exercises \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Verificar se aparecem:**
- Supino reto
- Agachamento livre
- Levantamento terra
- Rosca bíceps
- Desenvolvimento

### **4.3 Sincronização Offline**

**Teste Manual:**
1. Criar treino no app com backend online
2. Parar backend
3. Criar outro treino (deve ir para fila)
4. Reativar backend
5. Verificar se sincroniza automaticamente

---

## 🔍 **TESTE 5: Verificações de Qualidade**

### **5.1 Logs do Backend**
Verificar se logs aparecem corretamente:
```bash
tail -f logs/app.log
```

### **5.2 Database**
Verificar se dados estão sendo salvos:
```bash
npm run db:studio
```

### **5.3 Performance**
- Tempo de resposta da API < 200ms
- App mobile carrega < 3s
- Transições suaves entre telas

### **5.4 Tratamento de Erros**
1. Tentar login com credenciais inválidas
2. Tentar acessar rota sem token
3. Enviar dados inválidos
4. Verificar se mensagens estão em português

---

## 🐛 **DIAGNÓSTICO DE PROBLEMAS**

### **Backend Não Inicia:**
```bash
# Verificar logs
npm run dev 2>&1 | tee debug.log

# Verificar database
psql -U treinosapp -d treinosapp_dev -c "SELECT version();"
```

### **Mobile Não Conecta:**
1. Verificar se `API_BASE_URL` está correto
2. Verificar se backend está rodando na porta 3001
3. Verificar console do navegador/Expo

### **Erros de Autenticação:**
1. Verificar se JWT_SECRET está configurado
2. Verificar se token está sendo enviado no header
3. Verificar logs de autenticação

### **Problemas de Sincronização:**
1. Verificar network state no app
2. Verificar fila de sincronização no AsyncStorage
3. Verificar logs do SyncService

---

## ✅ **CHECKLIST DE SUCESSO**

### **Backend (API):**
- [ ] Health check retorna status OK
- [ ] Cadastro de usuário funciona
- [ ] Login retorna JWT token
- [ ] Rotas protegidas exigem autenticação
- [ ] CRUD de treinos funciona
- [ ] Exercícios brasileiros aparecem
- [ ] Logs são gerados corretamente
- [ ] Database é populado com seed

### **Mobile (App):**
- [ ] App inicia sem erros
- [ ] Tela de login/cadastro aparece
- [ ] Cadastro cria usuário no backend
- [ ] Login funciona com backend
- [ ] Treinos são salvos no servidor
- [ ] Funciona offline (AsyncStorage)
- [ ] Sincroniza quando volta online
- [ ] Tratamento de erros em português

### **Integração:**
- [ ] Dados criados no app aparecem na API
- [ ] Dados da API aparecem no app
- [ ] Token refresh funciona automaticamente
- [ ] Offline/online transitions são suaves
- [ ] Performance está aceitável (<3s loading)

---

## 📞 **Se Precisar de Ajuda**

**Problemas Comuns:**

1. **"Cannot connect to backend"**
   - Verificar se backend está rodando
   - Verificar URL no .env do mobile

2. **"Database connection failed"**
   - Verificar PostgreSQL running
   - Verificar DATABASE_URL no .env

3. **"JWT token invalid"**
   - Verificar JWT_SECRET configurado
   - Tentar fazer novo login

4. **"Prisma generate failed"**
   - Executar: `npm run db:generate`
   - Verificar schema.prisma

**Para Debug Avançado:**
- Ativar logs detalhados: `LOG_LEVEL=debug`
- Usar Prisma Studio: `npm run db:studio`
- Verificar network tab no browser
- Usar React Native Debugger

---

**Boa sorte com os testes! 🚀**  
*Guia criado em 05/01/2025 - TreinosApp Team*