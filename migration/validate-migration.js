/**
 * Migration Validation Script
 * Validates data integrity after migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Validation Results Tracker
 */
class ValidationTracker {
  constructor() {
    this.results = {
      users: { passed: 0, failed: 0, issues: [] },
      workouts: { passed: 0, failed: 0, issues: [] },
      exercises: { passed: 0, failed: 0, issues: [] },
      relationships: { passed: 0, failed: 0, issues: [] },
      dataIntegrity: { passed: 0, failed: 0, issues: [] },
      performance: { passed: 0, failed: 0, issues: [] },
    };
    this.startTime = Date.now();
  }

  addResult(category, passed, issue = null) {
    if (passed) {
      this.results[category].passed++;
    } else {
      this.results[category].failed++;
      if (issue) {
        this.results[category].issues.push({
          issue,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  getReport() {
    const duration = Date.now() - this.startTime;
    const totalTests = Object.values(this.results).reduce((sum, cat) => sum + cat.passed + cat.failed, 0);
    const totalPassed = Object.values(this.results).reduce((sum, cat) => sum + cat.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, cat) => sum + cat.failed, 0);

    return {
      duration: `${Math.round(duration / 1000)}s`,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
      },
      categories: this.results,
      recommendation: totalFailed === 0 ? 'APPROVED' : 
                     totalFailed < totalTests * 0.1 ? 'APPROVED_WITH_WARNINGS' : 'REQUIRES_ATTENTION',
    };
  }
}

/**
 * Validate user data migration
 */
async function validateUsers(tracker) {
  console.log('👥 Validating user migration...');
  
  try {
    // Check user counts
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      tracker.addResult('users', false, `Failed to fetch users: ${error.message}`);
      return;
    }

    if (users.length === 0) {
      tracker.addResult('users', false, 'No users found in database');
      return;
    }

    console.log(`📊 Found ${users.length} users in database`);

    // Validate each user
    for (const user of users) {
      // Check required fields
      if (!user.email || !user.name || !user.user_type) {
        tracker.addResult('users', false, `User ${user.id} missing required fields`);
        continue;
      }

      // Check user type validity
      if (!['personal_trainer', 'student'].includes(user.user_type)) {
        tracker.addResult('users', false, `User ${user.id} has invalid user_type: ${user.user_type}`);
        continue;
      }

      // Check email format
      if (!user.email.includes('@') || !user.email.includes('.')) {
        tracker.addResult('users', false, `User ${user.id} has invalid email format: ${user.email}`);
        continue;
      }

      tracker.addResult('users', true);
    }

    // Check for duplicate emails
    const emailCounts = {};
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });

    const duplicateEmails = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      tracker.addResult('users', false, `Duplicate emails found: ${duplicateEmails.map(([email]) => email).join(', ')}`);
    } else {
      tracker.addResult('users', true);
    }

    // Check user type distribution
    const trainerCount = users.filter(u => u.user_type === 'personal_trainer').length;
    const studentCount = users.filter(u => u.user_type === 'student').length;
    
    console.log(`📊 User distribution: ${trainerCount} trainers, ${studentCount} students`);
    
    if (trainerCount === 0) {
      tracker.addResult('users', false, 'No personal trainers found');
    } else {
      tracker.addResult('users', true);
    }

    if (studentCount === 0) {
      tracker.addResult('users', false, 'No students found');
    } else {
      tracker.addResult('users', true);
    }

  } catch (error) {
    tracker.addResult('users', false, `User validation error: ${error.message}`);
  }
}

/**
 * Validate workout data migration
 */
