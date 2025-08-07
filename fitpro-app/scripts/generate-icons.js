const fs = require('fs');
const { createCanvas } = require('canvas');

// Função para criar ícone básico
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo azul
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, size, size);

  // Círculo branco
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
  ctx.fill();

  // Letra F em azul
  ctx.fillStyle = '#2563eb';
  ctx.font = `bold ${size/2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', size/2, size/2);

  // Salvar como PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`✅ ${filename} criado`);
}

// Criar ícones
try {
  createIcon(16, 'favicon-16x16.png');
  createIcon(32, 'favicon-32x32.png');
  createIcon(192, 'icon-192x192.png');
  createIcon(512, 'icon-512x512.png');
  console.log('🎉 Todos os ícones foram criados com sucesso!');
} catch (error) {
  console.log('⚠️ Erro ao criar ícones. Criando arquivos vazios...');
  
  // Criar arquivos vazios como fallback
  const sizes = [16, 32, 192, 512];
  sizes.forEach(size => {
    const filename = size <= 32 ? `favicon-${size}x${size}.png` : `icon-${size}x${size}.png`;
    fs.writeFileSync(`public/${filename}`, '');
    console.log(`📄 ${filename} criado (vazio)`);
  });
} 