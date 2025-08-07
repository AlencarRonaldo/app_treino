import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { title, exercises, studentId } = await request.json();

  // TODO: Implementar lógica de criação de treino com Supabase
  console.log('Workout creation attempt:', title, exercises, studentId);

  return NextResponse.json({ message: 'Workout created successfully (mock)' });
}
