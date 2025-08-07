// Biblioteca de Exercícios - FitPro
// Biblioteca completa com centenas de exercícios

export interface Exercise {
  id: string;
  name: string;
  name_pt?: string;
  category: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  instructions_pt?: string;
  video_url?: string;
  image_url?: string;
  variations?: string[];
  tips?: string[];
  muscle_primary: string;
  muscle_secondary?: string[];
}

export interface ExerciseCategory {
  id: string;
  name: string;
  name_pt: string;
  icon: string;
  color: string;
  exercises: Exercise[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  name_pt: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  exercises: WorkoutExercise[];
  target_muscles: string[];
  equipment_needed: string[];
  calories_burn?: number;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  rest: string;
  tempo?: string;
  weight?: number;
  rpe?: number;
  notes?: string;
  superset_with?: string;
}

// BIBLIOTECA COMPLETA DE EXERCÍCIOS

export const LOCAL_EXERCISES: Exercise[] = [
  // PEITO - CHEST
  {
    id: 'bench-press',
    name: 'Bench Press',
    name_pt: 'Supino Reto',
    category: 'chest',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: 'Lie on bench, grip barbell, lower to chest, press up',
    instructions_pt: 'Deite no banco, segure a barra com pegada um pouco mais aberta que a largura dos ombros. Abaixe a barra até tocar levemente o peito e empurre para cima.',
    muscle_primary: 'chest',
    muscle_secondary: ['triceps', 'shoulders'],
    tips: ['Mantenha os pés firmes no chão', 'Controle a descida da barra', 'Mantenha as escápulas retraídas']
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    name_pt: 'Supino Inclinado',
    category: 'chest',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: 'Lie on inclined bench, press barbell up and down',
    instructions_pt: 'Deite no banco inclinado (30-45°), segure a barra e pressione para cima e para baixo.',
    muscle_primary: 'chest',
    muscle_secondary: ['triceps', 'shoulders'],
    tips: ['Mantenha o peito erguido', 'Controle o movimento', 'Foque na parte superior do peito']
  },
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    name_pt: 'Supino Declinado',
    category: 'chest',
    muscle_groups: ['chest', 'triceps'],
    equipment: ['barbell', 'bench'],
    difficulty: 'advanced',
    instructions: 'Lie on decline bench, press barbell up and down',
    instructions_pt: 'Deite no banco declinado, segure a barra e pressione para cima e para baixo.',
    muscle_primary: 'chest',
    muscle_secondary: ['triceps'],
    tips: ['Mantenha a segurança', 'Controle o movimento', 'Foque na parte inferior do peito']
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Press',
    name_pt: 'Supino com Halteres',
    category: 'chest',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: 'Lie on bench, press dumbbells up and down',
    instructions_pt: 'Deite no banco, segure os halteres e pressione para cima e para baixo.',
    muscle_primary: 'chest',
    muscle_secondary: ['triceps', 'shoulders'],
    tips: ['Mantenha os halteres alinhados', 'Controle o movimento', 'Maior amplitude de movimento']
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    name_pt: 'Flexão de Braço',
    category: 'chest',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: 'Plank position, lower body, push up',
    instructions_pt: 'Posição de prancha, abaixe o corpo até quase tocar o chão e empurre para cima.',
    muscle_primary: 'chest',
    muscle_secondary: ['triceps', 'shoulders'],
    tips: ['Mantenha o corpo reto', 'Cotovelos próximos ao corpo', 'Respire controladamente']
  },
  {
    id: 'dips',
    name: 'Dips',
    name_pt: 'Paralelas',
    category: 'chest',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['dip bars'],
    difficulty: 'advanced',
    instructions: 'Hold dip bars, lower body, push up',
    instructions_pt: 'Segure as barras paralelas, abaixe o corpo e empurre para cima.',
    muscle_primary: 'chest',
    muscle_secondary: ['triceps', 'shoulders'],
    tips: ['Mantenha o peito erguido', 'Controle a descida', 'Foque no peito']
  },
  {
    id: 'cable-flyes',
    name: 'Cable Flyes',
    name_pt: 'Crucifixo na Polia',
    category: 'chest',
    muscle_groups: ['chest'],
    equipment: ['cable machine'],
    difficulty: 'intermediate',
    instructions: 'Stand between cables, bring arms together in arc motion',
    instructions_pt: 'Fique entre as polias, traga os braços juntos em movimento de arco.',
    muscle_primary: 'chest',
    tips: ['Mantenha os cotovelos levemente flexionados', 'Controle o movimento', 'Foque no peito']
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    name_pt: 'Crucifixo com Halteres',
    category: 'chest',
    muscle_groups: ['chest'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: 'Lie on bench, bring dumbbells together in arc motion',
    instructions_pt: 'Deite no banco, traga os halteres juntos em movimento de arco.',
    muscle_primary: 'chest',
    tips: ['Mantenha os cotovelos levemente flexionados', 'Controle o movimento', 'Não trave os cotovelos']
  },

  // COSTAS - BACK
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    name_pt: 'Barra Fixa',
    category: 'back',
    muscle_groups: ['lats', 'biceps', 'rhomboids'],
    equipment: ['pull-up bar'],
    difficulty: 'advanced',
    instructions: 'Hang from bar, pull body up until chin over bar',
    instructions_pt: 'Segure a barra com pegada pronada. Puxe o corpo para cima até o queixo passar da barra.',
    muscle_primary: 'lats',
    muscle_secondary: ['biceps', 'rhomboids'],
    tips: ['Mantenha o corpo reto', 'Evite balançar', 'Controle a descida']
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    name_pt: 'Puxada na Frente',
    category: 'back',
    muscle_groups: ['lats', 'biceps'],
    equipment: ['cable machine'],
    difficulty: 'beginner',
    instructions: 'Sit at machine, pull bar to chest',
    instructions_pt: 'Sente na máquina e segure a barra. Puxe a barra até o peito.',
    muscle_primary: 'lats',
    muscle_secondary: ['biceps'],
    tips: ['Mantenha o peito erguido', 'Puxe com as costas', 'Controle o retorno']
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    name_pt: 'Levantamento Terra',
    category: 'back',
    muscle_groups: ['hamstrings', 'glutes', 'lower back'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    instructions: 'Stand over barbell, bend down, grip bar, stand up straight',
    instructions_pt: 'Em pé sobre a barra, agache e segure a barra. Mantenha as costas retas e levante.',
    muscle_primary: 'hamstrings',
    muscle_secondary: ['glutes', 'lower back'],
    tips: ['Mantenha as costas sempre retas', 'A barra deve ficar próxima às canelas', 'Empurre o chão com os pés']
  },
  {
    id: 'barbell-rows',
    name: 'Barbell Rows',
    name_pt: 'Remada com Barra',
    category: 'back',
    muscle_groups: ['lats', 'rhomboids', 'biceps'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: 'Bend over, pull barbell to lower chest',
    instructions_pt: 'Incline o tronco, puxe a barra até o peito inferior.',
    muscle_primary: 'lats',
    muscle_secondary: ['rhomboids', 'biceps'],
    tips: ['Mantenha as costas retas', 'Puxe com as costas', 'Controle o movimento']
  },
  {
    id: 'dumbbell-rows',
    name: 'Dumbbell Rows',
    name_pt: 'Remada com Halteres',
    category: 'back',
    muscle_groups: ['lats', 'rhomboids', 'biceps'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'beginner',
    instructions: 'Bend over bench, pull dumbbell to hip',
    instructions_pt: 'Incline sobre o banco, puxe o halter até o quadril.',
    muscle_primary: 'lats',
    muscle_secondary: ['rhomboids', 'biceps'],
    tips: ['Mantenha as costas retas', 'Puxe com as costas', 'Controle o movimento']
  },
  {
    id: 't-bar-rows',
    name: 'T-Bar Rows',
    name_pt: 'Remada T-Bar',
    category: 'back',
    muscle_groups: ['lats', 'rhomboids', 'biceps'],
    equipment: ['t-bar machine'],
    difficulty: 'intermediate',
    instructions: 'Stand over T-bar, pull handles to chest',
    instructions_pt: 'Fique sobre a T-bar, puxe as alças até o peito.',
    muscle_primary: 'lats',
    muscle_secondary: ['rhomboids', 'biceps'],
    tips: ['Mantenha as costas retas', 'Puxe com as costas', 'Controle o movimento']
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    name_pt: 'Puxada para o Rosto',
    category: 'back',
    muscle_groups: ['rear deltoids', 'rhomboids'],
    equipment: ['cable machine'],
    difficulty: 'beginner',
    instructions: 'Pull cable to face, retract scapula',
    instructions_pt: 'Puxe o cabo para o rosto, retraia as escápulas.',
    muscle_primary: 'rear deltoids',
    muscle_secondary: ['rhomboids'],
    tips: ['Mantenha os cotovelos altos', 'Retraia as escápulas', 'Controle o movimento']
  },

  // PERNAS - LEGS
  {
    id: 'squat',
    name: 'Squat',
    name_pt: 'Agachamento',
    category: 'legs',
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: 'Stand with feet shoulder-width apart, squat down, stand up',
    instructions_pt: 'Em pé, pés na largura dos ombros. Agache como se fosse sentar, mantendo o peito erguido.',
    muscle_primary: 'quadriceps',
    muscle_secondary: ['glutes', 'hamstrings'],
    tips: ['Mantenha o peito erguido', 'Joelhos alinhados com os pés', 'Desça até as coxas ficarem paralelas ao chão']
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    name_pt: 'Leg Press',
    category: 'legs',
    muscle_groups: ['quadriceps', 'glutes'],
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: 'Sit on machine, press platform away',
    instructions_pt: 'Sente na máquina, pressione a plataforma para longe.',
    muscle_primary: 'quadriceps',
    muscle_secondary: ['glutes'],
    tips: ['Mantenha as costas apoiadas', 'Controle o movimento', 'Não trave os joelhos']
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    name_pt: 'Extensão de Pernas',
    category: 'legs',
    muscle_groups: ['quadriceps'],
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: 'Sit on machine, extend legs',
    instructions_pt: 'Sente na máquina com as costas apoiadas. Estenda as pernas até ficarem retas.',
    muscle_primary: 'quadriceps',
    tips: ['Mantenha as costas apoiadas', 'Controle o movimento', 'Não trave os joelhos']
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    name_pt: 'Flexão de Pernas',
    category: 'legs',
    muscle_groups: ['hamstrings'],
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: 'Lie on machine, curl legs',
    instructions_pt: 'Deite na máquina, flexione as pernas.',
    muscle_primary: 'hamstrings',
    tips: ['Mantenha o quadril apoiado', 'Controle o movimento', 'Foque nos isquiotibiais']
  },
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    name_pt: 'Elevação de Panturrilha',
    category: 'legs',
    muscle_groups: ['calves'],
    equipment: ['machine'],
    difficulty: 'beginner',
    instructions: 'Stand on machine, raise heels',
    instructions_pt: 'Fique em pé na máquina, eleve os calcanhares.',
    muscle_primary: 'calves',
    tips: ['Mantenha o controle', 'Faça o movimento completo', 'Controle a descida']
  },
  {
    id: 'lunges',
    name: 'Lunges',
    name_pt: 'Afundo',
    category: 'legs',
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['dumbbells'],
    difficulty: 'intermediate',
    instructions: 'Step forward, lower body, return to start',
    instructions_pt: 'Dê um passo à frente, abaixe o corpo e retorne à posição inicial.',
    muscle_primary: 'quadriceps',
    muscle_secondary: ['glutes', 'hamstrings'],
    tips: ['Mantenha o tronco ereto', 'Joelho não deve passar da ponta do pé', 'Controle o movimento']
  },

  // OMBROS - SHOULDERS
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    name_pt: 'Desenvolvimento',
    category: 'shoulders',
    muscle_groups: ['shoulders', 'triceps'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: 'Hold barbell at shoulder level, press overhead',
    instructions_pt: 'Segure a barra na altura dos ombros. Pressione a barra para cima.',
    muscle_primary: 'shoulders',
    muscle_secondary: ['triceps'],
    tips: ['Mantenha o core contraído', 'Não arquee as costas', 'Controle a descida']
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Shoulder Press',
    name_pt: 'Desenvolvimento com Halteres',
    category: 'shoulders',
    muscle_groups: ['shoulders', 'triceps'],
    equipment: ['dumbbells'],
    difficulty: 'intermediate',
    instructions: 'Hold dumbbells at shoulders, press overhead',
    instructions_pt: 'Segure os halteres na altura dos ombros. Pressione para cima.',
    muscle_primary: 'shoulders',
    muscle_secondary: ['triceps'],
    tips: ['Mantenha o core contraído', 'Controle o movimento', 'Respire adequadamente']
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    name_pt: 'Elevação Lateral',
    category: 'shoulders',
    muscle_groups: ['shoulders'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: 'Hold dumbbells, raise arms to sides',
    instructions_pt: 'Segure os halteres, eleve os braços para os lados.',
    muscle_primary: 'shoulders',
    tips: ['Mantenha os cotovelos levemente flexionados', 'Controle o movimento', 'Não balance o corpo']
  },
  {
    id: 'front-raises',
    name: 'Front Raises',
    name_pt: 'Elevação Frontal',
    category: 'shoulders',
    muscle_groups: ['shoulders'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: 'Hold dumbbells, raise arms to front',
    instructions_pt: 'Segure os halteres, eleve os braços para a frente.',
    muscle_primary: 'shoulders',
    tips: ['Mantenha os cotovelos levemente flexionados', 'Controle o movimento', 'Não balance o corpo']
  },
  {
    id: 'rear-delt-flyes',
    name: 'Rear Delt Flyes',
    name_pt: 'Crucifixo Invertido',
    category: 'shoulders',
    muscle_groups: ['rear deltoids'],
    equipment: ['dumbbells'],
    difficulty: 'intermediate',
    instructions: 'Bend over, raise dumbbells to sides',
    instructions_pt: 'Incline o tronco, eleve os halteres para os lados.',
    muscle_primary: 'rear deltoids',
    tips: ['Mantenha as costas retas', 'Controle o movimento', 'Foque na parte posterior dos ombros']
  },

  // BRAÇOS - ARMS
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    name_pt: 'Rosca Direta',
    category: 'arms',
    muscle_groups: ['biceps'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: 'Hold dumbbells, curl up, lower down',
    instructions_pt: 'Em pé, segure os halteres ao lado do corpo. Flexione os cotovelos levando os halteres aos ombros.',
    muscle_primary: 'biceps',
    tips: ['Mantenha os cotovelos fixos', 'Não balance o corpo', 'Controle o movimento']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    name_pt: 'Rosca Martelo',
    category: 'arms',
    muscle_groups: ['biceps', 'forearms'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: 'Hold dumbbells in hammer grip, curl up',
    instructions_pt: 'Segure os halteres em pegada de martelo, flexione os cotovelos.',
    muscle_primary: 'biceps',
    muscle_secondary: ['forearms'],
    tips: ['Mantenha os cotovelos fixos', 'Controle o movimento', 'Foque no bíceps']
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    name_pt: 'Mergulho para Tríceps',
    category: 'arms',
    muscle_groups: ['triceps'],
    equipment: ['dip bars'],
    difficulty: 'advanced',
    instructions: 'Hold dip bars, lower body, push up',
    instructions_pt: 'Segure as barras paralelas, abaixe o corpo e empurre para cima.',
    muscle_primary: 'triceps',
    tips: ['Mantenha os cotovelos próximos ao corpo', 'Controle a descida', 'Foque no tríceps']
  },
  {
    id: 'tricep-pushdowns',
    name: 'Tricep Pushdowns',
    name_pt: 'Extensão de Tríceps na Polia',
    category: 'arms',
    muscle_groups: ['triceps'],
    equipment: ['cable machine'],
    difficulty: 'beginner',
    instructions: 'Stand at cable machine, push bar down',
    instructions_pt: 'Fique na máquina de polia, empurre a barra para baixo.',
    muscle_primary: 'triceps',
    tips: ['Mantenha os cotovelos fixos', 'Controle o movimento', 'Foque no tríceps']
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    name_pt: 'Extensão de Tríceps com Barra',
    category: 'arms',
    muscle_groups: ['triceps'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: 'Lie on bench, lower bar to forehead, extend',
    instructions_pt: 'Deite no banco, abaixe a barra até a testa e estenda.',
    muscle_primary: 'triceps',
    tips: ['Mantenha os cotovelos fixos', 'Controle o movimento', 'Não toque a testa']
  },

  // ABDÔMEN - CORE
  {
    id: 'crunches',
    name: 'Crunches',
    name_pt: 'Abdominal',
    category: 'core',
    muscle_groups: ['abs'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: 'Lie on back, curl upper body',
    instructions_pt: 'Deite de costas, enrole a parte superior do corpo.',
    muscle_primary: 'abs',
    tips: ['Mantenha os pés no chão', 'Controle o movimento', 'Respire adequadamente']
  },
  {
    id: 'plank',
    name: 'Plank',
    name_pt: 'Prancha',
    category: 'core',
    muscle_groups: ['abs', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: 'Hold plank position',
    instructions_pt: 'Mantenha a posição de prancha.',
    muscle_primary: 'abs',
    muscle_secondary: ['core'],
    tips: ['Mantenha o corpo reto', 'Contraia o core', 'Respire adequadamente']
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    name_pt: 'Torção Russa',
    category: 'core',
    muscle_groups: ['abs', 'obliques'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: 'Sit with feet up, twist torso side to side',
    instructions_pt: 'Sente com os pés elevados, gire o tronco de um lado para o outro.',
    muscle_primary: 'abs',
    muscle_secondary: ['obliques'],
    tips: ['Mantenha o equilíbrio', 'Controle o movimento', 'Foque nos oblíquios']
  },
  {
    id: 'leg-raises',
    name: 'Leg Raises',
    name_pt: 'Elevação de Pernas',
    category: 'core',
    muscle_groups: ['abs'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: 'Lie on back, raise legs up and down',
    instructions_pt: 'Deite de costas, eleve as pernas para cima e para baixo.',
    muscle_primary: 'abs',
    tips: ['Mantenha as costas no chão', 'Controle o movimento', 'Não balance as pernas']
  }
];

// Categorias de exercícios
export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    id: 'chest',
    name: 'Chest',
    name_pt: 'Peito',
    icon: '💪',
    color: 'bg-red-500',
    exercises: LOCAL_EXERCISES.filter(e => e.category === 'chest')
  },
  {
    id: 'back',
    name: 'Back',
    name_pt: 'Costas',
    icon: '🏋️',
    color: 'bg-blue-500',
    exercises: LOCAL_EXERCISES.filter(e => e.category === 'back')
  },
  {
    id: 'legs',
    name: 'Legs',
    name_pt: 'Pernas',
    icon: '🦵',
    color: 'bg-green-500',
    exercises: LOCAL_EXERCISES.filter(e => e.category === 'legs')
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    name_pt: 'Ombros',
    icon: '👤',
    color: 'bg-purple-500',
    exercises: LOCAL_EXERCISES.filter(e => e.category === 'shoulders')
  },
  {
    id: 'arms',
    name: 'Arms',
    name_pt: 'Braços',
    icon: '💪',
    color: 'bg-yellow-500',
    exercises: LOCAL_EXERCISES.filter(e => e.category === 'arms')
  },
  {
    id: 'core',
    name: 'Core',
    name_pt: 'Abdômen',
    icon: '🔥',
    color: 'bg-orange-500',
    exercises: LOCAL_EXERCISES.filter(e => e.category === 'core')
  }
];

// Templates de treino pré-definidos
export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'fullbody-beginner',
    name: 'Full Body Beginner',
    name_pt: 'Full Body Iniciante',
    description: 'Treino completo para iniciantes, trabalhando todos os grupos musculares',
    difficulty: 'beginner',
    duration: 45,
    target_muscles: ['chest', 'back', 'legs', 'shoulders', 'arms'],
    equipment_needed: ['barbell', 'bench', 'dumbbells'],
    calories_burn: 300,
    exercises: [
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'squat')!,
        sets: 3,
        reps: '10-12',
        rest: '90s',
        notes: 'Foco na técnica'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'bench-press')!,
        sets: 3,
        reps: '8-10',
        rest: '90s',
        notes: 'Controle a descida'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'lat-pulldown')!,
        sets: 3,
        reps: '10-12',
        rest: '60s',
        notes: 'Puxe com as costas'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'overhead-press')!,
        sets: 3,
        reps: '8-10',
        rest: '60s',
        notes: 'Mantenha o core contraído'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'bicep-curl')!,
        sets: 2,
        reps: '12-15',
        rest: '45s',
        notes: 'Controle o movimento'
      }
    ]
  },
  {
    id: 'push-day',
    name: 'Push Day',
    name_pt: 'Dia de Empurrar',
    description: 'Treino focado em exercícios de empurrar (peito, ombros, tríceps)',
    difficulty: 'intermediate',
    duration: 60,
    target_muscles: ['chest', 'shoulders', 'triceps'],
    equipment_needed: ['barbell', 'bench', 'dumbbells'],
    calories_burn: 400,
    exercises: [
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'bench-press')!,
        sets: 4,
        reps: '6-8',
        rest: '120s',
        notes: 'Foco na força'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'overhead-press')!,
        sets: 3,
        reps: '8-10',
        rest: '90s',
        notes: 'Mantenha a postura'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'incline-bench-press')!,
        sets: 3,
        reps: '10-12',
        rest: '90s',
        notes: 'Incline 30 graus'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'lateral-raises')!,
        sets: 3,
        reps: '12-15',
        rest: '60s',
        notes: 'Controle o movimento'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'tricep-pushdowns')!,
        sets: 3,
        reps: '12-15',
        rest: '60s',
        notes: 'Foque no tríceps'
      }
    ]
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    name_pt: 'Dia de Puxar',
    description: 'Treino focado em exercícios de puxar (costas, bíceps)',
    difficulty: 'intermediate',
    duration: 60,
    target_muscles: ['back', 'biceps'],
    equipment_needed: ['barbell', 'dumbbells', 'cable machine'],
    calories_burn: 400,
    exercises: [
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'deadlift')!,
        sets: 4,
        reps: '6-8',
        rest: '120s',
        notes: 'Foco na técnica'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'pull-ups')!,
        sets: 3,
        reps: '8-10',
        rest: '90s',
        notes: 'Controle a descida'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'barbell-rows')!,
        sets: 3,
        reps: '10-12',
        rest: '90s',
        notes: 'Puxe com as costas'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'face-pulls')!,
        sets: 3,
        reps: '12-15',
        rest: '60s',
        notes: 'Retraia as escápulas'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'bicep-curl')!,
        sets: 3,
        reps: '12-15',
        rest: '60s',
        notes: 'Controle o movimento'
      }
    ]
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    name_pt: 'Dia de Pernas',
    description: 'Treino focado em pernas (quadríceps, glúteos, isquiotibiais)',
    difficulty: 'intermediate',
    duration: 60,
    target_muscles: ['quadriceps', 'glutes', 'hamstrings'],
    equipment_needed: ['barbell', 'machine', 'dumbbells'],
    calories_burn: 450,
    exercises: [
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'squat')!,
        sets: 4,
        reps: '8-10',
        rest: '120s',
        notes: 'Foco na técnica'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'leg-press')!,
        sets: 3,
        reps: '12-15',
        rest: '90s',
        notes: 'Controle o movimento'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'leg-extension')!,
        sets: 3,
        reps: '15-20',
        rest: '60s',
        notes: 'Foque no quadríceps'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'leg-curl')!,
        sets: 3,
        reps: '12-15',
        rest: '60s',
        notes: 'Foque nos isquiotibiais'
      },
      {
        exercise: LOCAL_EXERCISES.find(e => e.id === 'calf-raises')!,
        sets: 4,
        reps: '20-25',
        rest: '45s',
        notes: 'Controle o movimento'
      }
    ]
  }
];

