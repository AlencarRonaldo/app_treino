const fs = require('fs');
const path = require('path');

// Função para criar arquivo vazio
function createEmptyFile(filename) {
  const filepath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(filepath, '');
  console.log(`📄 ${filename} criado`);
}

// Lista de ícones necessários
const icons = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'icon-192x192.png',
  'icon-512x512.png'
];

console.log('🎨 Criando ícones básicos...');

// Criar cada ícone
icons.forEach(icon => {
  try {
    createEmptyFile(icon);
  } catch (error) {
    console.log(`❌ Erro ao criar ${icon}:`, error.message);
  }
});

console.log('✅ Processo concluído!');
console.log('💡 Para ícones reais, substitua os arquivos vazios por imagens PNG'); 