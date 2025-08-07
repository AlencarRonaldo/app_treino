import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: Implementar lógica de webhook para Stripe/Mercado Pago
  const payload = await request.json();
  console.log('Webhook received:', payload);

  // Verificar assinatura do webhook
  // Processar evento (ex: atualizar status da assinatura do usuário)

  return NextResponse.json({ received: true });
}
