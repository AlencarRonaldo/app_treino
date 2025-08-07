import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { planId, userId } = await request.json();

  // TODO: Implementar lógica de checkout com Stripe/Mercado Pago
  console.log('Checkout initiated for plan:', planId, 'by user:', userId);

  return NextResponse.json({ message: 'Checkout initiated (mock)', checkoutUrl: 'https://mock-checkout.com' });
}
