# Product Requirements Document (PRD)
# FitPro - Plataforma de Gestão de Treinos

**Versão:** 1.0  
**Data:** Agosto 2025  
**Autor:** Product Team  
**Status:** Em Desenvolvimento  

---

## 📋 Sumário Executivo

### Visão do Produto
FitPro é uma plataforma SaaS que conecta personal trainers e academias aos seus alunos através de uma interface moderna e intuitiva, facilitando a criação, distribuição e acompanhamento de treinos personalizados.

### Problema
- Personal trainers usam WhatsApp/PDF para enviar treinos (experiência ruim)
- Academias não conseguem escalar atendimento personalizado
- Alunos perdem motivação por falta de acompanhamento adequado
- Ferramentas existentes (Mfit) têm UX desatualizada e limitações

### Solução
Progressive Web App que funciona perfeitamente em desktop e mobile, oferecendo:
- Criação intuitiva de treinos com drag & drop
- Interface moderna e atrativa para alunos
- Sistema de pagamentos integrado
- Analytics e relatórios de progresso
- White label para academias

### Métricas de Sucesso
- **6 meses:** 1000+ usuários ativos, $50k ARR
- **12 meses:** 5000+ usuários ativos, $250k ARR
- **18 meses:** Break-even, expansão para outros países

---

## 🎯 Objetivos e Metas

### Objetivos Primários
1. **Capturar 5% do mercado brasileiro** de personal trainers em 18 meses
2. **Gerar $250k ARR** até final de 2026
3. **Atingir NPS 70+** através de experiência superior

### Objetivos Secundários
1. Expandir para nutricionistas e fisioterapeutas
2. Criar marketplace de profissionais
3. Integrar com wearables e apps de saúde

### KPIs Principais
- **Aquisição:** CAC < $50, 200+ novos usuários/mês
- **Ativação:** 80% dos signups criam primeiro treino em 24h
- **Retenção:** 85% monthly retention após 3 meses
- **Receita:** $25 ARPU médio, churn < 5%/mês
- **Satisfação:** NPS > 50, support tickets < 2%

---

## 👥 Personas e Mercado

### Persona 1: Personal Trainer Independente
**Demografia:** 25-40 anos, ensino superior, renda R$ 3-8k/mês  
**Dores:**
- Perde tempo criando treinos no Word/Excel
- Dificuldade para acompanhar evolução dos alunos
- Aparência pouco profissional (WhatsApp/PDF)
- Falta de ferramentas para precificar adequadamente

**Jobs to be Done:**
- Criar treinos profissionais rapidamente
- Acompanhar progresso dos alunos automaticamente
- Ter uma marca/presença digital profissional
- Otimizar tempo para atender mais clientes

### Persona 2: Academia/Estúdio
**Demografia:** 30-50 anos, gestores/proprietários, 50-500 alunos  
**Dores:**
- Instrutores sobrecarregados com treinos genéricos
- Dificuldade para reter alunos
- Falta de dados sobre uso dos equipamentos
- Processos manuais para cobrança/gestão

**Jobs to be Done:**
- Escalar atendimento personalizado
- Aumentar retenção de alunos
- Ter controle sobre receita recorrente
- Profissionalizar operação com dados

### Persona 3: Aluno/Praticante
**Demografia:** 18-45 anos, classes B/C, busca resultados  
**Dores:**
- Treinos em papel que se perdem/rasgam
- Não sabe se está progredindo
- Falta de motivação para treinar
- Comunicação ruim com personal/academia

**Jobs to be Done:**
- Acessar treinos facilmente no celular
- Ver seu progresso visualmente
- Manter motivação para treinar
- Tirar dúvidas rapidamente com instrutor

### Tamanho de Mercado
- **TAM:** $2B (fitness global)
- **SAM:** $150M (Brasil, personal trainers + academias)
- **SOM:** $15M (5% market share em 5 anos)

---

## 🚀 Funcionalidades Detalhadas

### 📱 Core Features - MVP

#### 1. Sistema de Autenticação
**Descrição:** Login/signup seguro com verificação de email  
**User Stories:**
- Como usuário, quero criar conta com email/senha
- Como usuário, quero fazer login social (Google)
- Como usuário, quero recuperar senha via email
- Como admin, quero verificar identidade de personal trainers

**Critérios de Aceite:**
- [ ] Signup funciona em < 30 segundos
- [ ] Verificação de email obrigatória
- [ ] Login social opcional
- [ ] Reset de senha via email
- [ ] Proteção contra bots (reCAPTCHA)

#### 2. Criação de Treinos
**Descrição:** Interface drag & drop para montar treinos personalizados  
**User Stories:**
- Como personal, quero criar treinos rapidamente
- Como personal, quero usar templates prontos
- Como personal, quero adicionar exercícios com vídeo
- Como personal, quero configurar séries/reps/carga
- Como personal, quero duplicar treinos existentes