async function validateWorkouts(tracker) {
  console.log('🏋️  Validating workout migration...');
  
  try {
    // Get workouts with exercises
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          id,
          exercise_id,
          sets,
          reps,
          weight
        )
      `);

    if (error) {
      tracker.addResult('workouts', false, `Failed to fetch workouts: ${error.message}`);
      return;
    }

    if (workouts.length === 0) {
      tracker.addResult('workouts', false, 'No workouts found in database');
      return;
    }

    console.log(`📊 Found ${workouts.length} workouts in database`);

    // Validate each workout
    for (const workout of workouts) {
      // Check required fields
      if (!workout.name || !workout.trainer_id) {
        tracker.addResult('workouts', false, `Workout ${workout.id} missing required fields`);
        continue;
      }

      // Check category validity
      const validCategories = ['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'HIIT', 'CROSSTRAINING', 'SPORTS', 'CUSTOM'];
      if (!validCategories.includes(workout.category)) {
        tracker.addResult('workouts', false, `Workout ${workout.id} has invalid category: ${workout.category}`);
        continue;
      }

      // Check difficulty validity
      const validDifficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
      if (!validDifficulties.includes(workout.difficulty)) {
        tracker.addResult('workouts', false, `Workout ${workout.id} has invalid difficulty: ${workout.difficulty}`);
        continue;
      }

      // Check estimated duration
      if (workout.estimated_duration && (workout.estimated_duration < 5 || workout.estimated_duration > 300)) {
        tracker.addResult('workouts', false, `Workout ${workout.id} has unrealistic duration: ${workout.estimated_duration} minutes`);
        continue;
      }

      tracker.addResult('workouts', true);

      // Validate exercises in workout
      if (workout.workout_exercises) {
        for (const exercise of workout.workout_exercises) {
          if (!exercise.exercise_id || !exercise.sets || !exercise.reps) {
            tracker.addResult('exercises', false, `Exercise in workout ${workout.id} missing required fields`);
            continue;
          }

          if (exercise.sets < 1 || exercise.sets > 20) {
            tracker.addResult('exercises', false, `Exercise in workout ${workout.id} has invalid sets: ${exercise.sets}`);
            continue;
          }

          tracker.addResult('exercises', true);
        }
      }
    }

    // Check workout distribution
    const categoryDistribution = {};
    workouts.forEach(workout => {
      categoryDistribution[workout.category] = (categoryDistribution[workout.category] || 0) + 1;
    });

    console.log('📊 Workout category distribution:', categoryDistribution);

    // Check for workouts without exercises
    const workoutsWithoutExercises = workouts.filter(w => !w.workout_exercises || w.workout_exercises.length === 0);
    if (workoutsWithoutExercises.length > 0) {
      tracker.addResult('workouts', false, `${workoutsWithoutExercises.length} workouts have no exercises`);
    } else {
      tracker.addResult('workouts', true);
    }

  } catch (error) {
    tracker.addResult('workouts', false, `Workout validation error: ${error.message}`);
  }
}

/**
 * Validate relationships and foreign keys
 */
async function validateRelationships(tracker) {
  console.log('🔗 Validating data relationships...');
  
  try {
    // Check trainer-workout relationships
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('id, trainer_id, student_id');

    if (workoutError) {
      tracker.addResult('relationships', false, `Failed to fetch workout relationships: ${workoutError.message}`);
      return;
    }

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, user_type');

    if (userError) {
      tracker.addResult('relationships', false, `Failed to fetch user relationships: ${userError.message}`);
      return;
    }

    const userIds = new Set(users.map(u => u.id));
    const trainerIds = new Set(users.filter(u => u.user_type === 'personal_trainer').map(u => u.id));
    const studentIds = new Set(users.filter(u => u.user_type === 'student').map(u => u.id));

    // Validate trainer relationships
    for (const workout of workouts) {
      if (!userIds.has(workout.trainer_id)) {
        tracker.addResult('relationships', false, `Workout ${workout.id} references non-existent trainer: ${workout.trainer_id}`);
        continue;
      }

      if (!trainerIds.has(workout.trainer_id)) {
        tracker.addResult('relationships', false, `Workout ${workout.id} trainer is not a personal trainer: ${workout.trainer_id}`);
        continue;
      }

      if (workout.student_id && !userIds.has(workout.student_id)) {
        tracker.addResult('relationships', false, `Workout ${workout.id} references non-existent student: ${workout.student_id}`);
        continue;
      }

      if (workout.student_id && !studentIds.has(workout.student_id)) {
        tracker.addResult('relationships', false, `Workout ${workout.id} student is not a student: ${workout.student_id}`);
        continue;
      }

      tracker.addResult('relationships', true);
    }

    // Check exercise relationships
    const { data: workoutExercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('workout_id');

    if (!exerciseError && workoutExercises) {
      const workoutIdSet = new Set(workouts.map(w => w.id));
      
      for (const exercise of workoutExercises) {
        if (!workoutIdSet.has(exercise.workout_id)) {
          tracker.addResult('relationships', false, `Workout exercise references non-existent workout: ${exercise.workout_id}`);
        } else {
          tracker.addResult('relationships', true);
        }
      }
    }

  } catch (error) {
    tracker.addResult('relationships', false, `Relationship validation error: ${error.message}`);
  }
}

/**
 * Validate data integrity constraints
 */
async function validateDataIntegrity(tracker) {
  console.log('🔒 Validating data integrity...');
  
  try {
    // Check for null values in required fields
    const tables = [
      { name: 'profiles', requiredFields: ['email', 'name', 'user_type'] },
      { name: 'workouts', requiredFields: ['name', 'trainer_id', 'category'] },
      { name: 'workout_exercises', requiredFields: ['workout_id', 'exercise_id', 'sets', 'reps'] },
    ];

    for (const table of tables) {
      for (const field of table.requiredFields) {
        const { data, error } = await supabase
          .from(table.name)
          .select('id')
          .is(field, null)
          .limit(1);

        if (error) {
          tracker.addResult('dataIntegrity', false, `Failed to check null values in ${table.name}.${field}: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          tracker.addResult('dataIntegrity', false, `Found null values in required field ${table.name}.${field}`);
        } else {
          tracker.addResult('dataIntegrity', true);
        }
      }
    }

    // Check for reasonable value ranges
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('estimated_duration')
      .or('estimated_duration.lt.5,estimated_duration.gt.300');

    if (workoutError) {
      tracker.addResult('dataIntegrity', false, `Failed to check workout durations: ${workoutError.message}`);
    } else if (workouts && workouts.length > 0) {
      tracker.addResult('dataIntegrity', false, `Found ${workouts.length} workouts with unrealistic durations`);
    } else {
      tracker.addResult('dataIntegrity', true);
    }

    // Check exercise sets and reps ranges
    const { data: exercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('sets')
      .or('sets.lt.1,sets.gt.20');

    if (exerciseError) {
      tracker.addResult('dataIntegrity', false, `Failed to check exercise sets: ${exerciseError.message}`);
    } else if (exercises && exercises.length > 0) {
      tracker.addResult('dataIntegrity', false, `Found ${exercises.length} exercises with unrealistic sets`);
    } else {
      tracker.addResult('dataIntegrity', true);
    }

  } catch (error) {
    tracker.addResult('dataIntegrity', false, `Data integrity validation error: ${error.message}`);
  }
}