// Funções utilitárias
export class ExerciseLibrary {
  private exercises: Exercise[] = LOCAL_EXERCISES;
  private categories: ExerciseCategory[] = EXERCISE_CATEGORIES;
  private templates: WorkoutTemplate[] = WORKOUT_TEMPLATES;

  // Buscar exercícios por categoria
  getExercisesByCategory(category: string): Exercise[] {
    return this.exercises.filter(exercise => exercise.category === category);
  }

  // Buscar exercícios por músculo
  getExercisesByMuscle(muscle: string): Exercise[] {
    return this.exercises.filter(exercise =>
      exercise.muscle_primary === muscle ||
      exercise.muscle_secondary?.includes(muscle)
    );
  }

  // Buscar exercícios por dificuldade
  getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Exercise[] {
    return this.exercises.filter(exercise => exercise.difficulty === difficulty);
  }

  // Buscar exercícios por equipamento
  getExercisesByEquipment(equipment: string): Exercise[] {
    return this.exercises.filter(exercise =>
      exercise.equipment.includes(equipment)
    );
  }

  // Buscar exercício por ID
  getExerciseById(id: string): Exercise | undefined {
    return this.exercises.find(exercise => exercise.id === id);
  }

  // Buscar todos os exercícios
  getAllExercises(): Exercise[] {
    return this.exercises;
  }

