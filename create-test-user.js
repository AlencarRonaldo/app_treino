/**
 * Criar usuário de teste para login
 */

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...');
  
  // Conectar ao banco SQLite
  const dbPath = path.join(__dirname, 'treinosapp-backend/dev_new.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Criar usuário
    const user = {
      id: 'test-user-123',
      email: 'joao.personal@treinosapp.com',
      password: hashedPassword,
      name: 'João Personal Trainer',
      userType: 'PERSONAL_TRAINER',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Inserir no banco
    await new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO users (
          id, email, password, name, userType, emailVerified, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [
        user.id, user.email, user.password, user.name, 
        user.userType, user.emailVerified ? 1 : 0, 
        user.createdAt, user.updatedAt
      ], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
    
    console.log('✅ Usuário criado com sucesso:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Senha: 123456`);
    console.log(`   Tipo: ${user.userType}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
  } finally {
    db.close();
  }
}

createTestUser();