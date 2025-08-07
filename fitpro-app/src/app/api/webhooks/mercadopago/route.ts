import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoWebhookEvent } from '@/types/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event: MercadoPagoWebhookEvent = JSON.parse(body);

    console.log('Webhook Mercado Pago recebido:', event.type);

    switch (event.type) {
      case 'subscription_created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event);
        break;
      
      case 'payment_succeeded':
        await handlePaymentSucceeded(event);
        break;
      
      case 'payment_failed':
        await handlePaymentFailed(event);
        break;
      
      case 'subscription_trial_ending':
        await handleTrialEnding(event);
        break;
      
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(event: MercadoPagoWebhookEvent) {
  try {
    const subscription = event.data;
    
    // Buscar usuário pelo payer_id
    if (!subscription.payer_id) {
      console.error('payer_id não encontrado na assinatura:', subscription.id);
      return;
    }
    
    const userId = await getUserIdByMercadoPagoPayerId(subscription.payer_id);
    
    if (!userId) {
      console.error('Usuário não encontrado para payer_id:', subscription.payer_id);
      return;
    }

    // Buscar plano pelo preapproval_id
    if (!subscription.preapproval_id) {
      console.error('preapproval_id não encontrado na assinatura:', subscription.id);
      return;
    }
    
    const planId = await getPlanIdByMercadoPagoPreapprovalId(subscription.preapproval_id);
    
    if (!planId) {
      console.error('Plano não encontrado para preapproval_id:', subscription.preapproval_id);
      return;
    }

    // Criar assinatura no banco
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: subscription.status,
      current_period_start: subscription.date_created ? new Date(subscription.date_created) : new Date(),
      current_period_end: subscription.next_payment_date ? new Date(subscription.next_payment_date) : new Date(),
      trial_ends_at: subscription.trial_end_date ? new Date(subscription.trial_end_date) : undefined,
      mp_subscription_id: subscription.id,
      billing_cycle: subscription.frequency === 12 ? 'yearly' : 'monthly'
    };

    await createSubscription(subscriptionData);
    
    console.log('Assinatura Mercado Pago criada:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar subscription.created:', error);
  }
}

async function handleSubscriptionUpdated(event: MercadoPagoWebhookEvent) {
  try {
    const subscription = event.data;
    
    // Atualizar assinatura no banco
    const subscriptionData = {
      status: subscription.status,
      current_period_start: subscription.date_created ? new Date(subscription.date_created) : new Date(),
      current_period_end: subscription.next_payment_date ? new Date(subscription.next_payment_date) : new Date(),
      trial_ends_at: subscription.trial_end_date ? new Date(subscription.trial_end_date) : undefined
    };

    await updateSubscription(subscription.id, subscriptionData);
    
    console.log('Assinatura Mercado Pago atualizada:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar subscription.updated:', error);
  }
}

async function handleSubscriptionCancelled(event: MercadoPagoWebhookEvent) {
  try {
    const subscription = event.data;
    
    // Cancelar assinatura no banco
    await cancelSubscription(subscription.id);
    
    console.log('Assinatura Mercado Pago cancelada:', subscription.id);

  } catch (error) {
    console.error('Erro ao processar subscription.cancelled:', error);
  }
}

async function handlePaymentSucceeded(event: MercadoPagoWebhookEvent) {
  try {
    const payment = event.data;
    
    if (!payment.payer_id || !payment.subscription_id || !payment.transaction_amount || !payment.currency_id || !payment.date_approved) {
      console.error('Dados obrigatórios não encontrados no pagamento:', payment.id);
      return;
    }
    
    // Registrar pagamento bem-sucedido
    const paymentData = {
      user_id: await getUserIdByMercadoPagoPayerId(payment.payer_id),
      subscription_id: await getSubscriptionIdByMercadoPagoId(payment.subscription_id),
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'paid',
      provider: 'mercadopago',
      invoice_url: payment.external_reference,
      paid_at: new Date(payment.date_approved)
    };

    await createBillingHistory(paymentData);
    
    console.log('Pagamento Mercado Pago registrado:', payment.id);

  } catch (error) {
    console.error('Erro ao processar payment.succeeded:', error);
  }
}

async function handlePaymentFailed(event: MercadoPagoWebhookEvent) {
  try {
    const payment = event.data;
    
    if (!payment.payer_id || !payment.subscription_id || !payment.transaction_amount || !payment.currency_id) {
      console.error('Dados obrigatórios não encontrados no pagamento falhado:', payment.id);
      return;
    }
    
    // Registrar falha de pagamento
    const paymentData = {
      user_id: await getUserIdByMercadoPagoPayerId(payment.payer_id),
      subscription_id: await getSubscriptionIdByMercadoPagoId(payment.subscription_id),
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'failed',
      provider: 'mercadopago',
      invoice_url: payment.external_reference
    };

    await createBillingHistory(paymentData);
    
    // Enviar notificação ao usuário
    await sendPaymentFailedNotification(payment.payer_id);
    
    console.log('Falha de pagamento Mercado Pago registrada:', payment.id);

  } catch (error) {
    console.error('Erro ao processar payment.failed:', error);
  }
}

async function handleTrialEnding(event: MercadoPagoWebhookEvent) {
  try {
    const subscription = event.data;
    
    if (!subscription.payer_id) {
      console.error('payer_id não encontrado na assinatura para trial ending:', subscription.id);
      return;
    }
    
    // Enviar notificação de fim do trial
    await sendTrialEndingNotification(subscription.payer_id);
    
    console.log('Notificação de fim do trial Mercado Pago enviada para:', subscription.payer_id);

  } catch (error) {
    console.error('Erro ao processar trial.ending:', error);
  }
}

// Funções auxiliares (em produção, estas fariam consultas ao banco)
async function getUserIdByMercadoPagoPayerId(payerId: string): Promise<string | null> {
  // Implementar busca no banco
  return 'user-123';
}

async function getPlanIdByMercadoPagoPreapprovalId(preapprovalId: string): Promise<string | null> {
  // Implementar busca no banco
  return 'plan-123';
}

async function getSubscriptionIdByMercadoPagoId(mpId: string): Promise<string | null> {
  // Implementar busca no banco
  return 'sub-123';
}

async function createSubscription(data: any): Promise<void> {
  // Implementar criação no banco
  console.log('Criando assinatura Mercado Pago:', data);
}

async function updateSubscription(mpId: string, data: any): Promise<void> {
  // Implementar atualização no banco
  console.log('Atualizando assinatura Mercado Pago:', mpId, data);
}

async function cancelSubscription(mpId: string): Promise<void> {
  // Implementar cancelamento no banco
  console.log('Cancelando assinatura Mercado Pago:', mpId);
}

async function createBillingHistory(data: any): Promise<void> {
  // Implementar criação no banco
  console.log('Criando histórico de faturamento Mercado Pago:', data);
}

async function sendPaymentFailedNotification(payerId: string): Promise<void> {
  // Implementar envio de notificação
  console.log('Enviando notificação de falha de pagamento Mercado Pago para:', payerId);
}

async function sendTrialEndingNotification(payerId: string): Promise<void> {
  // Implementar envio de notificação
  console.log('Enviando notificação de fim do trial Mercado Pago para:', payerId);
} 