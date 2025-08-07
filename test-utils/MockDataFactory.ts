/**
 * Mock Data Factory for TreinosApp Tests
 * Generates realistic test data for all entities
 */

import { v4 as uuidv4 } from 'uuid';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  user_type: 'personal_trainer' | 'student';
  created_at: string;
  avatar_url?: string;
  phone?: string;
  birth_date?: string;
  goals?: string[];
}

export interface MockWorkout {
  id: string;
  name: string;
  description: string;
  trainer_id: string;
  student_id?: string;
  exercises: MockExercise[];
  created_at: string;
  updated_at: string;
  is_template: boolean;
  tags?: string[];
  estimated_duration?: number;
}

export interface MockExercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups: string[];
  equipment: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  trainer_id?: string;
  video_url?: string;
  thumbnail_url?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rest_time?: number;
  created_at: string;
}

export interface MockProgress {
  id: string;
  student_id: string;
  workout_id: string;
  completed_at: string;
  duration: number;
  exercises_completed: number;
  total_exercises: number;
  notes?: string;
  performance_data?: any;
}

export interface MockConversation {
  id: string;
  trainer_id: string;
  student_id: string;
  created_at: string;
  last_message_at: string;
  unread_count: number;
}

export interface MockMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  read_at?: string;
  message_type: 'text' | 'image' | 'video' | 'workout';
  metadata?: any;
}

export class MockDataFactory {
  private static exerciseNames = [
    'Supino Reto', 'Agachamento', 'Levantamento Terra', 'Desenvolvimento',
    'Remada Baixa', 'Flexão', 'Barra Fixa', 'Mergulho', 'Rosca Direta',
    'Tríceps Testa', 'Abdominais', 'Prancha', 'Burpee', 'Mountain Climber'
  ];

  private static muscleGroups = [
    'peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps',
    'posterior', 'glúteos', 'panturrilha', 'abdomen', 'antebraços'
  ];

  private static equipment = [
    'halteres', 'barra', 'máquina', 'peso_corporal', 'elástico',
    'kettlebell', 'smith', 'cabo', 'medicine_ball'
  ];

  private static names = [
    'Carlos Silva', 'Maria Santos', 'João Oliveira', 'Ana Costa',
    'Pedro Lima', 'Juliana Ferreira', 'Roberto Alves', 'Fernanda Rocha'
  ];

  /**
   * Generate mock user
   */
  static createUser(overrides?: Partial<MockUser>): MockUser {
    const id = uuidv4();
    const name = this.names[Math.floor(Math.random() * this.names.length)];
    const email = `${name.toLowerCase().replace(' ', '.')}+${id.slice(0, 8)}@test.com`;

    return {
      id,
      email,
      name,
      user_type: Math.random() > 0.7 ? 'personal_trainer' : 'student',
      created_at: this.randomDate().toISOString(),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      phone: this.randomPhone(),
      birth_date: this.randomBirthDate().toISOString().split('T')[0],
      goals: this.randomGoals(),
      ...overrides,
    };
  }

  /**
   * Generate mock personal trainer
   */
  static createTrainer(overrides?: Partial<MockUser>): MockUser {
    return this.createUser({
      user_type: 'personal_trainer',
      ...overrides,
    });
  }

  /**
   * Generate mock student
   */
  static createStudent(overrides?: Partial<MockUser>): MockUser {
    return this.createUser({
      user_type: 'student',
      ...overrides,
    });
  }

  /**
   * Generate mock exercise
   */
  static createExercise(trainerId?: string, overrides?: Partial<MockExercise>): MockExercise {
    const name = this.exerciseNames[Math.floor(Math.random() * this.exerciseNames.length)];
    const muscleGroupCount = Math.floor(Math.random() * 3) + 1;
    const selectedMuscleGroups = this.muscleGroups
      .sort(() => 0.5 - Math.random())
      .slice(0, muscleGroupCount);

    return {
      id: uuidv4(),
      name,
      description: `Exercício para trabalhar ${selectedMuscleGroups.join(', ')}`,
      muscle_groups: selectedMuscleGroups,
      equipment: this.equipment[Math.floor(Math.random() * this.equipment.length)],
      difficulty_level: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)] as any,
      trainer_id: trainerId,
      video_url: `https://example.com/videos/${uuidv4()}.mp4`,
      thumbnail_url: `https://example.com/thumbs/${uuidv4()}.jpg`,
      sets: Math.floor(Math.random() * 4) + 2,
      reps: Math.floor(Math.random() * 10) + 8,
      weight: Math.floor(Math.random() * 100) + 20,
      rest_time: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
      created_at: this.randomDate().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate mock workout
   */
  static createWorkout(trainerId: string, studentId?: string, overrides?: Partial<MockWorkout>): MockWorkout {
    const exerciseCount = Math.floor(Math.random() * 6) + 3;
    const exercises = Array.from({ length: exerciseCount }, () => 
      this.createExercise(trainerId)
    );

    const workoutNames = [
      'Treino de Peito e Tríceps',
      'Treino de Costas e Bíceps', 
      'Treino de Pernas',
      'Treino Full Body',
      'Treino de Ombros',
      'Treino HIIT',
      'Treino Funcional'
    ];

    const name = workoutNames[Math.floor(Math.random() * workoutNames.length)];

    return {
      id: uuidv4(),
      name,
      description: `Treino completo focado em ${exercises[0].muscle_groups.join(', ')}`,
      trainer_id: trainerId,
      student_id: studentId,
      exercises,
      created_at: this.randomDate().toISOString(),
      updated_at: this.randomDate().toISOString(),
      is_template: Math.random() > 0.6,
      tags: this.randomTags(),
      estimated_duration: Math.floor(Math.random() * 60) + 30,
      ...overrides,
    };
  }