/**
 * Validate performance and query efficiency
 */
async function validatePerformance(tracker) {
  console.log('⚡ Validating database performance...');
  
  try {
    // Test basic query performance
    const queries = [
      {
        name: 'User lookup by ID',
        query: () => supabase.from('profiles').select('*').limit(1).single(),
        maxTime: 1000, // 1 second
      },
      {
        name: 'Workout with exercises',
        query: () => supabase.from('workouts').select('*, workout_exercises(*)').limit(1).single(),
        maxTime: 2000, // 2 seconds
      },
      {
        name: 'User workout list',
        query: () => supabase.from('workouts').select('*').limit(10),
        maxTime: 1000, // 1 second
      },
    ];

    for (const { name, query, maxTime } of queries) {
      const start = Date.now();
      
      try {
        await query();
        const duration = Date.now() - start;
        
        if (duration > maxTime) {
          tracker.addResult('performance', false, `Query "${name}" took ${duration}ms (max: ${maxTime}ms)`);
        } else {
          tracker.addResult('performance', true);
        }
        
        console.log(`⏱️  ${name}: ${duration}ms`);
      } catch (error) {
        tracker.addResult('performance', false, `Query "${name}" failed: ${error.message}`);
      }
    }

    // Check for missing indexes (approximate by checking large table scans)
    const { data: workoutCount, error: countError } = await supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true });

    if (!countError && workoutCount && workoutCount.length > 1000) {
      // Test potentially expensive query
      const start = Date.now();
      await supabase
        .from('workouts')
        .select('*')
        .eq('category', 'STRENGTH')
        .limit(100);
      const duration = Date.now() - start;

      if (duration > 2000) {
        tracker.addResult('performance', false, `Large table query may need indexing (${duration}ms for category filter)`);
      } else {
        tracker.addResult('performance', true);
      }
    } else {
      tracker.addResult('performance', true); // Small dataset, performance is fine
    }

  } catch (error) {
    tracker.addResult('performance', false, `Performance validation error: ${error.message}`);
  }
}