**Critérios de Aceite:**
- [ ] Biblioteca com 100+ exercícios catalogados
- [ ] Drag & drop funcional em desktop e mobile
- [ ] Templates de treino (iniciante, intermediário, avançado)
- [ ] Vídeos demonstrativos para cada exercício
- [ ] Configuração flexível (tempo, reps, carga, descanso)
- [ ] Duplicação de treinos com 1 clique

#### 3. Interface do Aluno
**Descrição:** App intuitivo para alunos visualizarem e seguirem treinos  
**User Stories:**
- Como aluno, quero ver meu treino do dia
- Como aluno, quero marcar exercícios como concluídos
- Como aluno, quero usar cronômetro integrado
- Como aluno, quero ver vídeos dos exercícios
- Como aluno, quero registrar peso/reps realizados

**Critérios de Aceite:**
- [ ] Interface limpa e fácil de usar
- [ ] Cronômetro com notificação sonora
- [ ] Checkboxes para marcar progresso
- [ ] Player de vídeo integrado
- [ ] Input rápido para registrar dados
- [ ] Histórico dos últimos treinos

#### 4. Dashboard do Personal
**Descrição:** Painel de controle com visão geral dos alunos  
**User Stories:**
- Como personal, quero ver todos meus alunos
- Como personal, quero acompanhar progresso de cada um
- Como personal, quero enviar treinos rapidamente
- Como personal, quero ver métricas de engajamento
- Como personal, quero gerenciar assinaturas

**Critérios de Aceite:**
- [ ] Lista de alunos com status (ativo/inativo)
- [ ] Última atividade de cada aluno
- [ ] Botão rápido para criar/enviar treino
- [ ] Gráficos básicos de engajamento
- [ ] Gestão de pagamentos e planos

### 💰 Features de Monetização

#### 5. Sistema de Planos
**Descrição:** Assinaturas recorrentes com diferentes níveis  

**Planos Personal Trainer:**
- **Starter ($29/mês):** Até 15 alunos, templates básicos
- **Professional ($59/mês):** Até 50 alunos, analytics, white label básico  
- **Expert ($99/mês):** Alunos ilimitados, API, suporte prioritário

**Planos Academia:**
- **Basic ($199/mês):** Até 200 alunos, 5 instrutores
- **Business ($399/mês):** Até 500 alunos, 15 instrutores, relatórios avançados
- **Enterprise ($799/mês):** Ilimitado, múltiplas unidades, gerente dedicado

**Critérios de Aceite:**
- [ ] Trial gratuito de 7 dias
- [ ] Upgrade/downgrade instantâneo
- [ ] Prorata automático
- [ ] Cancelamento self-service
- [ ] Recuperação de churn automática

#### 6. Gateway de Pagamentos
**Descrição:** Integração com múltiplos processadores de pagamento  
**Processadores:**
- Stripe (cartões internacionais)
- Mercado Pago (PIX, cartões Brasil)
- PayPal (backup internacional)

**Critérios de Aceite:**
- [ ] Checkout em < 2 cliques
- [ ] Suporte a PIX, cartão, boleto
- [ ] Retry automático para falhas
- [ ] Webhooks para status de pagamento
- [ ] Dashboard financeiro básico

### 📊 Features de Engagement

#### 7. Sistema de Chat
**Descrição:** Comunicação em tempo real entre personal e aluno  
**User Stories:**
- Como aluno, quero tirar dúvidas sobre exercícios
- Como personal, quero responder rapidamente
- Como ambos, quero receber notificações de mensagens
- Como personal, quero enviar motivação/lembretes

**Critérios de Aceite:**
- [ ] Chat em tempo real (WebSocket)
- [ ] Push notifications
- [ ] Envio de mídia (fotos/vídeos)
- [ ] Histórico de conversas
- [ ] Status online/offline

#### 8. Relatórios de Progresso
**Descrição:** Analytics visuais do progresso do aluno  
**Métricas Tracked:**
- Frequência de treinos
- Evolução de cargas
- Medidas corporais
- Fotos de progresso
- Tempo de treino

**Critérios de Aceite:**
- [ ] Gráficos interativos (Chart.js)
- [ ] Exportação em PDF
- [ ] Comparação temporal
- [ ] Metas e conquistas
- [ ] Sharing social opcional

### 🏢 Features Enterprise (Academias)

#### 9. Multi-usuários
**Descrição:** Gestão de múltiplos instrutores e permissões  
**Roles:**
- **Admin:** Acesso total
- **Instrutor:** Apenas seus alunos
- **Recepção:** Visualização e check-in
- **Financeiro:** Relatórios e cobrança

