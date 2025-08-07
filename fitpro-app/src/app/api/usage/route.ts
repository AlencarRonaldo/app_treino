import { NextRequest, NextResponse } from 'next/server';
import { UsageTracking } from '@/types/pricing';

// Dados mockados do uso (em produção viriam do banco)
const USAGE_DATA: UsageTracking[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const metricType = searchParams.get('metricType');

    let filteredUsage = USAGE_DATA;

    // Filtrar por usuário
    if (userId) {
      filteredUsage = filteredUsage.filter(usage => usage.user_id === userId);
    }

    // Filtrar por tipo de métrica
    if (metricType) {
      filteredUsage = filteredUsage.filter(usage => usage.metric_type === metricType);
    }

    return NextResponse.json({
      success: true,
      data: filteredUsage,
      count: filteredUsage.length
    });

  } catch (error) {
    console.error('Erro ao buscar dados de uso:', error);
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
    if (!body.user_id || !body.metric_type || body.current_count === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios não fornecidos' 
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês

    // Verificar se já existe registro para este período
    const existingUsageIndex = USAGE_DATA.findIndex(usage => 
      usage.user_id === body.user_id && 
      usage.metric_type === body.metric_type &&
      usage.period_start.getTime() === periodStart.getTime()
    );

    let usageRecord: UsageTracking;

    if (existingUsageIndex !== -1) {
      // Atualizar registro existente
      USAGE_DATA[existingUsageIndex] = {
        ...USAGE_DATA[existingUsageIndex],
        current_count: body.current_count,
        limit_count: body.limit_count || USAGE_DATA[existingUsageIndex].limit_count,
        updated_at: now
      };
      usageRecord = USAGE_DATA[existingUsageIndex];
    } else {
      // Criar novo registro
      usageRecord = {
        id: `usage-${Date.now()}`,
        user_id: body.user_id,
        metric_type: body.metric_type,
        current_count: body.current_count,
        limit_count: body.limit_count || 0,
        period_start: periodStart,
        period_end: periodEnd,
        created_at: now,
        updated_at: now
      };
      USAGE_DATA.push(usageRecord);
    }

    return NextResponse.json({
      success: true,
      data: usageRecord,
      message: 'Dados de uso atualizados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar dados de uso:', error);
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
    const usageId = searchParams.get('id');

    if (!usageId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID do uso não fornecido' 
        },
        { status: 400 }
      );
    }

    // Encontrar registro de uso
    const usageIndex = USAGE_DATA.findIndex(usage => usage.id === usageId);
    
    if (usageIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registro de uso não encontrado' 
        },
        { status: 404 }
      );
    }

    // Atualizar registro
    const updatedUsage = {
      ...USAGE_DATA[usageIndex],
      ...body,
      updated_at: new Date()
    };

    USAGE_DATA[usageIndex] = updatedUsage;

    return NextResponse.json({
      success: true,
      data: updatedUsage,
      message: 'Dados de uso atualizados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar dados de uso:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// Função para incrementar uso
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.user_id || !body.metric_type || body.increment === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios não fornecidos' 
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Encontrar ou criar registro
    let usageIndex = USAGE_DATA.findIndex(usage => 
      usage.user_id === body.user_id && 
      usage.metric_type === body.metric_type &&
      usage.period_start.getTime() === periodStart.getTime()
    );

    if (usageIndex === -1) {
      // Criar novo registro
      const newUsage: UsageTracking = {
        id: `usage-${Date.now()}`,
        user_id: body.user_id,
        metric_type: body.metric_type,
        current_count: body.increment,
        limit_count: body.limit_count || 0,
        period_start: periodStart,
        period_end: periodEnd,
        created_at: now,
        updated_at: now
      };
      USAGE_DATA.push(newUsage);
      usageIndex = USAGE_DATA.length - 1;
    } else {
      // Incrementar registro existente
      USAGE_DATA[usageIndex] = {
        ...USAGE_DATA[usageIndex],
        current_count: USAGE_DATA[usageIndex].current_count + body.increment,
        updated_at: now
      };
    }

    return NextResponse.json({
      success: true,
      data: USAGE_DATA[usageIndex],
      message: 'Uso incrementado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao incrementar uso:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 