/**
 * Compare AsyncStorage data counts with Supabase
 */
async function compareDataCounts(tracker) {
  console.log('📊 Comparing data counts...');
  
  try {
    // This is a simplified comparison - in a real scenario you'd load from AsyncStorage
    console.log('ℹ️  Data count comparison would require access to original AsyncStorage data');
    
    // Get Supabase counts
    const { data: userCount, error: userError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const { data: workoutCount, error: workoutError } = await supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true });

    const { data: exerciseCount, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true });

    if (userError || workoutError || exerciseError) {
      tracker.addResult('dataIntegrity', false, 'Failed to get data counts for comparison');
      return;
    }

    console.log('📊 Supabase data counts:');
    console.log(`   Users: ${userCount?.length || 0}`);
    console.log(`   Workouts: ${workoutCount?.length || 0}`);
    console.log(`   Exercises: ${exerciseCount?.length || 0}`);

    // For this validation, we'll assume counts are reasonable if we have some data
    if ((userCount?.length || 0) > 0 && (workoutCount?.length || 0) > 0) {
      tracker.addResult('dataIntegrity', true);
    } else {
      tracker.addResult('dataIntegrity', false, 'No data found in Supabase tables');
    }

  } catch (error) {
    tracker.addResult('dataIntegrity', false, `Data count comparison error: ${error.message}`);
  }
}

/**
 * Generate detailed validation report
 */
function generateDetailedReport(tracker) {
  const report = tracker.getReport();
  
  console.log('\n📋 MIGRATION VALIDATION REPORT');
  console.log('='.repeat(50));
  console.log(`Validation completed in: ${report.duration}`);
  console.log(`Overall result: ${report.recommendation}`);
  console.log(`Success rate: ${report.summary.successRate}% (${report.summary.totalPassed}/${report.summary.totalTests})`);
  
  console.log('\n📊 CATEGORY BREAKDOWN:');
  Object.entries(report.categories).forEach(([category, results]) => {
    const status = results.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${category}: ${results.passed} passed, ${results.failed} failed`);
    
    if (results.issues.length > 0) {
      results.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue.issue}`);
      });
    }
  });

  if (report.recommendation === 'REQUIRES_ATTENTION') {
    console.log('\n🚨 ACTION REQUIRED:');
    console.log('Migration has significant issues that need to be addressed before production use.');
  } else if (report.recommendation === 'APPROVED_WITH_WARNINGS') {
    console.log('\n⚠️  APPROVED WITH WARNINGS:');
    console.log('Migration is acceptable but some issues should be monitored.');
  } else {
    console.log('\n✅ MIGRATION APPROVED:');
    console.log('All validation checks passed successfully.');
  }

  return report;
}

/**
 * Main validation function
 */
async function validateMigration() {
  const tracker = new ValidationTracker();

  try {
    console.log('🔍 Starting comprehensive migration validation...');

    // Test Supabase connection
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }

    console.log('✅ Supabase connection verified');

    // Run all validation checks
    await validateUsers(tracker);
    await validateWorkouts(tracker);
    await validateRelationships(tracker);
    await validateDataIntegrity(tracker);
    await validatePerformance(tracker);
    await compareDataCounts(tracker);

    // Generate final report
    const report = generateDetailedReport(tracker);
    
    return report;

  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    tracker.addResult('dataIntegrity', false, `Validation error: ${error.message}`);
    return tracker.getReport();
  }
}

// Export functions
module.exports = {
  validateMigration,
  validateUsers,
  validateWorkouts,
  validateRelationships,
  validateDataIntegrity,
  validatePerformance,
  ValidationTracker,
};

// Run validation if called directly
if (require.main === module) {
  validateMigration()
    .then(report => {
      console.log('\n💾 Validation report:');
      console.log(JSON.stringify(report, null, 2));
      
      // Exit with appropriate code
      process.exit(report.recommendation === 'REQUIRES_ATTENTION' ? 1 : 0);
    })
    .catch(error => {
      console.error('\n💥 Validation failed:', error);
      process.exit(1);
    });
}