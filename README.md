# 💪 TreinosApp - Aplicativo de Treinos

Aplicativo completo de acompanhamento de treinos desenvolvido em React Native com Expo, featuring autenticação Google e design system moderno.

## ✨ Funcionalidades Principais

### 🔐 **Autenticação**
- Login com Google integrado
- Persistência de sessão
- Logout seguro
- Dados do usuário sincronizados

### 📱 **5 Telas Principais**
- **🏠 Home**: Dashboard com treino do dia e estatísticas semanais
- **💪 Exercícios**: Biblioteca completa com busca e filtros por categoria
- **📋 Treinos**: Gerenciamento de rotinas personalizadas
- **📊 Progresso**: Métricas visuais e recordes pessoais
- **👤 Perfil**: Configurações e informações do usuário

### 🎨 **Design System**
- Material Design 3 com React Native Paper
- Cores focadas em fitness (laranja energético + azul confiável)
- Componentes reutilizáveis (FitnessCard, FitnessButton, StatsCard)
- Design tokens centralizados
- Interface totalmente em português brasileiro

## 🚀 Como executar

### **Pré-requisitos**
- Node.js (versão 16+)
- npm ou yarn
- Expo CLI
- Expo Go app (para mobile)

### **Instalação**
```bash
# Clone o repositório
git clone [seu-repo]
cd treinosapp-mobile

# Instale dependências
npm install

# Inicie o servidor
npm start
```

### **Comandos disponíveis**
```bash
npm start          # Servidor de desenvolvimento
npm run android    # Executar no Android
npm run ios        # Executar no iOS  
npm run web        # Executar no navegador
```

## ⚙️ Configuração do Google Sign-In

### **IMPORTANTE**: Para usar autenticação Google:

1. **Configure o Google Cloud Console**:
   - Acesse: https://console.cloud.google.com/
   - Crie projeto e ative Google Sign-In API
   - Configure OAuth consent screen
   - Crie credenciais Web Client ID

2. **Atualize o código**:
   ```typescript
   // Em config/googleSignIn.ts
   WEB_CLIENT_ID: 'SEU_CLIENT_ID.googleusercontent.com'
   ```

3. **Guia completo**: Veja `GOOGLE_AUTH_SETUP.md`

## 📱 Funcionalidades Detalhadas

## 🛠️ Tecnologias Utilizadas

- React Native
- Expo (Managed Workflow)
- TypeScript
- React Navigation v7
- React Native Paper (Material Design)
- React Native Chart Kit
- AsyncStorage
- React Native Reanimated
- React Native Gesture Handler

## 📂 Estrutura do Projeto

```
treinosapp-mobile/
├── screens/          # Componentes de tela
├── components/       # Componentes reutilizáveis
├── navigation/       # Configuração de navegação
├── services/         # Serviços e APIs
├── hooks/           # React Hooks customizados
├── utils/           # Funções utilitárias
├── constants/       # Constantes e configurações
├── types/           # Definições TypeScript
├── assets/          # Imagens e recursos estáticos
├── App.tsx          # Componente principal
├── app.json         # Configuração do Expo
└── package.json     # Dependências do projeto
```

## 🎨 Design

O aplicativo segue as diretrizes do Material Design 3 com:
- Cores primárias e secundárias personalizadas
- Componentes consistentes do React Native Paper
- Interface em português brasileiro
- Suporte para modo claro (modo escuro em desenvolvimento)

## 📝 Próximos Passos

- [ ] Integração com AsyncStorage para persistência de dados
- [ ] Criação de componentes reutilizáveis
- [ ] Sistema de autenticação
- [ ] Modo offline completo
- [ ] Exportação de dados
- [ ] Notificações de lembrete de treino

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, sinta-se à vontade para submeter pull requests.

## 📄 Licença

Este projeto está sob a licença ISC.