  /**
   * Generate mock progress entry
   */
  static createProgress(studentId: string, workoutId: string, overrides?: Partial<MockProgress>): MockProgress {
    const totalExercises = Math.floor(Math.random() * 8) + 3;
    const completed = Math.floor(Math.random() * totalExercises) + 1;

    return {
      id: uuidv4(),
      student_id: studentId,
      workout_id: workoutId,
      completed_at: this.randomDate().toISOString(),
      duration: Math.floor(Math.random() * 3600) + 1800, // 30min to 90min
      exercises_completed: completed,
      total_exercises: totalExercises,
      notes: this.randomProgressNotes(),
      performance_data: this.randomPerformanceData(),
      ...overrides,
    };
  }

  /**
   * Generate mock conversation
   */
  static createConversation(trainerId: string, studentId: string, overrides?: Partial<MockConversation>): MockConversation {
    const createdAt = this.randomDate();
    const lastMessageAt = new Date(createdAt.getTime() + Math.random() * 86400000); // Up to 1 day later

    return {
      id: uuidv4(),
      trainer_id: trainerId,
      student_id: studentId,
      created_at: createdAt.toISOString(),
      last_message_at: lastMessageAt.toISOString(),
      unread_count: Math.floor(Math.random() * 5),
      ...overrides,
    };
  }

  /**
   * Generate mock message
   */
  static createMessage(conversationId: string, senderId: string, overrides?: Partial<MockMessage>): MockMessage {
    const messageTemplates = [
      'Como foi o treino hoje?',
      'Conseguiu completar todos os exercícios?',
      'Precisa ajustar alguma carga?',
      'Parabéns pelo progresso!',
      'Vamos focar mais em técnica.',
      'O treino estava pesado hoje.',
      'Senti bem o músculo trabalhando.',
      'Posso aumentar a carga na próxima?'
    ];

    return {
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: senderId,
      content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
      sent_at: this.randomDate().toISOString(),
      read_at: Math.random() > 0.3 ? this.randomDate().toISOString() : undefined,
      message_type: 'text',
      metadata: null,
      ...overrides,
    };
  }

  /**
   * Generate bulk mock data
   */
  static generateBulkData(counts: {
    trainers?: number;
    students?: number;
    workouts?: number;
    exercises?: number;
    progress?: number;
    conversations?: number;
    messages?: number;
  }) {
    const trainers = Array.from({ length: counts.trainers || 5 }, () => this.createTrainer());
    const students = Array.from({ length: counts.students || 20 }, () => this.createStudent());
    
    const exercises = [];
    for (const trainer of trainers) {
      const trainerExercises = Array.from({ length: counts.exercises || 10 }, () => 
        this.createExercise(trainer.id)
      );
      exercises.push(...trainerExercises);
    }

    const workouts = [];
    for (const trainer of trainers) {
      const trainerWorkouts = Array.from({ length: counts.workouts || 8 }, () => {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        return this.createWorkout(trainer.id, Math.random() > 0.3 ? randomStudent.id : undefined);
      });
      workouts.push(...trainerWorkouts);
    }

    const progressEntries = [];
    for (const student of students) {
      const studentProgress = Array.from({ length: counts.progress || 15 }, () => {
        const randomWorkout = workouts[Math.floor(Math.random() * workouts.length)];
        return this.createProgress(student.id, randomWorkout.id);
      });
      progressEntries.push(...studentProgress);
    }

    const conversations = [];
    const messages = [];
    for (const trainer of trainers) {
      const trainerStudents = students.slice(0, Math.floor(Math.random() * 5) + 2);
      for (const student of trainerStudents) {
        const conversation = this.createConversation(trainer.id, student.id);
        conversations.push(conversation);

        const messageCount = counts.messages || 10;
        for (let i = 0; i < messageCount; i++) {
          const senderId = Math.random() > 0.5 ? trainer.id : student.id;
          messages.push(this.createMessage(conversation.id, senderId));
        }
      }
    }

    return {
      trainers,
      students,
      exercises,
      workouts,
      progress: progressEntries,
      conversations,
      messages,
    };
  }

  // Helper methods
  private static randomDate(daysBack: number = 30): Date {
    return new Date(Date.now() - Math.random() * daysBack * 86400000);
  }

  private static randomPhone(): string {
    return `(11) 9${Math.floor(Math.random() * 90000000) + 10000000}`;
  }

  private static randomBirthDate(): Date {
    const minAge = 18;
    const maxAge = 65;
    const age = Math.floor(Math.random() * (maxAge - minAge)) + minAge;
    return new Date(Date.now() - age * 365 * 86400000);
  }

  private static randomGoals(): string[] {
    const allGoals = ['perder_peso', 'ganhar_massa', 'resistencia', 'forca', 'flexibilidade', 'saude_geral'];
    const count = Math.floor(Math.random() * 3) + 1;
    return allGoals.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static randomTags(): string[] {
    const allTags = ['hipertrofia', 'forca', 'resistencia', 'funcional', 'iniciante', 'avancado'];
    const count = Math.floor(Math.random() * 3) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private static randomProgressNotes(): string {
    const notes = [
      'Treino completo, boa execução',
      'Aumentou carga em alguns exercícios',
      'Sentiu dificuldade no último exercício',
      'Excelente desempenho hoje',
      'Precisa melhorar a técnica',
      'Muito motivado durante o treino'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  private static randomPerformanceData(): any {
    return {
      average_heart_rate: Math.floor(Math.random() * 50) + 120,
      max_heart_rate: Math.floor(Math.random() * 30) + 160,
      calories_burned: Math.floor(Math.random() * 300) + 200,
      fatigue_level: Math.floor(Math.random() * 10) + 1,
    };
  }
}

export default MockDataFactory;