import { NextRequest, NextResponse } from 'next/server';
import { StripeWebhookEvent } from '@/types/pricing';

// Em produção, você importaria o Stripe
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Assinatura do Stripe não fornecida' },
        { status: 400 }
      );
    }

    // Em produção, você verificaria a assinatura
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    
    // Por enquanto, vamos simular o evento
    const event: StripeWebhookEvent = JSON.parse(body);

    console.log('Webhook Stripe recebido:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event);
        break;
      
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Erro ao processar webhook do Stripe:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(event: StripeWebhookEvent) {
  try {
    const subscription = event.data.object;
    
    // Buscar usuário pelo customer_id
    const userId = await getUserIdByStripeCustomerId(subscription.customer as string);
    
    if (!userId) {
      console.error('Usuário não encontrado para customer_id:', subscription.customer);
      return;
    }

    // Buscar plano pelo price_id
    const planId = await getPlanIdByStripePriceId(subscription.items.data[0].price.id);
    
    if (!planId) {
      console.error('Plano não encontrado para price_id:', subscription.items.data[0].price.id);
      return;
    }

    // Criar assinatura no banco
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      stripe_subscription_id: subscription.id,
      billing_cycle: subscription.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly'
    };

    // Salvar no banco
    await createSubscription(subscriptionData);
    
    console.log('Assinatura criada:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar subscription.created:', error);
  }
}

async function handleSubscriptionUpdated(event: StripeWebhookEvent) {
  try {
    const subscription = event.data.object;
    
    // Atualizar assinatura no banco
    const subscriptionData = {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined
    };

    await updateSubscription(subscription.id, subscriptionData);
    
    console.log('Assinatura atualizada:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar subscription.updated:', error);
  }
}

async function handleSubscriptionDeleted(event: StripeWebhookEvent) {
  try {
    const subscription = event.data.object;
    
    // Cancelar assinatura no banco
    await cancelSubscription(subscription.id);
    
    console.log('Assinatura cancelada:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar subscription.deleted:', error);
  }
}

async function handlePaymentSucceeded(event: StripeWebhookEvent) {
  try {
    const invoice = event.data.object;
    
    // Registrar pagamento bem-sucedido
    const paymentData = {
      user_id: await getUserIdByStripeCustomerId(invoice.customer as string),
      subscription_id: await getSubscriptionIdByStripeId(invoice.subscription as string),
      amount: invoice.amount_paid / 100, // Stripe usa centavos
      currency: invoice.currency,
      status: 'paid',
      provider: 'stripe',
      invoice_url: invoice.hosted_invoice_url,
      paid_at: new Date()
    };

    await createBillingHistory(paymentData);
    
    console.log('Pagamento registrado:', invoice.id);

  } catch (error) {
    console.error('Erro ao processar payment.succeeded:', error);
  }
}

async function handlePaymentFailed(event: StripeWebhookEvent) {
  try {
    const invoice = event.data.object;
    
    // Registrar falha de pagamento
    const paymentData = {
      user_id: await getUserIdByStripeCustomerId(invoice.customer as string),
      subscription_id: await getSubscriptionIdByStripeId(invoice.subscription as string),
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      provider: 'stripe',
      invoice_url: invoice.hosted_invoice_url
    };

    await createBillingHistory(paymentData);
    
    // Enviar notificação ao usuário
    await sendPaymentFailedNotification(invoice.customer as string);
    
    console.log('Falha de pagamento registrada:', invoice.id);

  } catch (error) {
    console.error('Erro ao processar payment.failed:', error);
  }
}

async function handleTrialWillEnd(event: StripeWebhookEvent) {
  try {
    const subscription = event.data.object;
    
    // Enviar notificação de fim do trial
    await sendTrialEndingNotification(subscription.customer as string);
    
    console.log('Notificação de fim do trial enviada para:', subscription.customer);

  } catch (error) {
    console.error('Erro ao processar trial.will_end:', error);
  }
}

// Funções auxiliares (em produção, estas fariam consultas ao banco)
async function getUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  // Implementar busca no banco
  return 'user-123';
}

async function getPlanIdByStripePriceId(priceId: string): Promise<string | null> {
  // Implementar busca no banco
  return 'plan-123';
}

async function getSubscriptionIdByStripeId(stripeId: string): Promise<string | null> {
  // Implementar busca no banco
  return 'sub-123';
}

async function createSubscription(data: any): Promise<void> {
  // Implementar criação no banco
  console.log('Criando assinatura:', data);
}

async function updateSubscription(stripeId: string, data: any): Promise<void> {
  // Implementar atualização no banco
  console.log('Atualizando assinatura:', stripeId, data);
}

async function cancelSubscription(stripeId: string): Promise<void> {
  // Implementar cancelamento no banco
  console.log('Cancelando assinatura:', stripeId);
}

async function createBillingHistory(data: any): Promise<void> {
  // Implementar criação no banco
  console.log('Criando histórico de faturamento:', data);
}

async function sendPaymentFailedNotification(customerId: string): Promise<void> {
  // Implementar envio de notificação
  console.log('Enviando notificação de falha de pagamento para:', customerId);
}

async function sendTrialEndingNotification(customerId: string): Promise<void> {
  // Implementar envio de notificação
  console.log('Enviando notificação de fim do trial para:', customerId);
} 