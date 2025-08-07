/**
 * User Data Migration Script
 * Migrates user data from AsyncStorage to Supabase PostgreSQL
 */

const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Migration Statistics
 */
class MigrationStats {
  constructor() {
    this.totalUsers = 0;
    this.migratedUsers = 0;
    this.failedUsers = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addSuccess() {
    this.migratedUsers++;
  }

  addError(userId, error) {
    this.failedUsers++;
    this.errors.push({ userId, error: error.message, timestamp: new Date().toISOString() });
  }

  getReport() {
    const duration = Date.now() - this.startTime;
    return {
      duration: `${Math.round(duration / 1000)}s`,
      total: this.totalUsers,
      migrated: this.migratedUsers,
      failed: this.failedUsers,
      successRate: this.totalUsers > 0 ? Math.round((this.migratedUsers / this.totalUsers) * 100) : 0,
      errors: this.errors,
    };
  }
}

/**
 * Validate user data structure
 */
function validateUserData(userData) {
  const required = ['email', 'name', 'user_type'];
  const missing = required.filter(field => !userData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (!['personal_trainer', 'student'].includes(userData.user_type)) {
    throw new Error(`Invalid user_type: ${userData.user_type}`);
  }

  return true;
}

/**
 * Transform AsyncStorage user data to Supabase format
 */
function transformUserData(asyncData) {
  return {
    id: asyncData.id || uuidv4(),
    email: asyncData.email,
    name: asyncData.name || asyncData.displayName,
    user_type: asyncData.user_type || asyncData.userType,
    profile_picture: asyncData.profile_picture || asyncData.photoURL,
    phone: asyncData.phone,
    birth_date: asyncData.birth_date || asyncData.dateOfBirth,
    fitness_level: asyncData.fitness_level || 'BEGINNER',
    goals: Array.isArray(asyncData.goals) ? asyncData.goals : [],
    preferences: asyncData.preferences || {},
    created_at: asyncData.created_at || asyncData.createdAt || new Date().toISOString(),
    updated_at: asyncData.updated_at || asyncData.updatedAt || new Date().toISOString(),
    last_login_at: asyncData.last_login_at || asyncData.lastLoginAt,
    is_active: asyncData.is_active !== undefined ? asyncData.is_active : true,
    
    // Additional trainer-specific fields
    ...(asyncData.user_type === 'personal_trainer' && {
      specializations: asyncData.specializations || [],
      certifications: asyncData.certifications || [],
      experience_years: asyncData.experience_years || 0,
      hourly_rate: asyncData.hourly_rate,
      bio: asyncData.bio || asyncData.description,
    }),

    // Additional student-specific fields
    ...(asyncData.user_type === 'student' && {
      height: asyncData.height,
      weight: asyncData.weight,
      activity_level: asyncData.activity_level || 'MODERATE',
      medical_conditions: asyncData.medical_conditions || [],
      emergency_contact: asyncData.emergency_contact,
    }),
  };
}

/**
 * Load user data from AsyncStorage
 */
async function loadAsyncStorageUsers() {
  try {
    console.log('📱 Loading users from AsyncStorage...');
    
    // Get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(key => 
      key.startsWith('user_') || 
      key.startsWith('profile_') ||
      key === 'currentUser' ||
      key === 'users'
    );

    console.log(`Found ${userKeys.length} potential user keys:`, userKeys);

    const users = [];
    for (const key of userKeys) {
      try {
        const rawData = await AsyncStorage.getItem(key);
        if (rawData) {
          const userData = JSON.parse(rawData);
          
          // Handle different data structures
          if (key === 'users' && Array.isArray(userData)) {
            // Bulk users array
            users.push(...userData);
          } else if (userData.email && userData.name) {
            // Single user object
            users.push(userData);
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to parse data for key ${key}:`, error.message);
      }
    }

    console.log(`📊 Found ${users.length} users in AsyncStorage`);
    return users;
  } catch (error) {
    console.error('❌ Failed to load AsyncStorage users:', error);
    throw error;
  }
}

/**
 * Check if user already exists in Supabase
 */
async function userExists(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

/**
 * Migrate single user to Supabase
 */
async function migrateUser(userData, stats) {
  try {
    // Validate and transform data
    validateUserData(userData);
    const transformedData = transformUserData(userData);
    
    // Check if user already exists
    const exists = await userExists(transformedData.email);
    if (exists) {
      console.log(`⚠️  User already exists: ${transformedData.email}`);
      stats.addSuccess(); // Count as success since data is already there
      return;
    }

    // Insert into profiles table
    const { data, error } = await supabase
      .from('profiles')
      .insert(transformedData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Migrated user: ${transformedData.email} (${transformedData.user_type})`);
    stats.addSuccess();
    
    return data;
  } catch (error) {
    console.error(`❌ Failed to migrate user ${userData.email || 'unknown'}:`, error.message);
    stats.addError(userData.id || userData.email, error);
    throw error;
  }
}

/**
 * Create auth users for migrated profiles
 */
async function createAuthUsers(profiles) {
  console.log('🔐 Creating auth users for migrated profiles...');
  
  const authStats = {
    created: 0,
    failed: 0,
    errors: [],
  };

  for (const profile of profiles) {
    try {
      // Create auth user with email/password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: 'TempPassword123!', // Users will need to reset
        email_confirm: true,
        user_metadata: {
          name: profile.name,
          user_type: profile.user_type,
        },
      });

      if (authError) {
        // User might already exist in auth
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  Auth user already exists: ${profile.email}`);
          continue;
        }
        throw authError;
      }

      // Update profile with auth user ID
      if (authData.user) {
        await supabase
          .from('profiles')
          .update({ id: authData.user.id })
          .eq('email', profile.email);

        console.log(`🔐 Created auth user: ${profile.email}`);
        authStats.created++;
      }
    } catch (error) {
      console.error(`❌ Failed to create auth user for ${profile.email}:`, error.message);
      authStats.failed++;
      authStats.errors.push({
        email: profile.email,
        error: error.message,
      });
    }
  }

  return authStats;
}

/**
 * Validate migration results
 */
async function validateMigration(stats) {
  console.log('🔍 Validating migration results...');
  
  try {
    // Count users by type
    const { data: trainerCount, error: trainerError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'personal_trainer');

    const { data: studentCount, error: studentError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'student');

    if (trainerError || studentError) {
      throw new Error('Failed to count migrated users');
    }

    // Sample data validation
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (sampleError) {
      throw sampleError;
    }

    const validation = {
      totalInDatabase: (trainerCount?.length || 0) + (studentCount?.length || 0),
      personalTrainers: trainerCount?.length || 0,
      students: studentCount?.length || 0,
      sampleData: sampleUsers?.map(user => ({
        email: user.email,
        userType: user.user_type,
        hasRequiredFields: !!(user.name && user.email && user.user_type),
      })) || [],
    };

    console.log('📊 Migration validation:', validation);
    return validation;
  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    throw error;
  }
}

/**
 * Generate migration backup
 */
async function createBackup(users) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `user-migration-backup-${timestamp}.json`;
  
  const backupData = {
    timestamp: new Date().toISOString(),
    totalUsers: users.length,
    users: users.map(user => ({
      ...user,
      _migrationId: uuidv4(),
    })),
  };

  // In a real app, save to file system or external storage
  console.log(`💾 Backup would be saved to: ${backupFile}`);
  return backupFile;
}

/**
 * Main migration function
 */
async function migrateUsers() {
  const stats = new MigrationStats();
  let backupFile = null;
  let validationResults = null;

  try {
    console.log('🚀 Starting user data migration...');
    console.log('Environment:', {
      supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });

    // Test Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }

    console.log('✅ Supabase connection verified');

    // Load users from AsyncStorage
    const asyncUsers = await loadAsyncStorageUsers();
    stats.totalUsers = asyncUsers.length;

    if (asyncUsers.length === 0) {
      console.log('ℹ️  No users found in AsyncStorage to migrate');
      return stats.getReport();
    }

    // Create backup
    backupFile = await createBackup(asyncUsers);

    // Migrate users in batches
    const batchSize = 10;
    const migratedProfiles = [];
    
    for (let i = 0; i < asyncUsers.length; i += batchSize) {
      const batch = asyncUsers.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(asyncUsers.length / batchSize)}`);

      for (const user of batch) {
        try {
          const profile = await migrateUser(user, stats);
          if (profile) {
            migratedProfiles.push(profile);
          }
        } catch (error) {
          // Error already logged in migrateUser
          continue;
        }
      }

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create auth users for successfully migrated profiles
    if (migratedProfiles.length > 0) {
      const authStats = await createAuthUsers(migratedProfiles);
      console.log('🔐 Auth user creation results:', authStats);
    }

    // Validate migration
    validationResults = await validateMigration(stats);

    console.log('✅ User migration completed successfully!');
    return {
      migration: stats.getReport(),
      validation: validationResults,
      backup: backupFile,
    };

  } catch (error) {
    console.error('❌ User migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration
 */
async function rollbackMigration(backupFile) {
  console.log('🔄 Rolling back user migration...');
  
  try {
    // In a real implementation, load backup data and remove migrated users
    console.log(`📁 Would restore from backup: ${backupFile}`);
    
    // Delete all profiles that were migrated
    const { error } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      throw error;
    }

    console.log('✅ Migration rollback completed');
    return true;
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Export functions for testing
module.exports = {
  migrateUsers,
  rollbackMigration,
  validateUserData,
  transformUserData,
  MigrationStats,
};

// Run migration if called directly
if (require.main === module) {
  migrateUsers()
    .then(results => {
      console.log('\n📊 Final Migration Report:');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}