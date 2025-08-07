import { NextRequest, NextResponse } from 'next/server';
import { Plan, UserType } from '@/types/pricing';

// Dados mockados dos planos (em produção viriam do banco)
const PLANS: Plan[] = [
  // Personal Trainers
  {
    id: 'freemium',
    name: 'Freemium',
    name_pt: 'Freemium',
    type: 'freemium',
    target_audience: 'personal',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Biblioteca de exercícios',
      '3 alunos',
      '5 templates básicos',
      'Acesso básico'
    ],
    limits: {
      students: 3,
      templates: 5,
      workouts: 10,
      messages_per_month: 0,
      analytics_days: 0,
      white_label: false,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 0,
    description: 'Perfect for getting started',
    description_pt: 'Perfeito para começar'
  },
  {
    id: 'starter',
    name: 'Starter',
    name_pt: 'Starter',
    type: 'starter',
    target_audience: 'personal',
    price_monthly: 19,
    price_yearly: 190,
    features: [
      'Biblioteca completa',
      '10 alunos',
      '15 templates',
      'Dashboard básico',
      'Suporte por email'
    ],
    limits: {
      students: 10,
      templates: 15,
      workouts: 50,
      messages_per_month: 100,
      analytics_days: 30,
      white_label: false,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'Great for growing personal trainers',
    description_pt: 'Ideal para personal trainers em crescimento'
  },
  {
    id: 'professional',
    name: 'Professional',
    name_pt: 'Professional',
    type: 'professional',
    target_audience: 'personal',
    price_monthly: 49,
    price_yearly: 490,
    features: [
      'Biblioteca completa',
      '40 alunos',
      '50+ templates',
      'Chat em tempo real',
      'Analytics avançados',
      'White label básico',
      'Relatórios PDF',
      'Agendamento'
    ],
    limits: {
      students: 40,
      templates: 50,
      workouts: 200,
      messages_per_month: 500,
      analytics_days: 90,
      white_label: true,
      api_access: false,
      webhooks: false
    },
    is_popular: true,
    is_active: true,
    trial_days: 14,
    description: 'Most popular choice for professionals',
    description_pt: 'Escolha mais popular para profissionais'
  },
  {
    id: 'expert',
    name: 'Expert',
    name_pt: 'Expert',
    type: 'expert',
    target_audience: 'personal',
    price_monthly: 99,
    price_yearly: 990,
    features: [
      'Tudo do Professional',
      'Alunos ilimitados',
      'Templates ilimitados',
      'White label completo',
      'API access',
      'Webhooks',
      'Suporte prioritário'
    ],
    limits: {
      students: -1,
      templates: -1,
      workouts: -1,
      messages_per_month: -1,
      analytics_days: 365,
      white_label: true,
      api_access: true,
      webhooks: true
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'For established professionals',
    description_pt: 'Para profissionais estabelecidos'
  },
  // Academies
  {
    id: 'basic-academy',
    name: 'Basic Academy',
    name_pt: 'Academia Básica',
    type: 'basic',
    target_audience: 'academy',
    price_monthly: 199,
    price_yearly: 1990,
    features: [
      '200 alunos',
      '5 instrutores',
      'Biblioteca completa',
      'Dashboard básico'
    ],
    limits: {
      students: 200,
      instructors: 5,
      templates: 100,
      workouts: 500,
      messages_per_month: 1000,
      analytics_days: 30,
      white_label: false,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'Perfect for small academies',
    description_pt: 'Perfeito para academias pequenas'
  },
  {
    id: 'business-academy',
    name: 'Business Academy',
    name_pt: 'Academia Business',
    type: 'business',
    target_audience: 'academy',
    price_monthly: 399,
    price_yearly: 3990,
    features: [
      '500 alunos',
      '15 instrutores',
      'Analytics avançados',
      'White label',
      'Relatórios personalizados'
    ],
    limits: {
      students: 500,
      instructors: 15,
      templates: 200,
      workouts: 1000,
      messages_per_month: 2000,
      analytics_days: 90,
      white_label: true,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'For growing academies',
    description_pt: 'Para academias em crescimento'
  },
  {
    id: 'enterprise-academy',
    name: 'Enterprise Academy',
    name_pt: 'Academia Enterprise',
    type: 'enterprise',
    target_audience: 'academy',
    price_monthly: 799,
    price_yearly: 7990,
    features: [
      'Alunos ilimitados',
      'Instrutores ilimitados',
      'Tudo ilimitado',
      'Suporte dedicado',
      'Integrações customizadas'
    ],
    limits: {
      students: -1,
      instructors: -1,
      templates: -1,
      workouts: -1,
      messages_per_month: -1,
      analytics_days: 365,
      white_label: true,
      api_access: true,
      webhooks: true
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'For large academy chains',
    description_pt: 'Para grandes redes de academias'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') as UserType;
    const isActive = searchParams.get('isActive') !== 'false';

    let filteredPlans = PLANS;

    // Filtrar por tipo de usuário
    if (userType) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.target_audience === userType || plan.target_audience === 'personal'
      );
    }

    // Filtrar por status ativo
    if (isActive) {
      filteredPlans = filteredPlans.filter(plan => plan.is_active);
    }

    return NextResponse.json({
      success: true,
      data: filteredPlans,
      count: filteredPlans.length
    });

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
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
    if (!body.name || !body.name_pt || !body.type || !body.target_audience) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios não fornecidos' 
        },
        { status: 400 }
      );
    }

    // Em produção, aqui você salvaria no banco
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: body.name,
      name_pt: body.name_pt,
      type: body.type,
      target_audience: body.target_audience,
      price_monthly: body.price_monthly || 0,
      price_yearly: body.price_yearly || 0,
      features: body.features || [],
      limits: body.limits || {
        students: 0,
        templates: 0,
        workouts: 0,
        messages_per_month: 0,
        analytics_days: 0,
        white_label: false,
        api_access: false,
        webhooks: false
      },
      is_popular: body.is_popular || false,
      is_active: body.is_active !== false,
      trial_days: body.trial_days || 0,
      description: body.description || '',
      description_pt: body.description_pt || ''
    };

    // Simular salvamento no banco
    PLANS.push(newPlan);

    return NextResponse.json({
      success: true,
      data: newPlan,
      message: 'Plano criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 