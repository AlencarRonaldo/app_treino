import { NextRequest, NextResponse } from 'next/server';
import { sendLoginCredentials, whatsAppService } from '@/lib/whatsapp-service';

interface TestData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestData = await request.json();
    
    // Validação dos campos
    if (!body.name || !body.email || !body.phone || !body.password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
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

    // Validação do formato do telefone
    const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(body.phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { message: 'Formato de telefone inválido. Use: (11) 99999-9999' },
        { status: 400 }
      );
    }

    // Verifica se o WhatsApp está configurado
    const isConfigured = whatsAppService.isConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp não configurado - usando mock',
        messageId: `mock_${Date.now()}`,
        configured: false
      });
    }

    // Testa a conexão com a API
    const isConnected = await whatsAppService.testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Falha na conexão com a API do WhatsApp',
        configured: true,
        connected: false
      }, { status: 500 });
    }

    // Envia a mensagem de teste
    const result = await sendLoginCredentials(
      body.name,
      body.email,
      body.password,
      body.phone
    );

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      messageId: result.messageId || `msg_${Date.now()}`,
      configured: true,
      connected: true,
      result
    });

  } catch (error) {
    console.error('Erro no teste do WhatsApp:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Verifica o status da configuração
    const isConfigured = whatsAppService.isConfigured();
    let isConnected = false;
    
    if (isConfigured) {
      isConnected = await whatsAppService.testConnection();
    }

    return NextResponse.json({
      configured: isConfigured,
      connected: isConnected,
      message: isConfigured 
        ? (isConnected ? 'WhatsApp configurado e conectado' : 'WhatsApp configurado mas sem conexão')
        : 'WhatsApp não configurado'
    });

  } catch (error) {
    console.error('Erro ao verificar status do WhatsApp:', error);
    
    return NextResponse.json({
      configured: false,
      connected: false,
      message: 'Erro ao verificar status'
    }, { status: 500 });
  }
} 