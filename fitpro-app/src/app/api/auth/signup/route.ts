import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // TODO: Implementar lógica de registro com Supabase
  console.log('Signup attempt for:', email);

  return NextResponse.json({ message: 'User registered successfully (mock)' });
}