**Critérios de Aceite:**
- [ ] Convite por email para novos instrutores
- [ ] Permissões granulares por role
- [ ] Auditoria de ações
- [ ] Transferência de alunos entre instrutores

#### 10. White Label
**Descrição:** Customização da marca para academias  
**Customizações:**
- Logo da academia
- Cores da marca
- Domínio personalizado (opcional)
- Email templates customizados

**Critérios de Aceite:**
- [ ] Upload de logo (auto-resize)
- [ ] Color picker para tema
- [ ] Preview em tempo real
- [ ] Aplicação em toda plataforma

---

## 🎨 Design e UX

### Design System
**Cores Primárias:**
- Primary: #6366F1 (Indigo)
- Secondary: #8B5CF6 (Purple)  
- Success: #10B981 (Emerald)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

**Tipografia:**
- Headers: Inter Bold
- Body: Inter Regular
- Code: JetBrains Mono

**Componentes Base:**
- Buttons, Cards, Modals, Forms
- Data Tables, Charts, Navigation
- Mobile-first responsive design

### Fluxos Principais

#### Fluxo de Onboarding Personal
1. Signup → Verificação email
2. Questionário inicial (especialidade, experiência)
3. Tour guiado da plataforma
4. Criação do primeiro treino
5. Convite do primeiro aluno
6. Upgrade para plano pago

#### Fluxo de Onboarding Aluno
1. Aceitar convite do personal
2. Cadastro básico (nome, idade, objetivos)
3. Tutorial do app
4. Primeiro treino
5. Feedback e gamificação

### Mobile-First Approach
- PWA instalável
- Gestos touch otimizados  
- Navegação por tabs
- Quick actions com swipe
- Offline mode básico

---

## 🔧 Especificações Técnicas

### Arquitetura
```
Frontend (PWA)
├── Next.js 14 (App Router)
├── TypeScript
├── Tailwind CSS + Shadcn/ui
├── Zustand (State Management)
└── React Query (Data Fetching)

Backend (BaaS)
├── Supabase (Database + Auth)
├── PostgreSQL + Row Level Security
├── Edge Functions (Serverless)
└── Realtime Subscriptions

Integrações
├── Stripe (Pagamentos)
├── Mercado Pago (PIX)
├── Resend (Emails)
├── Cloudinary (Mídia)
└── Mixpanel (Analytics)
```

### Database Schema

#### Users Table
```sql
users (
  id: uuid PRIMARY KEY,
  email: varchar UNIQUE,
  role: enum('personal', 'gym_admin', 'student'),
  profile: jsonb,
  subscription: jsonb,
  created_at: timestamp
)
```

#### Workouts Table
```sql
workouts (
  id: uuid PRIMARY KEY,
  trainer_id: uuid REFERENCES users(id),
  student_id: uuid REFERENCES users(id),
  title: varchar,
  exercises: jsonb,
  scheduled_date: date,
  completed_at: timestamp,
  created_at: timestamp
)
```

#### Exercises Library
```sql
exercises (
  id: uuid PRIMARY KEY,
  name: varchar,
  category: varchar,
  muscle_groups: varchar[],
  video_url: varchar,
  instructions: text,
  equipment: varchar[]
)
```

### Performance Requirements
- **Page Load:** < 2s (First Contentful Paint)
- **API Response:** < 200ms (95th percentile)
- **Offline:** Core features trabalham offline
- **Mobile:** 60 FPS em dispositivos médios
- **SEO:** Core Web Vitals > 90

### Security & Compliance
- **Authentication:** Supabase Auth + JWT
- **Authorization:** Row Level Security (RLS)
- **Data:** Criptografia em trânsito e repouso
- **LGPD:** Anonimização e direito ao esquecimento
- **PCI DSS:** Compliance via Stripe

---

## 📈 Go-to-Market Strategy

### Segmentação Inicial
**Mercado Primário:** Personal trainers independentes (São Paulo)
**Mercado Secundário:** Academias pequenas/médias (50-200 alunos)
**Mercado Futuro:** Redes de academias, franquias

### Canais de Aquisição

#### Orgânico (60% do tráfego)
- **Content Marketing:** Blog sobre fitness e tecnologia
- **SEO:** "software para personal trainer", "app para academia"
- **Social Media:** Instagram/TikTok com dicas e cases
- **Partnerships:** Influencers fitness, nutricionistas

#### Pago (30% do tráfego)
- **Google Ads:** Keywords de alta intenção
- **Facebook/Instagram Ads:** Lookalike audiences
- **LinkedIn:** Targeting donos de academia
- **YouTube:** Video ads para personal trainers

#### Referral (10% do tráfego)
- **Sistema built-in:** R$ 50 de crédito por indicação
- **Partner Program:** 20% comissão para revendedores
- **Word of mouth:** NPS alto gera crescimento orgânico

