#!/usr/bin/env node
/**
 * Script para verificar PostgreSQL e configurar database
 */

const { exec } = require('child_process');

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${description} falhou:`);
        console.log(stderr || error.message);
        resolve(false);
      } else {
        console.log(`✅ ${description} OK`);
        if (stdout) console.log(stdout);
        resolve(true);
      }
    });
  });
}

async function checkPostgreSQL() {
  console.log('🐘 VERIFICANDO POSTGRESQL\n');

  // Check if PostgreSQL is installed
  const pgInstalled = await runCommand('psql --version', 'Verificando instalação do PostgreSQL');
  
  if (!pgInstalled) {
    console.log('\n📥 PostgreSQL não encontrado. Instalação necessária:');
    console.log('👉 Windows: https://www.postgresql.org/download/windows/');
    console.log('👉 macOS: brew install postgresql');
    console.log('👉 Linux: sudo apt-get install postgresql postgresql-contrib');
    return false;
  }

  // Check if PostgreSQL is running
  const pgRunning = await runCommand('pg_isready', 'Verificando se PostgreSQL está rodando');
  
  if (!pgRunning) {
    console.log('\n🚀 PostgreSQL não está rodando. Para iniciar:');
    console.log('👉 Windows: services.msc > PostgreSQL');
    console.log('👉 macOS: brew services start postgresql');
    console.log('👉 Linux: sudo systemctl start postgresql');
    return false;
  }

  console.log('\n✅ PostgreSQL está instalado e rodando!');
  return true;
}

async function createDatabase() {
  console.log('\n🗄️ CONFIGURANDO DATABASE\n');

  // Try to create database
  const dbCreated = await runCommand(
    'psql -U postgres -c "CREATE DATABASE treinosapp_dev;"',
    'Criando database treinosapp_dev'
  );

  if (!dbCreated) {
    console.log('⚠️ Database pode já existir ou credenciais incorretas');
    console.log('👉 Tente: psql -U postgres');
    console.log('👉 Depois: CREATE DATABASE treinosapp_dev;');
  }

  return true;
}

async function main() {
  console.log('🧪 VERIFICAÇÃO DE PRÉ-REQUISITOS - TREINOSAPP\n');

  const pgOK = await checkPostgreSQL();
  
  if (pgOK) {
    await createDatabase();
    console.log('\n🎉 Pré-requisitos verificados!');
    console.log('👉 Próximo passo: npm run test-integration');
  } else {
    console.log('\n❌ Configure PostgreSQL antes de continuar');
  }
}

main().catch(console.error);