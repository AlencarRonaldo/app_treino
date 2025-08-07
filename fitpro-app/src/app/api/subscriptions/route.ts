import { NextRequest, NextResponse } from 'next/server';
import { Subscription, BillingCycle, SubscriptionStatus } from '@/types/pricing';

// Dados mockados das assinaturas (em produção viriam do banco)
const SUBSCRIPTIONS: Subscription[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as SubscriptionStatus;

    let filteredSubscriptions = SUBSCRIPTIONS;

    // Filtrar por usuário
    if (userId) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.user_id === userId);
    }

    // Filtrar por status
    if (status) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filteredSubscriptions,
      count: filteredSubscriptions.length
    });

  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.user_id || !body.plan_id || !body.billing_cycle) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios não fornecidos' 
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const trialDays = body.trial_days || 14;
    const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined;
    
    // Calcular período da assinatura
    const periodStart = now;
    const periodEnd = new Date(now.getTime() + (body.billing_cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

    const newSubscription: Subscription = {
      id: `sub-${Date.now()}`,
      user_id: body.user_id,
      plan_id: body.plan_id,
      status: trialDays > 0 ? 'trialing' : 'active',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      trial_ends_at: trialEndsAt,
      billing_cycle: body.billing_cycle as BillingCycle,
      stripe_subscription_id: body.stripe_subscription_id,
      mp_subscription_id: body.mp_subscription_id,
      created_at: now,
      updated_at: now
    };

    // Simular salvamento no banco
    SUBSCRIPTIONS.push(newSubscription);

    return NextResponse.json({
      success: true,
      data: newSubscription,
      message: 'Assinatura criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID da assinatura não fornecido' 
        },
        { status: 400 }
      );
    }

    // Encontrar assinatura
    const subscriptionIndex = SUBSCRIPTIONS.findIndex(sub => sub.id === subscriptionId);
    
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Assinatura não encontrada' 
        },
        { status: 404 }
      );
    }

    // Atualizar assinatura
    const updatedSubscription = {
      ...SUBSCRIPTIONS[subscriptionIndex],
      ...body,
      updated_at: new Date()
    };

    SUBSCRIPTIONS[subscriptionIndex] = updatedSubscription;

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
      message: 'Assinatura atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID da assinatura não fornecido' 
        },
        { status: 400 }
      );
    }

    // Encontrar e cancelar assinatura
    const subscriptionIndex = SUBSCRIPTIONS.findIndex(sub => sub.id === subscriptionId);
    
    if (subscriptionIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Assinatura não encontrada' 
        },
        { status: 404 }
      );
    }

    // Marcar como cancelada
    SUBSCRIPTIONS[subscriptionIndex] = {
      ...SUBSCRIPTIONS[subscriptionIndex],
      status: 'canceled',
      canceled_at: new Date(),
      updated_at: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 