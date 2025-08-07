'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { exerciseLibrary } from '@/lib/exercise-library';

export default function ExerciseStatsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const libraryStats = exerciseLibrary.getLibraryStats();
    setStats(libraryStats);
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estatísticas da Biblioteca</h1>
              <p className="text-gray-600 mt-2">Visão geral completa da biblioteca de exercícios</p>
            </div>
            <Link
              href="/dashboard/exercises"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Voltar à Biblioteca
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalExercises}</div>
              <div className="text-gray-600">Total de Exercícios</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.categories}</div>
              <div className="text-gray-600">Categorias</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.templates}</div>
              <div className="text-gray-600">Templates de Treino</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.byDifficulty.beginner + stats.byDifficulty.intermediate + stats.byDifficulty.advanced}
              </div>
              <div className="text-gray-600">Níveis de Dificuldade</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Difficulty Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Distribuição por Dificuldade</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Iniciante</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600 mr-2">{stats.byDifficulty.beginner}</span>
                  <span className="text-gray-500">exercícios</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Intermediário</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-yellow-600 mr-2">{stats.byDifficulty.intermediate}</span>
                  <span className="text-gray-500">exercícios</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Avançado</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-red-600 mr-2">{stats.byDifficulty.advanced}</span>
                  <span className="text-gray-500">exercícios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Exercícios por Categoria</h2>
            <div className="space-y-3">
              {stats.byCategory.map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{category.name}</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-blue-600 mr-2">{category.count}</span>
                    <span className="text-gray-500">exercícios</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment Analysis */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Análise de Equipamentos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {exerciseLibrary.getExercisesByEquipment('barbell').length}
              </div>
              <div className="text-sm text-gray-600">Com Barra</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {exerciseLibrary.getExercisesByEquipment('dumbbells').length}
              </div>
              <div className="text-sm text-gray-600">Com Halteres</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {exerciseLibrary.getExercisesByEquipment('machine').length}
              </div>
              <div className="text-sm text-gray-600">Em Máquina</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {exerciseLibrary.getExercisesByEquipment('bodyweight').length}
              </div>
              <div className="text-sm text-gray-600">Peso Corporal</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/exercises"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🏋️</div>
                <div className="font-semibold text-gray-900">Ver Todos os Exercícios</div>
                <div className="text-sm text-gray-600">Navegue pela biblioteca completa</div>
              </div>
            </Link>
            <Link
              href="/dashboard/workouts/create"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📝</div>
                <div className="font-semibold text-gray-900">Criar Treino</div>
                <div className="text-sm text-gray-600">Use os exercícios da biblioteca</div>
              </div>
            </Link>
            <Link
              href="/dashboard/workouts"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold text-gray-900">Ver Templates</div>
                <div className="text-sm text-gray-600">Treinos pré-definidos</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 