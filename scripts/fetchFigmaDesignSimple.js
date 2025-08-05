// Script simplificado para testar a conexão com Figma
require('dotenv').config();

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_ID = process.env.FIGMA_FILE_ID || '1367105158760267911';

console.log('🔍 Verificando configuração...');
console.log(`Token: ${FIGMA_TOKEN ? FIGMA_TOKEN.substring(0, 10) + '...' : 'NÃO ENCONTRADO'}`);
console.log(`File ID: ${FILE_ID}`);

if (!FIGMA_TOKEN) {
  console.error('\n❌ Token do Figma não encontrado!');
  console.log('\n📝 Como obter um token válido:');
  console.log('1. Acesse: https://www.figma.com/settings');
  console.log('2. Vá na seção "Personal access tokens"');
  console.log('3. Clique em "Create new token"');
  console.log('4. Dê um nome ao token (ex: "TreinosApp")');
  console.log('5. Copie o token gerado (começa com "figd_" seguido de caracteres aleatórios)');
  console.log('6. Cole no arquivo .env: FIGMA_ACCESS_TOKEN=seu_token_aqui');
  process.exit(1);
}

// Testar com fetch nativo
async function testFigmaConnection() {
  console.log('\n🔗 Testando conexão com Figma...');
  
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${FILE_ID}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Conexão bem-sucedida!');
      console.log(`📁 Arquivo: ${data.name}`);
      console.log(`📅 Última modificação: ${new Date(data.lastModified).toLocaleString('pt-BR')}`);
      console.log(`📊 Versão: ${data.version}`);
    } else if (response.status === 403) {
      console.error('❌ Token inválido ou sem permissão');
      console.log('Verifique se o token está correto e tem acesso ao arquivo.');
    } else if (response.status === 404) {
      console.error('❌ Arquivo não encontrado');
      console.log('Verifique se o ID do arquivo está correto.');
      console.log(`ID atual: ${FILE_ID}`);
    } else {
      const errorData = await response.json();
      console.error('❌ Erro:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
  }
}

testFigmaConnection();