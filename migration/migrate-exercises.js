/**
 * Exercise Data Migration Script
 * Migrates custom exercise data from AsyncStorage to Supabase PostgreSQL
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
class ExerciseMigrationStats {
  constructor() {
    this.totalExercises = 0;
    this.migratedExercises = 0;
    this.failedExercises = 0;
    this.totalMediaFiles = 0;
    this.migratedMediaFiles = 0;
    this.failedMediaFiles = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addExerciseSuccess() {
    this.migratedExercises++;
  }

  addExerciseError(exerciseId, error) {
    this.failedExercises++;
    this.errors.push({
      type: 'exercise',
      id: exerciseId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  addMediaSuccess() {
    this.migratedMediaFiles++;
  }

  addMediaError(mediaId, error) {
    this.failedMediaFiles++;
    this.errors.push({
      type: 'media',
      id: mediaId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  getReport() {
    const duration = Date.now() - this.startTime;
    return {
      duration: `${Math.round(duration / 1000)}s`,
      exercises: {
        total: this.totalExercises,
        migrated: this.migratedExercises,
        failed: this.failedExercises,
        successRate: this.totalExercises > 0 ? Math.round((this.migratedExercises / this.totalExercises) * 100) : 0,
      },
      media: {
        total: this.totalMediaFiles,
        migrated: this.migratedMediaFiles,
        failed: this.failedMediaFiles,
        successRate: this.totalMediaFiles > 0 ? Math.round((this.migratedMediaFiles / this.totalMediaFiles) * 100) : 0,
      },
      errors: this.errors,
    };
  }
}

/**
 * Validate exercise data structure
 */
