import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendLoginCredentials } from '@/lib/whatsapp-service';

interface StudentData {
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  plan?: string;
  instructor?: string;
  password: string;
  sendWhatsApp: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: StudentData = await request.json();
    
    // Validação dos campos obrigatórios
    if (!body.name || !body.email || !body.phone || !body.password) {
      return NextResponse.json(
        { message: 'Nome, email, telefone e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação do formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validação do formato do telefone (formato brasileiro)
    const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { message: 'Formato de telefone inválido. Use: (11) 99999-9999' },
        { status: 400 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // TODO: Salvar no banco de dados
    const studentData = {
      id: `student_${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone,
      birthDate: body.birthDate || null,
      plan: body.plan || null,
      instructor: body.instructor || null,
      password: hashedPassword,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Enviar login via WhatsApp se solicitado
    if (body.sendWhatsApp) {
      try {
        await sendLoginCredentials(body.name, body.email, body.password, body.phone);
      } catch (whatsappError) {
        console.error('Erro ao enviar WhatsApp:', whatsappError);
        // Não falha o cadastro se o WhatsApp falhar, apenas loga o erro
      }
    }

    // TODO: Implementar salvamento real no banco de dados
    console.log('Aluno criado:', studentData);

    return NextResponse.json({
      message: 'Aluno adicionado com sucesso',
      student: {
        id: studentData.id,
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone,
        status: studentData.status
      },
      whatsappSent: body.sendWhatsApp
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao adicionar aluno:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // TODO: Buscar alunos do banco de dados
    const mockStudents = [
      {
        id: 'student_1',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        plan: 'mensal',
        instructor: 'Maria Souza',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'student_2',
        name: 'Ana Costa',
        email: 'ana@email.com',
        phone: '(11) 88888-8888',
        plan: 'trimestral',
        instructor: 'Pedro Santos',
        status: 'active',
        createdAt: '2024-01-10T14:30:00Z'
      }
    ];

    return NextResponse.json({
      students: mockStudents,
      total: mockStudents.length
    });

  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 