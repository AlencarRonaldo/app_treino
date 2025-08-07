# TreinosApp Supabase Backend Implementation - PRD

## Visão Geral
Implementar backend completo com Supabase para substituir mock data e criar sistema real de múltiplos usuários no TreinosApp.

## Objetivos
- Substituir todo mock data por Supabase PostgreSQL
- Implementar autenticação real multi-usuário
- Criar sistema de real-time para chat e sync
- Configurar storage para vídeos e imagens
- Migrar dados existentes preservando funcionalidades

## Escopo Técnico

### 1. Database Schema & Migration
- Criar todas as tabelas no Supabase PostgreSQL
- Migrar schema Prisma existente para Supabase
- Configurar RLS (Row Level Security) para isolamento PT/Aluno
- Seeder com dados iniciais (exercícios, categorias)

### 2. Authentication System
- Configurar Supabase Auth com email/password
- Implementar Google Sign-In via Supabase
- Sistema de recovery de senha
- Profiles com userType (STUDENT/PERSONAL_TRAINER)
- JWT tokens automáticos

### 3. Real-time Features
- Chat em tempo real com Supabase Realtime
- Sync automático de dados entre dispositivos
- Push notifications para mensagens
- Live updates para progresso e treinos

### 4. Storage System
- Upload de vídeos personalizados para Storage
- Fotos de progresso dos alunos
- Avatars de usuários
- Backup e compressão de mídia

### 5. API Integration
- Substituir todos os Services mock por Supabase calls
- WorkoutService, StudentService, ChatService, ProgressService
- Error handling e offline support
- Caching inteligente com AsyncStorage

### 6. Data Migration
- Scripts para migrar dados mock para estrutura real
- Preservar funcionalidades existentes
- Testes de integridade de dados
- Rollback strategy

### 7. Performance & Security
- Configurar RLS policies para segurança
- Otimização de queries PostgreSQL
- Connection pooling
- Rate limiting e throttling

### 8. Testing & Quality
- Testes unitários para services
- Testes de integração com Supabase
- E2E testing do fluxo completo
- Load testing para performance

## Deliverables
- Backend Supabase completo configurado
- Todos os mock services substituídos
- Sistema multi-usuário funcionando
- Chat real-time implementado
- Storage de mídia operacional
- Documentação completa da API
- Guia de deployment e manutenção

## Success Criteria
- Login real com múltiplos usuários simultâneos
- Chat funcionando em tempo real
- Dados sincronizados entre dispositivos
- Upload/download de vídeos funcionando
- Performance mantida (<3s loading)
- Zero data loss durante migração

## Stack Técnico
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- @supabase/supabase-js client
- React Native + TypeScript
- AsyncStorage para cache offline
- Expo para build e deploy

## Timeline Estimado
- Setup e configuração: 2 dias
- Database e Authentication: 3 dias
- Services migration: 4 dias
- Real-time e Storage: 3 dias
- Testing e refinements: 3 dias
- Total: ~15 dias de desenvolvimento

## Riscos e Mitigações
- **Risco**: Breaking changes durante migração
- **Mitigação**: Manter mock services como fallback temporário

- **Risco**: Performance issues com queries complexas
- **Mitigação**: Otimização incremental e caching

- **Risco**: Custo inesperado do Supabase
- **Mitigação**: Monitoramento de usage e alertas

## Dependencies
- Acesso ao projeto Supabase (free tier)
- Configuração de domínio para auth redirects
- Políticas de privacidade para storage de dados
- Testes em múltiplos dispositivos para validation