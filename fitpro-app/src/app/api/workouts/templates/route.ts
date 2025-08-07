import { NextRequest, NextResponse } from 'next/server';
import { exerciseLibrary, WorkoutTemplate } from '@/lib/exercise-library';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' | null;
    const duration = searchParams.get('duration');
    const targetMuscles = searchParams.get('target_muscles');

    let templates: WorkoutTemplate[] = exerciseLibrary.getWorkoutTemplates();

    // Aplicar filtros
    if (difficulty) {
      templates = templates.filter(template => template.difficulty === difficulty);
    }

    if (duration) {
      const minDuration = parseInt(duration);
      templates = templates.filter(template => template.duration >= minDuration);
    }

    if (targetMuscles) {
      const muscles = targetMuscles.split(',');
      templates = templates.filter(template => 
        template.target_muscles.some(muscle => muscles.includes(muscle))
      );
    }

    return NextResponse.json({
      templates,
      total: templates.length,
      filters: {
        difficulty,
        duration,
        target_muscles: targetMuscles
      }
    });

  } catch (error) {
    console.error('Error fetching workout templates:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates de treino' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, difficulty, duration, target_muscles, equipment_needed, exercises } = body;

    // Validação básica
    if (!name || !description || !difficulty || !duration || !target_muscles || !exercises) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // TODO: Salvar no banco de dados
    console.log('Novo template de treino criado:', body);

    return NextResponse.json({
      message: 'Template de treino criado com sucesso',
      template: {
        id: Date.now().toString(),
        ...body
      }
    });

  } catch (error) {
    console.error('Error creating workout template:', error);
    return NextResponse.json(
      { error: 'Erro ao criar template de treino' },
      { status: 500 }
    );
  }
}
