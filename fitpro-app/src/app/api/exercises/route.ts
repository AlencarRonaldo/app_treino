import { NextRequest, NextResponse } from 'next/server';
import { exerciseLibrary, Exercise } from '@/lib/exercise-library';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const muscle = searchParams.get('muscle');
    const difficulty = searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' | null;
    const equipment = searchParams.get('equipment');
    const search = searchParams.get('search');

    let exercises: Exercise[] = [];

    // Aplicar filtros
    if (search) {
      exercises = exerciseLibrary.searchExercises(search);
    } else if (category) {
      exercises = exerciseLibrary.getExercisesByCategory(category);
    } else if (muscle) {
      exercises = exerciseLibrary.getExercisesByMuscle(muscle);
    } else if (difficulty) {
      exercises = exerciseLibrary.getExercisesByDifficulty(difficulty);
    } else if (equipment) {
      exercises = exerciseLibrary.getExercisesByEquipment(equipment);
    } else {
      exercises = exerciseLibrary.getAllExercises();
    }

    return NextResponse.json({
      exercises,
      total: exercises.length,
      filters: {
        category,
        muscle,
        difficulty,
        equipment,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar exercícios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, muscle_groups, equipment, difficulty, instructions } = body;

    // Validação básica
    if (!name || !category || !muscle_groups || !equipment || !difficulty || !instructions) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // TODO: Salvar no banco de dados
    console.log('Novo exercício criado:', body);

    return NextResponse.json({
      message: 'Exercício criado com sucesso',
      exercise: {
        id: Date.now().toString(),
        ...body
      }
    });

  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Erro ao criar exercício' },
      { status: 500 }
    );
  }
}
