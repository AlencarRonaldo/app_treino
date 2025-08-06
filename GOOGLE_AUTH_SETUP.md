# 🔐 Configuração do Google Authentication

Guia completo para configurar autenticação com Google no TreinosApp.

## 🚀 O que foi implementado:

### ✅ **Sistema de Autenticação Completo**
- **LoginScreen**: Tela de login com design moderno e gradiente
- **AuthContext**: Gerenciamento global de estado de autenticação
- **RootNavigator**: Navegação condicional baseada no login
- **Google Sign-In**: Integração com conta Google
- **Persistência**: Dados do usuário salvos localmente
- **Logout**: Funcionalidade completa de logout

### 📱 **Funcionalidades**
- Login com Google (botão nativo)
- Auto-login na próxima abertura do app
- Exibição dos dados do usuário (foto, nome, email)
- Logout com confirmação
- Loading states e tratamento de erros
- Design responsivo e acessível

## ⚙️ Como configurar no Google Cloud Console:

### **Passo 1: Criar Projeto no Google Cloud**
1. Acesse: https://console.cloud.google.com/
2. Clique em **"Select a project"** → **"New Project"**
3. Nome: `TreinosApp` (ou nome de sua escolha)
4. Clique **"Create"**

### **Passo 2: Ativar Google Sign-In API**
1. No menu lateral, vá em **"APIs & Services"** → **"Library"**
2. Pesquise por **"Google Sign-In API"**
3. Clique nela e depois em **"Enable"**

### **Passo 3: Configurar OAuth Consent Screen**
1. Vá em **"APIs & Services"** → **"OAuth consent screen"**
2. Escolha **"External"** → **"Create"**
3. Preencha:
   - **App name**: TreinosApp
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Clique **"Save and Continue"**
5. Em **"Scopes"**, clique **"Save and Continue"**
6. Em **"Test users"**, adicione emails para teste
7. Clique **"Save and Continue"**

### **Passo 4: Criar Credenciais OAuth**
1. Vá em **"APIs & Services"** → **"Credentials"**
2. Clique **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. **Application type**: **"Web application"**
4. **Name**: `TreinosApp Web Client`
5. **Authorized redirect URIs**: adicione:
   - `http://localhost:3000` (para desenvolvimento)
   - Suas URLs de produção
6. Clique **"Create"**
7. **COPIE O CLIENT ID** que aparece no modal

### **Passo 5: Configurar o App**
1. Abra `config/googleSignIn.ts`
2. Substitua `YOUR_WEB_CLIENT_ID.googleusercontent.com` pelo Client ID copiado:

```typescript
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: 'SEU_CLIENT_ID_AQUI.googleusercontent.com',
  // ...
};
```

## 📱 Como testar:

### **Para Desenvolvimento (Web)**
```bash
cd treinosapp-mobile
npm start
# Pressione 'w' para abrir no navegador
```

### **Para Mobile (Expo Go)**
```bash
cd treinosapp-mobile
npm start
# Escaneie o QR Code com o Expo Go
```

### **Fluxo de Teste**
1. App abre na tela de login
2. Clique **"Entrar com Google"**
3. Escolha conta Google para login
4. App redireciona para a tela principal
5. Perfil mostra dados do usuário
6. Teste logout e login novamente

## 🔧 Configurações Adicionais para Produção:

### **Para Android**
1. No Google Cloud Console, crie novo OAuth Client ID
2. **Application type**: **"Android"**
3. **Package name**: `com.seudominio.treinosapp`
4. **SHA-1 certificate fingerprint**: obtido com:
```bash
expo credentials:manager
```

### **Para iOS**
1. No Google Cloud Console, crie novo OAuth Client ID
2. **Application type**: **"iOS"**
3. **Bundle ID**: `com.seudominio.treinosapp`

### **Para Web (Expo Web)**
Use o Web Client ID já criado.

## 🐛 Troubleshooting:

### **Erro: "OAuth client not found"**
- Verifique se o Client ID está correto
- Confirme que a API está ativada
- Aguarde alguns minutos para propagação

### **Erro: "Sign in cancelled"**
- Normal quando usuário cancela o login
- Tratado automaticamente no código

### **Erro: "Play Services not available"**
- Apenas em dispositivos Android sem Google Play
- Use modo web ou simulador com Play Services

### **Login não persiste**
- Verifique se AsyncStorage está funcionando
- Limpe cache: `expo r -c`

## 📁 Estrutura de Arquivos Criada:

```
/contexts/
  └── AuthContext.tsx         # Gerenciamento de autenticação

/screens/
  └── LoginScreen.tsx         # Tela de login

/navigation/
  └── RootNavigator.tsx       # Navegação condicional

/config/
  └── googleSignIn.ts         # Configuração do Google

App.tsx                       # App principal com AuthProvider
```

## 🔐 Segurança:

### **Dados Armazenados Localmente**
- ID do usuário
- Nome e email
- URL da foto de perfil
- **NÃO**: senhas ou tokens sensíveis

### **Boas Práticas Implementadas**
- Tokens são gerenciados pelo Google Sign-In SDK
- Logout limpa todos os dados locais
- Verificação de autenticação a cada abertura
- Tratamento seguro de erros

## 🚀 Próximos Passos:

1. **Configure o Client ID real**
2. **Teste em dispositivo físico**
3. **Configure para produção (Android/iOS)**
4. **Implemente sincronização de dados**
5. **Adicione outros provedores (Apple, Facebook)**

O sistema está completo e pronto para uso! 🎉