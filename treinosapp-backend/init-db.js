const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando banco de dados SQLite...');
    
    // Check if database file exists
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    const dbExists = fs.existsSync(dbPath);
    if (dbExists) {
      console.log('⚠️ Arquivo de banco já existe, tentando usar o existente');
    }
    
    // Initialize Prisma Client
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');
    
    // Create tables using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT,
        "name" TEXT NOT NULL,
        "profilePicture" TEXT,
        "userType" TEXT NOT NULL DEFAULT 'STUDENT',
        "height" INTEGER,
        "weight" REAL,
        "birthDate" DATETIME,
        "gender" TEXT,
        "fitnessLevel" TEXT,
        "primaryGoal" TEXT,
        "activityLevel" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastLogin" DATETIME,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "trainerId" TEXT,
        FOREIGN KEY ("trainerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "exercises" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "instructions" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "muscleGroups" TEXT NOT NULL,
        "equipment" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
        "imageUrl" TEXT,
        "videoUrl" TEXT,
        "isOfficial" BOOLEAN NOT NULL DEFAULT false,
        "tags" TEXT,
        "createdById" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "workouts" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT NOT NULL DEFAULT 'CUSTOM',
        "estimatedDuration" INTEGER,
        "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
        "isTemplate" BOOLEAN NOT NULL DEFAULT false,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "tags" TEXT,
        "targetMuscleGroups" TEXT,
        "equipment" TEXT,
        "userId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "workout_exercises" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "order" INTEGER NOT NULL,
        "sets" INTEGER NOT NULL,
        "reps" TEXT NOT NULL,
        "weight" REAL,
        "restTime" INTEGER,
        "notes" TEXT,
        "workoutId" TEXT NOT NULL,
        "exerciseId" TEXT NOT NULL,
        FOREIGN KEY ("workoutId") REFERENCES "workouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("exerciseId") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "workout_sessions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "startTime" DATETIME NOT NULL,
        "endTime" DATETIME,
        "duration" INTEGER,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "rating" INTEGER,
        "notes" TEXT,
        "userId" TEXT NOT NULL,
        "workoutId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("workoutId") REFERENCES "workouts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "progress_records" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "value" REAL NOT NULL,
        "unit" TEXT NOT NULL,
        "notes" TEXT,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    console.log('✅ Tabelas criadas com sucesso');
    
    await prisma.$disconnect();
    console.log('✅ Banco de dados inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
}

initializeDatabase();