# Diferenciação Personal Trainer / Aluno - TreinosApp

## Visão Geral
Implementar interfaces e funcionalidades completamente distintas para Personal Trainer e Aluno no TreinosApp, criando experiências de usuário otimizadas para cada tipo.

## Contexto Atual
- Atualmente as telas são idênticas para ambos os tipos de usuário
- userType já existe no sistema (STUDENT, PERSONAL_TRAINER)
- Necessário criar interfaces e fluxos específicos para cada persona

## Objetivos
1. **Sistema de Roles**: Implementar controle de acesso baseado em permissões
2. **Interfaces Distintas**: Dashboard, navegação e funcionalidades específicas
3. **Experiência Otimizada**: UX adaptada para cada tipo de usuário
4. **Gestão de Relacionamento**: PT gerencia alunos, alunos interagem com PT

## Estrutura do Projeto
- **Mobile**: `D:\treinosapp\treinosapp-mobile` (React Native + Expo)
- **Backend**: `D:\treinosapp\treinosapp-backend` (Node.js + TypeScript)
- **Database**: Estruturas de dados para relacionamentos PT-Aluno

## Funcionalidades por Tipo de Usuário

### Personal Trainer (PT)
- **Dashboard**: Resumo de alunos, métricas, alertas
- **Gestão de Alunos**: Adicionar, editar, monitorar alunos
- **Criação de Treinos**: Templates, personalização, atribuição
- **Analytics**: Relatórios de progresso dos alunos
- **Chat**: Comunicação com múltiplos alunos
- **Biblioteca**: Upload e gestão de conteúdo personalizado

### Aluno (Student)
- **Dashboard**: Próximo treino, progresso pessoal, metas
- **Treinos**: Visualizar treinos atribuídos, executar com timer
- **Progresso**: Acompanhar própria evolução
- **Chat**: Comunicação 1-1 com personal trainer
- **Perfil**: Configurações pessoais

## Arquitetura Técnica

### Frontend (React Native)
- Componentes condicionais baseados em `userType`
- Navegação diferenciada com React Navigation
- Contextos específicos para PT e Aluno
- Temas visuais distintos

### Backend (Node.js)
- Sistema de roles e permissões
- Middleware de autorização
- Endpoints específicos para cada tipo
- Relacionamentos PT-Aluno no banco

## Critérios de Sucesso
- ✅ Interfaces completamente diferentes para PT e Aluno
- ✅ Sistema de permissões funcionando corretamente
- ✅ Navegação adaptada ao tipo de usuário
- ✅ Funcionalidades específicas implementadas
- ✅ UX otimizada para cada persona
- ✅ Relacionamentos PT-Aluno funcionais