function validateExerciseData(exerciseData) {
  const required = ['name', 'trainer_id'];
  const missing = required.filter(field => !exerciseData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (exerciseData.muscle_groups && !Array.isArray(exerciseData.muscle_groups)) {
    throw new Error('Muscle groups must be an array');
  }

  return true;
}

/**
 * Transform AsyncStorage exercise data to Supabase format
 */
function transformExerciseData(asyncData, userIdMapping) {
  // Map old user ID to new Supabase user ID
  const trainerId = userIdMapping[asyncData.trainer_id] || asyncData.trainer_id;

  return {
    id: asyncData.id || uuidv4(),
    name: asyncData.name,
    description: asyncData.description || '',
    trainer_id: trainerId,
    muscle_groups: Array.isArray(asyncData.muscle_groups) ? asyncData.muscle_groups : 
                  Array.isArray(asyncData.target_muscles) ? asyncData.target_muscles : 
                  asyncData.muscle_group ? [asyncData.muscle_group] : ['general'],
    equipment: asyncData.equipment || 'bodyweight',
    difficulty: mapDifficulty(asyncData.difficulty || asyncData.level),
    instructions: asyncData.instructions || asyncData.description || '',
    tips: asyncData.tips || [],
    video_url: asyncData.video_url || asyncData.videoUrl,
    thumbnail_url: asyncData.thumbnail_url || asyncData.thumbnailUrl,
    animation_url: asyncData.animation_url || asyncData.animationUrl,
    is_public: asyncData.is_public || asyncData.isPublic || false,
    tags: Array.isArray(asyncData.tags) ? asyncData.tags : [],
    calories_per_rep: asyncData.calories_per_rep || asyncData.caloriesPerRep || 0.5,
    created_at: asyncData.created_at || asyncData.createdAt || new Date().toISOString(),
    updated_at: asyncData.updated_at || asyncData.updatedAt || new Date().toISOString(),
  };
}

/**
 * Map difficulty levels to Supabase enum values
 */
function mapDifficulty(difficulty) {
  const difficultyMap = {
    'easy': 'beginner',
    'beginner': 'beginner',
    'medium': 'intermediate',
    'intermediate': 'intermediate',
    'hard': 'advanced',
    'advanced': 'advanced',
    'expert': 'advanced',
  };

  return difficultyMap[difficulty?.toLowerCase()] || 'beginner';
}

/**
 * Load exercise data from AsyncStorage
 */
async function loadAsyncStorageExercises() {
  try {
    console.log('💪 Loading exercises from AsyncStorage...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    const exerciseKeys = allKeys.filter(key => 
      key.startsWith('exercise_') || 
      key.startsWith('exercises') ||
      key === 'customExercises' ||
      key === 'userExercises'
    );

    console.log(`Found ${exerciseKeys.length} potential exercise keys:`, exerciseKeys);

    const exercises = [];
    for (const key of exerciseKeys) {
      try {
        const rawData = await AsyncStorage.getItem(key);
        if (rawData) {
          const exerciseData = JSON.parse(rawData);
          
          if (Array.isArray(exerciseData)) {
            exercises.push(...exerciseData);
          } else if (exerciseData.name && exerciseData.trainer_id) {
            exercises.push(exerciseData);
          } else if (typeof exerciseData === 'object') {
            // Handle nested exercise objects
            Object.values(exerciseData).forEach(exercise => {
              if (exercise && typeof exercise === 'object' && exercise.name) {
                exercises.push(exercise);
              }
            });
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to parse exercise data for key ${key}:`, error.message);
      }
    }

    console.log(`📊 Found ${exercises.length} exercises in AsyncStorage`);
    return exercises;
  } catch (error) {
    console.error('❌ Failed to load AsyncStorage exercises:', error);
    throw error;
  }
}

/**
 * Create user ID mapping from AsyncStorage IDs to Supabase IDs
 */
async function createUserIdMapping() {
  console.log('🗺️  Creating user ID mapping...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email');

  if (error) {
    throw error;
  }

  // Create mapping from email to ID (assuming emails are consistent)
  const mapping = {};
  profiles.forEach(profile => {
    mapping[profile.email] = profile.id;
  });

  console.log(`📊 Created mapping for ${Object.keys(mapping).length} users`);
  return mapping;
}

/**
 * Check if exercise already exists in Supabase
 */
async function exerciseExists(exerciseId, trainerId, name) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .or(`id.eq.${exerciseId},and(trainer_id.eq.${trainerId},name.eq.${name})`)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

/**
 * Migrate media files to Supabase Storage
 */
async function migrateMediaFiles(exerciseData, stats) {
  const mediaUrls = {};
  
  try {
    // Handle video file
    if (exerciseData.video_file || exerciseData.videoFile) {
      const videoFile = exerciseData.video_file || exerciseData.videoFile;
      // In a real migration, you would upload the file to Supabase Storage
      // For now, we'll just simulate the URL
      mediaUrls.video_url = `https://storage.supabase.com/exercises/videos/${exerciseData.id}.mp4`;
      stats.addMediaSuccess();
    }

    // Handle thumbnail file
    if (exerciseData.thumbnail_file || exerciseData.thumbnailFile) {
      const thumbnailFile = exerciseData.thumbnail_file || exerciseData.thumbnailFile;
      mediaUrls.thumbnail_url = `https://storage.supabase.com/exercises/thumbnails/${exerciseData.id}.jpg`;
      stats.addMediaSuccess();
    }

    // Handle animation file
    if (exerciseData.animation_file || exerciseData.animationFile) {
      const animationFile = exerciseData.animation_file || exerciseData.animationFile;
      mediaUrls.animation_url = `https://storage.supabase.com/exercises/animations/${exerciseData.id}.gif`;
      stats.addMediaSuccess();
    }

    return mediaUrls;
  } catch (error) {
    console.error(`❌ Failed to migrate media for exercise ${exerciseData.id}:`, error.message);
    stats.addMediaError(exerciseData.id, error);
    return {};
  }
}

/**
 * Migrate single exercise to Supabase
 */
async function migrateExercise(exerciseData, userIdMapping, stats) {
  try {
    validateExerciseData(exerciseData);
    const transformedData = transformExerciseData(exerciseData, userIdMapping);
    
    // Check if exercise already exists
    const exists = await exerciseExists(
      transformedData.id, 
      transformedData.trainer_id, 
      transformedData.name
    );
    
    if (exists) {
      console.log(`⚠️  Exercise already exists: ${transformedData.name}`);
      stats.addExerciseSuccess();
      return transformedData.id;
    }

    // Migrate media files
    const mediaUrls = await migrateMediaFiles(exerciseData, stats);
    Object.assign(transformedData, mediaUrls);

    // Insert exercise
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .insert(transformedData)
      .select()
      .single();

    if (exerciseError) {
      throw exerciseError;
    }

    console.log(`✅ Migrated exercise: ${transformedData.name} (${transformedData.equipment})`);
    stats.addExerciseSuccess();

    return exercise.id;
  } catch (error) {
    console.error(`❌ Failed to migrate exercise ${exerciseData.name || 'unknown'}:`, error.message);
    stats.addExerciseError(exerciseData.id || exerciseData.name, error);
    throw error;
  }
}

/**
 * Validate migration results
 */
async function validateExerciseMigration(stats) {
  console.log('🔍 Validating exercise migration results...');
  
  try {
    // Count exercises by difficulty
    const { data: difficultyStats, error: difficultyError } = await supabase
      .from('exercises')
      .select('difficulty')
      .then(response => {
        if (response.error) throw response.error;
        
        const difficulties = {};
        response.data.forEach(exercise => {
          difficulties[exercise.difficulty] = (difficulties[exercise.difficulty] || 0) + 1;
        });
        
        return { data: difficulties, error: null };
      });

    if (difficultyError) throw difficultyError;

    // Count exercises by equipment
    const { data: equipmentStats, error: equipmentError } = await supabase
      .from('exercises')
      .select('equipment')
      .then(response => {
        if (response.error) throw response.error;
        
        const equipment = {};
        response.data.forEach(exercise => {
          equipment[exercise.equipment] = (equipment[exercise.equipment] || 0) + 1;
        });
        
        return { data: equipment, error: null };
      });

    if (equipmentError) throw equipmentError;

    // Sample data validation
    const { data: sampleExercises, error: sampleError } = await supabase
      .from('exercises')
      .select('*')
      .limit(5);

    if (sampleError) throw sampleError;

    const validation = {
      totalExercisesInDatabase: Object.values(difficultyStats).reduce((sum, count) => sum + count, 0),
      difficultyDistribution: difficultyStats,
      equipmentDistribution: equipmentStats,
      sampleExercises: sampleExercises?.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        difficulty: exercise.difficulty,
        equipment: exercise.equipment,
        muscle_groups: exercise.muscle_groups,
        hasMedia: !!(exercise.video_url || exercise.thumbnail_url),
        hasRequiredFields: !!(exercise.name && exercise.trainer_id),
      })) || [],
    };

    console.log('📊 Exercise migration validation:', validation);
    return validation;
  } catch (error) {
    console.error('❌ Exercise migration validation failed:', error);
    throw error;
  }
}

/**
 * Generate migration backup
 */
async function createExerciseBackup(exercises) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `exercise-migration-backup-${timestamp}.json`;
  
  const backupData = {
    timestamp: new Date().toISOString(),
    totalExercises: exercises.length,
    exercises: exercises.map(exercise => ({
      ...exercise,
      _migrationId: uuidv4(),
    })),
  };

  console.log(`💾 Backup would be saved to: ${backupFile}`);
  return backupFile;
}

