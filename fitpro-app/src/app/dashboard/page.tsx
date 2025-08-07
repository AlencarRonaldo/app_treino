'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MagicCard } from '@/components/magicui/magic-card';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { Particles } from '@/components/magicui/particles';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Target,
  Activity,
  Award,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Play,
  Clock,
  Heart,
  Trophy,
  BarChart3,
  Target as TargetIcon,
  Flame,
  Dumbbell,
  Timer,
  Medal,
  TrendingDown,
  Eye,
  MapPin,
  Sparkles,
  Target as TargetIcon2,
  Zap as ZapIcon,
  Crown,
  TrendingUp as TrendingUpIcon,
  Settings
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  status: 'ativo' | 'inativo';
  lastActivity: string;
  progress: number;
  avatar: string;
  nextWorkout?: string;
  streak?: number;
  calories?: number;
  workouts?: number;
  level?: 'iniciante' | 'intermediário' | 'avançado';
  achievements?: string[];
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  activeStreak: number;
  totalWorkouts: number;
  totalCalories: number;
  averageRating: number;
  monthlyGrowth: number;
  totalRevenue: number;
  newStudents: number;
}

export default function PersonalDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    completionRate: 0,
    activeStreak: 0,
    totalWorkouts: 0,
    totalCalories: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    totalRevenue: 0,
    newStudents: 0
  });

  useEffect(() => {
    // Mock data - substituir por dados reais
    setStudents([
      {
        id: '1',
        name: 'João Silva',
        status: 'ativo',
        lastActivity: '2 horas atrás',
        progress: 85,
        avatar: 'JS',
        nextWorkout: 'Treino A - Peito e Tríceps',
        streak: 7,
        calories: 2400,
        workouts: 12,
        level: 'intermediário',
        achievements: ['Primeira semana', 'Meta mensal']
      },
      {
        id: '2',
        name: 'Maria Santos',
        status: 'ativo',
        lastActivity: '1 dia atrás',
        progress: 92,
        avatar: 'MS',
        nextWorkout: 'Treino B - Costas e Bíceps',
        streak: 14,
        calories: 2100,
        workouts: 18,
        level: 'avançado',
        achievements: ['Streak de 2 semanas', 'Top performer']
      },
      {
        id: '3',
        name: 'Pedro Costa',
        status: 'inativo',
        lastActivity: '3 dias atrás',
        progress: 45,
        avatar: 'PC',
        nextWorkout: 'Treino C - Pernas',
        streak: 0,
        calories: 1800,
        workouts: 8,
        level: 'iniciante',
        achievements: ['Primeiro treino']
      }
    ]);

    setStats({
      totalStudents: 24,
      activeStudents: 18,
      completionRate: 87,
      activeStreak: 12,
      totalWorkouts: 156,
      totalCalories: 42000,
      averageRating: 4.8,
      monthlyGrowth: 23,
      totalRevenue: 12500,
      newStudents: 5
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.4),transparent)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>

      <Particles className="absolute inset-0" quantity={80} ease={30} color="#ffffff" />

      <div className="relative z-10 p-6">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            FitPro Dashboard
          </h1>
          <p className="text-white/60 text-lg">
            Transforme vidas através do fitness
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NeonGradientCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">Alunos Ativos</p>
                <p className="text-3xl font-bold text-white mb-2">{stats.activeStudents}</p>
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{stats.monthlyGrowth}% este mês
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </NeonGradientCard>

          <NeonGradientCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">Streak Ativo</p>
                <p className="text-3xl font-bold text-white mb-2">{stats.activeStreak} dias</p>
                <div className="flex items-center text-green-400 text-sm">
                  <Flame className="w-4 h-4 mr-1" />
                  Em chamas!
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
          </NeonGradientCard>

          <NeonGradientCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">Treinos Realizados</p>
                <p className="text-3xl font-bold text-white mb-2">{stats.totalWorkouts}</p>
                <div className="flex items-center text-blue-400 text-sm">
                  <Dumbbell className="w-4 h-4 mr-1" />
                  +{Math.floor(stats.totalWorkouts / 30)} hoje
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
          </NeonGradientCard>

          <NeonGradientCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">Avaliação Média</p>
                <p className="text-3xl font-bold text-white mb-2">{stats.averageRating}/5</p>
                <div className="flex items-center text-yellow-400 text-sm">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  Excelente!
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
          </NeonGradientCard>
        </div>

        {/* Progress & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <MagicCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Progresso Geral</h3>
                <div className="p-2 bg-white/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Taxa de Conclusão</span>
                    <span>{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Calorias Queimadas</span>
                    <span>{stats.totalCalories.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((stats.totalCalories / 50000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Engajamento</span>
                    <span>{Math.round((stats.activeStudents / stats.totalStudents) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(stats.activeStudents / stats.totalStudents) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Avaliação Média</h3>
                <div className="p-2 bg-white/10 rounded-lg">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-4">
                  {stats.averageRating}
                </div>
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-8 h-8 ${i < Math.floor(stats.averageRating) ? 'text-yellow-400 fill-current' : 'text-white/30'}`}
                    />
                  ))}
                </div>
                <p className="text-white/80 text-lg">Excelente avaliação!</p>
                <p className="text-white/60 text-sm">Baseado em {stats.totalStudents} avaliações</p>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Recent Students Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Alunos Recentes</h3>
            <Link href="/dashboard/students" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <MagicCard key={student.id} className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        {student.avatar}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{student.name}</h4>
                        <div className={`px-2 py-0.5 rounded-full text-xs ${
                          student.status === 'ativo' 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {student.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-yellow-400 text-sm mb-1">
                        <Flame className="w-4 h-4 mr-1" />
                        {student.streak} dias
                      </div>
                      <div className="text-white/60 text-xs">{student.lastActivity}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-white/80 mb-1">
                        <span>Progresso</span>
                        <span>{student.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            student.progress >= 80 ? 'bg-gradient-to-r from-green-400 to-blue-500' :
                            student.progress >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            'bg-gradient-to-r from-red-400 to-pink-500'
                          }`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {student.nextWorkout && (
                      <div className="flex items-center text-white/80 text-sm">
                        <Timer className="w-4 h-4 mr-2" />
                        <span className="truncate">{student.nextWorkout}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs text-white/60">
                      <div className="flex items-center">
                        <Dumbbell className="w-3 h-3 mr-1" />
                        {student.workouts} treinos
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {student.calories} cal
                      </div>
                    </div>

                    {student.achievements && student.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {student.achievements.map((achievement, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </MagicCard>
            ))}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/students/add">
            <MagicCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Adicionar Aluno</h4>
                <p className="text-white/60 text-sm">Cadastre novos alunos no sistema</p>
              </div>
            </MagicCard>
          </Link>

          <Link href="/dashboard/settings">
            <MagicCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Configurações</h4>
                <p className="text-white/60 text-sm">Gerencie suas preferências</p>
              </div>
            </MagicCard>
          </Link>

          <Link href="/dashboard/analytics">
            <MagicCard className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">Analytics</h4>
                <p className="text-white/60 text-sm">Visualize métricas detalhadas</p>
              </div>
            </MagicCard>
          </Link>
        </div>
      </div>
    </div>
  );
}