### Pricing Strategy
- **Value-based pricing:** Baseado no valor entregue
- **Freemium:** Trial gratuito, não versão free permanente
- **Penetration:** Preços 20% abaixo da concorrência inicialmente
- **Upselling:** Adicionar features conforme uso aumenta

### Launch Plan

#### Soft Launch (30 dias)
- 50 personal trainers beta (São Paulo)
- Feedback intensivo e iteração
- Product-market fit inicial

#### Public Launch (60 dias)
- Product Hunt launch
- Press release
- Influencer partnerships
- Paid ads começam

#### Scale (90+ dias)
- Expand para outras cidades
- Onboard academias
- International markets

---

## 🚧 Roadmap e Priorização

### Q4 2025 - Foundation
**Sprint 1-2:** MVP (Auth, Treinos básicos, PWA)
**Sprint 3:** Pagamentos (Stripe + Mercado Pago)
**Sprint 4:** Analytics e relatórios básicos
**Sprint 5:** Features para academias
**Sprint 6:** Polish e otimizações

### Q1 2026 - Growth
- Sistema de referral
- Marketplace de personal trainers
- Integração com calendários
- App mobile nativo (se necessário)
- Expansão para nutricionistas

### Q2 2026 - Scale
- IA para sugestão de treinos
- Integração com wearables
- Payments splitting para academias
- Multi-idiomas (inglês/espanhol)
- API pública completa

### Q3 2026 - Enterprise
- Enterprise sales team
- Custom integrations
- Advanced analytics
- White label completo
- Franquia/multi-unit support

---

## ⚠️ Riscos e Mitigações

### Riscos Técnicos
**Risco:** Supabase como single point of failure  
**Mitigação:** Backup strategy, migration plan para AWS

**Risco:** Performance em escala  
**Mitigação:** Load testing, CDN, database optimization

### Riscos de Mercado
**Risco:** Concorrente com mais funding  
**Mitigação:** Focus em nicho, execution speed, community

**Risco:** Baixa adoção por personal trainers  
**Mitigação:** Extensive user research, onboarding optimization

### Riscos de Negócio
**Risco:** Churn alto por falta de value delivery  
**Mitigação:** Success metrics, user education, support

**Risco:** Regulamentação CREF para software fitness  
**Mitigação:** Legal compliance, partnership com CREF

---

## 📊 Success Metrics

### Metrics Framework (AARRR)

#### Acquisition
- **Monthly Signups:** 200+ (6 meses)
- **Cost per Acquisition (CAC):** < $50
- **Traffic Growth:** 20% month-over-month
- **Conversion Rate:** 3%+ (landing → signup)

#### Activation
- **Time to First Workout Created:** < 24h para 80% users
- **Onboarding Completion:** 90%+ complete tour
- **First Student Invited:** 60% em primeira semana

#### Retention
- **Day 7 Retention:** 70%+
- **Day 30 Retention:** 40%+
- **Monthly Churn:** < 5%
- **Cohort Retention:** 80%+ após 3 meses

#### Revenue
- **Monthly Recurring Revenue (MRR):** $50k (12 meses)
- **Average Revenue Per User (ARPU):** $40/mês
- **Customer Lifetime Value (LTV):** $800
- **LTV/CAC Ratio:** 16:1

#### Referral
- **Net Promoter Score (NPS):** 50+
- **Viral Coefficient:** 0.3
- **Referral Rate:** 20% dos usuários fazem indicação

### Business Intelligence
- **Weekly Business Reviews** com métricas key
- **Cohort Analysis** mensal para entender churn
- **Feature Usage Analytics** para priorizar roadmap
- **Customer Success Score** baseado em atividade

---

## 🎯 Next Steps

### Immediate Actions (Próximos 30 dias)
1. **Finalize Tech Stack:** Setup Next.js + Supabase
2. **Design System:** Criar componentes base no Figma
3. **User Research:** 20 entrevistas com personal trainers
4. **Legal Setup:** CNPJ, contratos, políticas de privacidade
5. **Domain & Branding:** Registrar fitpro.com.br

### Success Criteria para MVP
- [ ] 50 personal trainers ativos
- [ ] 200 alunos usando o app
- [ ] $5k MRR
- [ ] 80%+ retention rate
- [ ] NPS > 40

### Decision Points
**30 dias:** Go/No-go baseado em user research  
**60 dias:** Pricing strategy final baseada em willingness to pay  
**90 dias:** Escalar marketing ou pivotar funcionalidades

---

**Aprovações Necessárias:**
- [ ] Product Team
- [ ] Engineering Team  
- [ ] Design Team
- [ ] Marketing Team
- [ ] Legal/Compliance

---

*Este PRD é um documento vivo e será atualizado conforme o produto evolui e coletamos mais dados de usuários.*