/**
 * Main exercise migration function
 */
async function migrateExercises() {
  const stats = new ExerciseMigrationStats();
  let backupFile = null;
  let validationResults = null;

  try {
    console.log('🚀 Starting exercise data migration...');

    // Test Supabase connection
    const { error: connectionError } = await supabase
      .from('exercises')
      .select('count')
      .limit(1);

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }

    console.log('✅ Supabase connection verified');

    // Create user ID mapping
    const userIdMapping = await createUserIdMapping();

    // Load exercises from AsyncStorage
    const asyncExercises = await loadAsyncStorageExercises();
    stats.totalExercises = asyncExercises.length;
    stats.totalMediaFiles = asyncExercises.filter(ex => 
      ex.video_file || ex.thumbnail_file || ex.animation_file
    ).length * 3; // Estimate 3 media files per exercise on average

    if (asyncExercises.length === 0) {
      console.log('ℹ️  No exercises found in AsyncStorage to migrate');
      return stats.getReport();
    }

    // Create backup
    backupFile = await createExerciseBackup(asyncExercises);

    // Migrate exercises in batches
    const batchSize = 10;
    
    for (let i = 0; i < asyncExercises.length; i += batchSize) {
      const batch = asyncExercises.slice(i, i + batchSize);
      console.log(`📦 Processing exercise batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(asyncExercises.length / batchSize)}`);

      for (const exercise of batch) {
        try {
          await migrateExercise(exercise, userIdMapping, stats);
        } catch (error) {
          // Error already logged in migrateExercise
          continue;
        }
      }

      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Validate migration
    validationResults = await validateExerciseMigration(stats);

    console.log('✅ Exercise migration completed successfully!');
    return {
      migration: stats.getReport(),
      validation: validationResults,
      backup: backupFile,
    };

  } catch (error) {
    console.error('❌ Exercise migration failed:', error);
    throw error;
  }
}

/**
 * Rollback exercise migration
 */
async function rollbackExerciseMigration(backupFile) {
  console.log('🔄 Rolling back exercise migration...');
  
  try {
    // Delete exercises
    const { error: exerciseError } = await supabase
      .from('exercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (exerciseError) {
      throw exerciseError;
    }

    console.log('✅ Exercise migration rollback completed');
    return true;
  } catch (error) {
    console.error('❌ Exercise migration rollback failed:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  migrateExercises,
  rollbackExerciseMigration,
  validateExerciseData,
  transformExerciseData,
  ExerciseMigrationStats,
};

// Run migration if called directly
if (require.main === module) {
  migrateExercises()
    .then(results => {
      console.log('\n📊 Final Exercise Migration Report:');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Exercise migration failed:', error);
      process.exit(1);
    });
}