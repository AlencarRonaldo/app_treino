# TreinosApp Backend

API completa para o aplicativo de fitness brasileiro TreinosApp, construída com Node.js, TypeScript, Express e Prisma.

## 🚀 Recursos Implementados

### ✅ Autenticação Completa
- Registro e login de usuários
- Autenticação Google OAuth
- Refresh tokens
- Recuperação de senha
- Verificação de email
- Middleware de autenticação JWT

### ✅ Gerenciamento de Usuários
- Perfis completos (Aluno/Personal Trainer/Admin)
- Dashboard personalizado
- Estatísticas detalhadas
- Sistema de Personal Trainer ↔ Aluno
- Convites por email

### ✅ Sistema de Treinos
- CRUD completo de treinos
- Templates públicos
- Duplicação de treinos
- Compartilhamento entre usuários
- Execução com logs detalhados
- Estatísticas por treino

### ✅ Biblioteca de Exercícios
- +20 exercícios brasileiros populares
- Categorização por grupo muscular
- Instruções detalhadas em português
- Níveis de dificuldade
- Equipamentos necessários

### ✅ Sistema de Progresso
- Múltiplos tipos de medição
- Gráficos de evolução
- Recordes pessoais
- Análise de tendências

### ✅ Infraestrutura Robusta
- Validação abrangente com Joi
- Error handling profissional
- Rate limiting
- Logs estruturados
- Tipos TypeScript completos
- Seed com dados brasileiros

## 🛠️ Tecnologias

- **Backend**: Node.js 18+, TypeScript, Express
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT + Google OAuth
- **Validação**: Joi
- **Email**: Nodemailer
- **Upload**: Multer + Sharp
- **Testes**: Jest + Supertest

## 📋 Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 12 ou superior
- Conta Google (para OAuth - opcional)
- Conta SMTP (para emails - opcional)

## ⚙️ Configuração

### 1. Clonar e Instalar Dependências

```bash
cd treinosapp-backend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/treinosapp_dev"

# JWT
JWT_SECRET="seu-jwt-secret-super-seguro-com-pelo-menos-32-caracteres"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email SMTP (opcional)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular com dados iniciais
npm run db:seed
```

### 4. Executar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 🧪 Testes

### Teste Automático
```bash
node test-backend.js
```

### Usuários de Teste (após seed)
- **Admin**: admin@treinosapp.com (senha: 123456)
- **Personal**: personal@treinosapp.com (senha: 123456)  
- **Aluno**: aluno@treinosapp.com (senha: 123456)

### Endpoints Principais

#### Autenticação
- `POST /api/v1/auth/register` - Registrar usuário
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/google` - Login Google
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Logout

#### Usuários
- `GET /api/v1/users/profile` - Perfil do usuário
- `PUT /api/v1/users/profile` - Atualizar perfil
- `GET /api/v1/users/dashboard` - Dashboard
- `GET /api/v1/users/stats` - Estatísticas

#### Treinos
- `GET /api/v1/workouts` - Listar treinos
- `GET /api/v1/workouts/templates` - Templates públicos
- `POST /api/v1/workouts` - Criar treino
- `PUT /api/v1/workouts/:id` - Atualizar treino
- `DELETE /api/v1/workouts/:id` - Deletar treino
- `POST /api/v1/workouts/:id/start` - Iniciar execução
- `POST /api/v1/workouts/:id/complete` - Completar execução

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações
├── controllers/     # Controladores das rotas
├── database/        # Seeds e configurações DB
├── middleware/      # Middlewares personalizados
├── routes/          # Definições de rotas
├── services/        # Lógica de negócio
├── types/           # Tipos TypeScript
├── utils/           # Utilitários
└── server.ts        # Servidor principal

prisma/
├── schema.prisma    # Schema do banco
└── migrations/      # Migrations do Prisma
```

## 🔐 Segurança

- Autenticação JWT com refresh tokens
- Rate limiting (100 req/15min por IP)
- Validação rigorosa de entrada
- Headers de segurança (Helmet)
- Sanitização de dados
- Criptografia de senhas (bcrypt)

## 📊 Monitoramento

- Logs estruturados com Winston
- Health check endpoint (`/health`)
- Métricas de API (`/api`)
- Error tracking abrangente

## 🌍 Internacionalização

- Interface em português brasileiro
- Exercícios com nomes brasileiros
- Mensagens de erro em português
- Cultura fitness brasileira

## 🚀 Próximos Passos

### Recursos Pendentes
- [ ] Rotas de exercícios (browse, search, custom)
- [ ] Rotas de progresso (tracking, analytics)
- [ ] Integração com IA (geração de treinos)
- [ ] Sistema de notificações
- [ ] Upload de imagens/vídeos
- [ ] API de pagamentos

### Melhorias
- [ ] Cache com Redis
- [ ] WebSocket para tempo real
- [ ] Testes unitários completos
- [ ] Documentação Swagger
- [ ] Deployment automatizado

## 🤝 Contribuição

1. Fork do projeto
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das mudanças (`git commit -m 'Adicionar nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 💬 Suporte

Para dúvidas ou suporte:
- Email: suporte@treinosapp.com
- Issues: GitHub Issues
- Docs: Consulte este README

---

**TreinosApp** - Seu aplicativo de fitness brasileiro 🇧🇷 💪