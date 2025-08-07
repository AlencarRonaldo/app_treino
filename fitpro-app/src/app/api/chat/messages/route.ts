import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  // TODO: Implementar lógica para buscar mensagens do Supabase
  console.log('Fetching messages for conversation:', conversationId);

  const mockMessages = [
    { id: 'm1', sender: 'user1', text: 'Olá, como faço o exercício X?', timestamp: new Date().toISOString() },
    { id: 'm2', sender: 'user2', text: 'Você pode ver o vídeo demonstrativo.', timestamp: new Date().toISOString() },
  ];

  return NextResponse.json(mockMessages);
}

export async function POST(request: Request) {
  const { conversationId, senderId, text } = await request.json();

  // TODO: Implementar lógica para enviar mensagem para o Supabase
  console.log('Sending message:', { conversationId, senderId, text });

  return NextResponse.json({ message: 'Message sent (mock)' });
}
