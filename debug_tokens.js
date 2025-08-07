// Debug script para verificar tokens salvos
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugTokens = async () => {
  console.log('🔍 Debug - Verificando tokens salvos...');
  
  try {
    const accessToken = await AsyncStorage.getItem('@TreinosApp:accessToken');
    const refreshToken = await AsyncStorage.getItem('@TreinosApp:refreshToken');
    const userData = await AsyncStorage.getItem('@TreinosApp:userData');
    const userType = await AsyncStorage.getItem('@TreinosApp:userType');
    
    console.log('🔍 Debug - Tokens encontrados:');
    console.log('  - Access Token:', accessToken ? 'EXISTE' : 'NULO');
    console.log('  - Refresh Token:', refreshToken ? 'EXISTE' : 'NULO');
    console.log('  - User Data:', userData ? 'EXISTE' : 'NULO');
    console.log('  - User Type:', userType || 'NULO');
    
    if (accessToken) {
      // Parse token
      try {
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        
        console.log('🔍 Debug - Token info:');
        console.log('  - Expira em:', new Date(payload.exp * 1000));
        console.log('  - Válido?', payload.exp * 1000 > Date.now());
      } catch (e) {
        console.log('❌ Debug - Erro ao parsear token:', e);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug - Erro ao verificar tokens:', error);
  }
};

export { debugTokens };