  // Buscar todas as categorias
  getAllCategories(): ExerciseCategory[] {
    return this.categories;
  }

  // Buscar templates de treino
  getWorkoutTemplates(): WorkoutTemplate[] {
    return this.templates;
  }

  // Buscar template por ID
  getWorkoutTemplateById(id: string): WorkoutTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  // Buscar exercícios por texto (busca)
  searchExercises(query: string): Exercise[] {
    const searchTerm = query.toLowerCase();
    return this.exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.name_pt?.toLowerCase().includes(searchTerm) ||
      exercise.muscle_primary.toLowerCase().includes(searchTerm) ||
      exercise.category.toLowerCase().includes(searchTerm)
    );
  }

  // Gerar treino aleatório
  generateRandomWorkout(
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    duration: number,
    targetMuscles: string[]
  ): WorkoutExercise[] {
    const availableExercises = this.exercises.filter(exercise =>
      exercise.difficulty === difficulty &&
      (targetMuscles.includes(exercise.muscle_primary) ||
       exercise.muscle_secondary?.some(muscle => targetMuscles.includes(muscle)))
    );

    const workout: WorkoutExercise[] = [];
    const exercisesPerWorkout = Math.floor(duration / 10);

    for (let i = 0; i < Math.min(exercisesPerWorkout, availableExercises.length); i++) {
      const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
      workout.push({
        exercise: randomExercise,
        sets: difficulty === 'beginner' ? 2 : difficulty === 'intermediate' ? 3 : 4,
        reps: difficulty === 'beginner' ? '12-15' : difficulty === 'intermediate' ? '8-12' : '6-8',
        rest: difficulty === 'beginner' ? '60s' : difficulty === 'intermediate' ? '90s' : '120s',
        notes: 'Treino gerado automaticamente'
      });
    }

    return workout;
  }

  // Obter estatísticas da biblioteca
  getLibraryStats() {
    return {
      totalExercises: this.exercises.length,
      categories: this.categories.length,
      templates: this.templates.length,
      byDifficulty: {
        beginner: this.exercises.filter(e => e.difficulty === 'beginner').length,
        intermediate: this.exercises.filter(e => e.difficulty === 'intermediate').length,
        advanced: this.exercises.filter(e => e.difficulty === 'advanced').length
      },
      byCategory: this.categories.map(cat => ({
        name: cat.name_pt,
        count: cat.exercises.length
      }))
    };
  }
}

// Instância global da biblioteca
export const exerciseLibrary = new ExerciseLibrary(); 