// Configuração do Google Sign-In
export const GOOGLE_CONFIG = {
  // IMPORTANTE: Substitua este ID pelo seu Web Client ID do Google Cloud Console
  // Passos para obter:
  // 1. Acesse https://console.cloud.google.com/
  // 2. Crie ou selecione um projeto
  // 3. Ative a API Google Sign-In
  // 4. Crie credenciais OAuth 2.0
  // 5. Copie o Web Client ID aqui
  WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.googleusercontent.com',
  
  // Para desenvolvimento/testes, você pode usar um ID temporário
  // Mas para produção, você DEVE configurar um ID real
  DEV_WEB_CLIENT_ID: '123456789-abcdefghijklmnopqrstuvwxyz.googleusercontent.com',
};

// Função para obter o Client ID correto
export const getWebClientId = () => {
  // Em desenvolvimento, use o ID de desenvolvimento
  // Em produção, use o ID real
  const isProduction = process.env.NODE_ENV === 'production';
  
  return isProduction ? GOOGLE_CONFIG.WEB_CLIENT_ID : GOOGLE_CONFIG.DEV_WEB_CLIENT_ID;
};

// Instruções para configurar Google Sign-In
export const SETUP_INSTRUCTIONS = `
🔧 Como configurar o Google Sign-In:

1. GOOGLE CLOUD CONSOLE:
   • Acesse: https://console.cloud.google.com/
   • Crie um novo projeto ou selecione existente
   • Ative "Google Sign-In API"

2. CREDENCIAIS OAUTH:
   • Vá em "APIs & Services" > "Credentials"
   • Clique "Create Credentials" > "OAuth 2.0 Client ID"
   • Tipo: "Web application"
   • Authorized redirect URIs: adicione suas URLs

3. CONFIGURAR PLATAFORMAS:
   • Para Android: adicione SHA-1 fingerprint
   • Para iOS: adicione Bundle ID
   • Para Web: configure authorized domains

4. ATUALIZAR CÓDIGO:
   • Copie o Web Client ID
   • Cole em config/googleSignIn.ts
   • Substitua GOOGLE_CONFIG.WEB_CLIENT_ID

5. TESTING:
   • Adicione emails de teste em OAuth consent screen
   • Configure domínios autorizados

Para mais detalhes: https://docs.expo.dev/guides/authentication/#google
`;