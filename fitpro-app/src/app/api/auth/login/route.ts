import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Test login credentials (fixed)
  const TEST_EMAIL = 'test@fitpro.com';
  const TEST_PASSWORD = 'test123';

  console.log('Login attempt for:', email);

  // Check if it's the test login
  if (email === TEST_EMAIL && password === TEST_PASSWORD) {
    return NextResponse.json({ 
      message: 'Login realizado com sucesso!',
      user: {
        id: 'test-user-001',
        email: TEST_EMAIL,
        name: 'Usuário Teste',
        role: 'admin'
      }
    });
  }

  // For any other credentials, return error
  return NextResponse.json(
    { message: 'Credenciais inválidas. Use test@fitpro.com / test123 para login de teste.' },
    { status: 401 }
  );
}
