# 🚀 Quick Start - TreinosApp Tests

## ⚡ Setup Rápido (5 minutos)

### 1. **PostgreSQL (1-2 min)**

**Windows (mais fácil - usar Docker):**
```bash
# Instalar Docker Desktop primeiro
docker run --name postgres-treinosapp -e POSTGRES_PASSWORD=password -e POSTGRES_DB=treinosapp_dev -p 5432:5432 -d postgres:13
```

**Ou instalar PostgreSQL nativo:**
- Download: https://www.postgresql.org/download/windows/
- Instalar com senha: `password`
- Criar database: `treinosapp_dev`

### 2. **Backend Setup (2 min)**
```bash
cd treinosapp-backend

# Já tem .env configurado!
# Instalar dependências (já feito)
# npm install

# Configurar database
npm run db:generate
npm run db:migrate  
npm run db:seed

# Iniciar backend
npm run dev
```

### 3. **Testar (30 seg)**
```bash
# Em outro terminal
cd ..
node test-integration.js
```

### 4. **Mobile App (1 min)**
```bash
cd treinosapp-mobile
npm install  # se não fez ainda
npx expo start --web --port 8091
```

---

## 🆘 Se PostgreSQL não funcionar:

**Opção mais fácil - SQLite:**
Editar `.env` no backend:
```bash
DATABASE_URL="file:./dev.db"
```

**Ou usar PostgreSQL online grátis:**
- Criar conta em: https://neon.tech/
- Copiar connection string
- Colar no `.env`

---

## ✅ Resultado Esperado:

1. ✅ Backend rodando na porta 3001
2. ✅ Tests passando 80%+
3. ✅ Mobile app carregando
4. ✅ Integração funcionando

**Próximo passo:** FASE 2 - AI Integration 🤖