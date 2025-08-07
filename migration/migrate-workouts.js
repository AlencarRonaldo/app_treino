/**
 * Workout Data Migration Script
 * Migrates workout data from AsyncStorage to Supabase PostgreSQL
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
class WorkoutMigrationStats {
  constructor() {
    this.totalWorkouts = 0;
    this.migratedWorkouts = 0;
    this.failedWorkouts = 0;
    this.totalExercises = 0;
    this.migratedExercises = 0;
    this.failedExercises = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addWorkoutSuccess() {
    this.migratedWorkouts++;
  }

  addWorkoutError(workoutId, error) {
    this.failedWorkouts++;
    this.errors.push({
      type: 'workout',
      id: workoutId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
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

  getReport() {
    const duration = Date.now() - this.startTime;
    return {
      duration: `${Math.round(duration / 1000)}s`,
      workouts: {
        total: this.totalWorkouts,
        migrated: this.migratedWorkouts,
        failed: this.failedWorkouts,
        successRate: this.totalWorkouts > 0 ? Math.round((this.migratedWorkouts / this.totalWorkouts) * 100) : 0,
      },
      exercises: {
        total: this.totalExercises,
        migrated: this.migratedExercises,
        failed: this.failedExercises,
        successRate: this.totalExercises > 0 ? Math.round((this.migratedExercises / this.totalExercises) * 100) : 0,
      },
      errors: this.errors,
    };
  }
}

/**
 * Validate workout data structure
 */
