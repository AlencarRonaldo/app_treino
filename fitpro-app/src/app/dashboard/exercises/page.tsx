'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exercise, EXERCISE_CATEGORIES, exerciseLibrary } from '@/lib/exercise-library';

export default function ExercisesLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Carregar exercícios
    const allExercises = exerciseLibrary.getAllExercises();
    setExercises(allExercises);
    setFilteredExercises(allExercises);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.name_pt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscle_primary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(exercise => exercise.difficulty === selectedDifficulty);
    }

    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(exercise => exercise.equipment.includes(selectedEquipment));
    }

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, selectedCategory, selectedDifficulty, selectedEquipment]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return difficulty;
    }
  };

  const getAllEquipment = () => {
    const equipment = new Set<string>();
    exercises.forEach(exercise => {
      exercise.equipment.forEach(eq => equipment.add(eq));
    });
    return Array.from(equipment);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando biblioteca de exercícios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Exercícios</h1>
              <p className="text-gray-600 mt-2">
                {filteredExercises.length} exercícios encontrados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <Link
                href="/dashboard/exercises/stats"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                📊 Estatísticas
              </Link>
              <Link
                href="/dashboard/workouts/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Treino
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Nome do exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as categorias</option>
                {EXERCISE_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_pt}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dificuldade</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as dificuldades</option>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>

            {/* Equipment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipamento</label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os equipamentos</option>
                {getAllEquipment().map(equipment => (
                  <option key={equipment} value={equipment}>
                    {equipment}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exercises Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExercises.map(exercise => (
              <div key={exercise.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {exercise.name_pt || exercise.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{exercise.muscle_primary}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                      {getDifficultyText(exercise.difficulty)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Equipamento:</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.equipment.map(equipment => (
                          <span key={equipment} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {equipment}
                          </span>
                        ))}
                      </div>
                    </div>

                    {exercise.tips && exercise.tips.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Dicas:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {exercise.tips.slice(0, 2).map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <Link
                        href={`/dashboard/exercises/${exercise.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Ver detalhes →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercício
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Músculo Principal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dificuldade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExercises.map(exercise => (
                    <tr key={exercise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {exercise.name_pt || exercise.name}
                          </div>
                          <div className="text-sm text-gray-500">{exercise.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {EXERCISE_CATEGORIES.find(cat => cat.id === exercise.category)?.name_pt || exercise.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{exercise.muscle_primary}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                          {getDifficultyText(exercise.difficulty)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {exercise.equipment.slice(0, 2).map(equipment => (
                            <span key={equipment} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {equipment}
                            </span>
                          ))}
                          {exercise.equipment.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{exercise.equipment.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/exercises/${exercise.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum exercício encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
} 