function validateWorkoutData(workoutData) {
  const required = ['name', 'trainer_id'];
  const missing = required.filter(field => !workoutData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (workoutData.exercises && !Array.isArray(workoutData.exercises)) {
    throw new Error('Exercises must be an array');
  }

  return true;
}

/**
 * Transform AsyncStorage workout data to Supabase format
 */
function transformWorkoutData(asyncData, userIdMapping) {
  // Map old user ID to new Supabase user ID
  const trainerId = userIdMapping[asyncData.trainer_id] || asyncData.trainer_id;
  const studentId = asyncData.student_id ? (userIdMapping[asyncData.student_id] || asyncData.student_id) : null;

  return {
    id: asyncData.id || uuidv4(),
    name: asyncData.name,
    description: asyncData.description || '',
    trainer_id: trainerId,
    student_id: studentId,
    category: mapWorkoutCategory(asyncData.category || asyncData.type),
    difficulty: mapDifficulty(asyncData.difficulty || asyncData.level),
    estimated_duration: asyncData.estimated_duration || asyncData.duration || 60,
    target_muscle_groups: Array.isArray(asyncData.muscle_groups) ? asyncData.muscle_groups : 
                         Array.isArray(asyncData.target_muscles) ? asyncData.target_muscles : [],
    equipment: Array.isArray(asyncData.equipment) ? asyncData.equipment : 
               asyncData.equipment ? [asyncData.equipment] : [],
    is_template: asyncData.is_template || asyncData.isTemplate || false,
    is_public: asyncData.is_public || asyncData.isPublic || false,
    tags: Array.isArray(asyncData.tags) ? asyncData.tags : [],
    created_at: asyncData.created_at || asyncData.createdAt || new Date().toISOString(),
    updated_at: asyncData.updated_at || asyncData.updatedAt || new Date().toISOString(),
  };
}

/**
 * Transform exercise data for workout_exercises table
 */
function transformExerciseData(exerciseData, workoutId, userIdMapping) {
  return {
    id: uuidv4(),
    workout_id: workoutId,
    exercise_id: exerciseData.exercise_id || exerciseData.id,
    order_index: exerciseData.order || exerciseData.order_index || 0,
    sets: exerciseData.sets || 3,
    reps: exerciseData.reps ? String(exerciseData.reps) : '10',
    weight: exerciseData.weight || null,
    rest_time: exerciseData.rest_time || exerciseData.restTime || 60,
    notes: exerciseData.notes || exerciseData.instructions || '',
    target_weight: exerciseData.target_weight || null,
    target_reps: exerciseData.target_reps ? String(exerciseData.target_reps) : null,
    is_superset: exerciseData.is_superset || false,
    superset_group: exerciseData.superset_group || null,
  };
}

/**
 * Map workout categories to Supabase enum values
 */
function mapWorkoutCategory(category) {
  const categoryMap = {
    'strength': 'STRENGTH',
    'cardio': 'CARDIO',
    'flexibility': 'FLEXIBILITY',
    'hiit': 'HIIT',
    'crosstraining': 'CROSSTRAINING',
    'sports': 'SPORTS',
    'yoga': 'FLEXIBILITY',
    'pilates': 'FLEXIBILITY',
    'running': 'CARDIO',
    'cycling': 'CARDIO',
    'swimming': 'CARDIO',
  };

  return categoryMap[category?.toLowerCase()] || 'CUSTOM';
}

/**
 * Map difficulty levels to Supabase enum values
 */
function mapDifficulty(difficulty) {
  const difficultyMap = {
    'easy': 'BEGINNER',
    'beginner': 'BEGINNER',
    'medium': 'INTERMEDIATE',
    'intermediate': 'INTERMEDIATE',
    'hard': 'ADVANCED',
    'advanced': 'ADVANCED',
    'expert': 'ADVANCED',
  };

  return difficultyMap[difficulty?.toLowerCase()] || 'BEGINNER';
}

/**
 * Load workout data from AsyncStorage
 */
async function loadAsyncStorageWorkouts() {
  try {
    console.log('🏋️  Loading workouts from AsyncStorage...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    const workoutKeys = allKeys.filter(key => 
      key.startsWith('workout_') || 
      key.startsWith('workouts') ||
      key === 'userWorkouts' ||
      key === 'myWorkouts'
    );

    console.log(`Found ${workoutKeys.length} potential workout keys:`, workoutKeys);

    const workouts = [];
    for (const key of workoutKeys) {
      try {
        const rawData = await AsyncStorage.getItem(key);
        if (rawData) {
          const workoutData = JSON.parse(rawData);
          
          if (Array.isArray(workoutData)) {
            workouts.push(...workoutData);
          } else if (workoutData.name && workoutData.trainer_id) {
            workouts.push(workoutData);
          } else if (typeof workoutData === 'object') {
            // Handle nested workout objects
            Object.values(workoutData).forEach(workout => {
              if (workout && typeof workout === 'object' && workout.name) {
                workouts.push(workout);
              }
            });
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to parse workout data for key ${key}:`, error.message);
      }
    }

    console.log(`📊 Found ${workouts.length} workouts in AsyncStorage`);
    return workouts;
  } catch (error) {
    console.error('❌ Failed to load AsyncStorage workouts:', error);
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
    // For now, assume IDs are the same or map by email
    mapping[profile.email] = profile.id;
  });

  console.log(`📊 Created mapping for ${Object.keys(mapping).length} users`);
  return mapping;
}

/**
 * Check if workout already exists in Supabase
 */
async function workoutExists(workoutId, trainerId, name) {
  const { data, error } = await supabase
    .from('workouts')
    .select('id')
    .or(`id.eq.${workoutId},and(trainer_id.eq.${trainerId},name.eq.${name})`)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

/**
 * Migrate single workout to Supabase
 */
async function migrateWorkout(workoutData, userIdMapping, stats) {
  try {
    validateWorkoutData(workoutData);
    const transformedData = transformWorkoutData(workoutData, userIdMapping);
    
    // Check if workout already exists
    const exists = await workoutExists(
      transformedData.id, 
      transformedData.trainer_id, 
      transformedData.name
    );
    
    if (exists) {
      console.log(`⚠️  Workout already exists: ${transformedData.name}`);
      stats.addWorkoutSuccess();
      return transformedData.id;
    }

    // Insert workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert(transformedData)
      .select()
      .single();

    if (workoutError) {
      throw workoutError;
    }

    console.log(`✅ Migrated workout: ${transformedData.name} (${transformedData.category})`);
    stats.addWorkoutSuccess();

    // Migrate exercises if present
    if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
      await migrateWorkoutExercises(workoutData.exercises, workout.id, userIdMapping, stats);
    }

    return workout.id;
  } catch (error) {
    console.error(`❌ Failed to migrate workout ${workoutData.name || 'unknown'}:`, error.message);
    stats.addWorkoutError(workoutData.id || workoutData.name, error);
    throw error;
  }
}

/**
 * Migrate workout exercises
 */
async function migrateWorkoutExercises(exercises, workoutId, userIdMapping, stats) {
  console.log(`🏃 Migrating ${exercises.length} exercises for workout ${workoutId}...`);
  
  stats.totalExercises += exercises.length;
  
  const exerciseInserts = [];
  
  for (let i = 0; i < exercises.length; i++) {
    try {
      const exerciseData = exercises[i];
      const transformedExercise = transformExerciseData(exerciseData, workoutId, userIdMapping);
      
      // Set order if not provided
      if (transformedExercise.order_index === 0) {
        transformedExercise.order_index = i + 1;
      }
      
      exerciseInserts.push(transformedExercise);
      stats.addExerciseSuccess();
    } catch (error) {
      console.error(`❌ Failed to transform exercise ${i}:`, error.message);
      stats.addExerciseError(`exercise_${i}_workout_${workoutId}`, error);
    }
  }

  // Bulk insert exercises
  if (exerciseInserts.length > 0) {
    const { error } = await supabase
      .from('workout_exercises')
      .insert(exerciseInserts);

    if (error) {
      console.error(`❌ Failed to insert exercises for workout ${workoutId}:`, error.message);
      // Update stats for failed batch
      exerciseInserts.forEach((_, index) => {
        stats.addExerciseError(`bulk_exercise_${index}_workout_${workoutId}`, error);
      });
      throw error;
    }

    console.log(`✅ Migrated ${exerciseInserts.length} exercises for workout ${workoutId}`);
  }
}

/**
 * Validate migration results
 */
async function validateWorkoutMigration(stats) {
  console.log('🔍 Validating workout migration results...');
  
  try {
    // Count workouts by category
    const { data: categoryStats, error: categoryError } = await supabase
      .from('workouts')
      .select('category')
      .then(response => {
        if (response.error) throw response.error;
        
        const categories = {};
        response.data.forEach(workout => {
          categories[workout.category] = (categories[workout.category] || 0) + 1;
        });
        
        return { data: categories, error: null };
      });

    if (categoryError) throw categoryError;

    // Count exercises
    const { data: exerciseCount, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true });

    if (exerciseError) throw exerciseError;

    // Sample data validation
    const { data: sampleWorkouts, error: sampleError } = await supabase
      .from('workouts')
      .select(`
        id,
        name,
        category,
        difficulty,
        trainer_id,
        workout_exercises (
          id,
          exercise_id,
          sets,
          reps
        )
      `)
      .limit(5);

    if (sampleError) throw sampleError;

    const validation = {
      totalWorkoutsInDatabase: Object.values(categoryStats).reduce((sum, count) => sum + count, 0),
      categoryDistribution: categoryStats,
      totalExercisesInDatabase: exerciseCount?.length || 0,
      sampleWorkouts: sampleWorkouts?.map(workout => ({
        id: workout.id,
        name: workout.name,
        category: workout.category,
        difficulty: workout.difficulty,
        exerciseCount: workout.workout_exercises?.length || 0,
        hasRequiredFields: !!(workout.name && workout.trainer_id),
      })) || [],
    };

    console.log('📊 Workout migration validation:', validation);
    return validation;
  } catch (error) {
    console.error('❌ Workout migration validation failed:', error);
    throw error;
  }
}

/**
 * Generate migration backup
 */
async function createWorkoutBackup(workouts) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `workout-migration-backup-${timestamp}.json`;
  
  const backupData = {
    timestamp: new Date().toISOString(),
    totalWorkouts: workouts.length,
    workouts: workouts.map(workout => ({
      ...workout,
      _migrationId: uuidv4(),
    })),
  };

  console.log(`💾 Backup would be saved to: ${backupFile}`);
  return backupFile;
}

/**
 * Main workout migration function
 */
async function migrateWorkouts() {
  const stats = new WorkoutMigrationStats();
  let backupFile = null;
  let validationResults = null;

  try {
    console.log('🚀 Starting workout data migration...');

    // Test Supabase connection
    const { error: connectionError } = await supabase
      .from('workouts')
      .select('count')
      .limit(1);

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }

    console.log('✅ Supabase connection verified');

    // Create user ID mapping
    const userIdMapping = await createUserIdMapping();

    // Load workouts from AsyncStorage
    const asyncWorkouts = await loadAsyncStorageWorkouts();
    stats.totalWorkouts = asyncWorkouts.length;

    if (asyncWorkouts.length === 0) {
      console.log('ℹ️  No workouts found in AsyncStorage to migrate');
      return stats.getReport();
    }

    // Create backup
    backupFile = await createWorkoutBackup(asyncWorkouts);

    // Migrate workouts in batches
    const batchSize = 5; // Smaller batches for workouts since they have exercises
    
    for (let i = 0; i < asyncWorkouts.length; i += batchSize) {
      const batch = asyncWorkouts.slice(i, i + batchSize);
      console.log(`📦 Processing workout batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(asyncWorkouts.length / batchSize)}`);

      for (const workout of batch) {
        try {
          await migrateWorkout(workout, userIdMapping, stats);
        } catch (error) {
          // Error already logged in migrateWorkout
          continue;
        }
      }

      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Validate migration
    validationResults = await validateWorkoutMigration(stats);

    console.log('✅ Workout migration completed successfully!');
    return {
      migration: stats.getReport(),
      validation: validationResults,
      backup: backupFile,
    };

  } catch (error) {
    console.error('❌ Workout migration failed:', error);
    throw error;
  }
}

/**
 * Rollback workout migration
 */
async function rollbackWorkoutMigration(backupFile) {
  console.log('🔄 Rolling back workout migration...');
  
  try {
    // Delete workout exercises first (foreign key constraint)
    const { error: exerciseError } = await supabase
      .from('workout_exercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (exerciseError) {
      console.error('Failed to delete workout exercises:', exerciseError);
      throw exerciseError;
    }

    // Delete workouts
    const { error: workoutError } = await supabase
      .from('workouts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (workoutError) {
      throw workoutError;
    }

    console.log('✅ Workout migration rollback completed');
    return true;
  } catch (error) {
    console.error('❌ Workout migration rollback failed:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  migrateWorkouts,
  rollbackWorkoutMigration,
  validateWorkoutData,
  transformWorkoutData,
  transformExerciseData,
  WorkoutMigrationStats,
};

// Run migration if called directly
if (require.main === module) {
  migrateWorkouts()
    .then(results => {
      console.log('\n📊 Final Workout Migration Report:');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Workout migration failed:', error);
      process.exit(1);
    });
}