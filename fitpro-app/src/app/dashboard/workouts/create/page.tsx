'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exercise, WorkoutExercise, exerciseLibrary, EXERCISE_CATEGORIES } from '@/lib/exercise-library';

export default function CreateWorkoutPage() {
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar exercícios da biblioteca
    setExercises(exerciseLibrary.getAllExercises());
    setLoading(false);
  }, []);

  const categories = [
    { id: 'all', name: 'Todos', name_pt: 'Todos' },
    ...EXERCISE_CATEGORIES
  ];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.name_pt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addExerciseToWorkout = (exercise: Exercise) => {
    const workoutExercise: WorkoutExercise = {
      exercise,
      sets: 3,
      reps: '10-12',
      rest: '60s',
      notes: ''
    };
    setSelectedExercises([...selectedExercises, workoutExercise]);
  };

  const removeExerciseFromWorkout = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: string | number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    setSelectedExercises(updatedExercises);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      alert('Digite um nome para o treino');
      return;
    }

    if (selectedExercises.length === 0) {
      alert('Adicione pelo menos um exercício');
      return;
    }

    try {
      const response = await fetch('/api/workouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: workoutName,
          description: workoutDescription,
          exercises: selectedExercises
        }),
      });

      if (response.ok) {
        alert('Treino criado com sucesso!');
        // Redirecionar para lista de treinos
        window.location.href = '/dashboard/workouts';
      } else {
        alert('Erro ao criar treino');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Erro ao salvar treino');
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Criar Novo Treino</h1>
            <Link href="/dashboard/workouts" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Voltar aos Treinos
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Exercise Library */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Biblioteca de Exercícios</h2>
            
            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <input 
                type="text" 
                placeholder="Buscar exercícios..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name_pt}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredExercises.map(exercise => (
                <div key={exercise.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{exercise.name_pt || exercise.name}</h3>
                      <p className="text-sm text-gray-600">{exercise.muscle_primary}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {exercise.difficulty === 'beginner' ? 'Iniciante' :
                           exercise.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                        </span>
                        <span className="text-xs text-gray-500">{exercise.equipment.join(', ')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="ml-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Workout Builder */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Construtor de Treino</h2>
            
            {/* Workout Details */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Treino</label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                  placeholder="Descrição do treino..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Selected Exercises */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Exercícios Selecionados ({selectedExercises.length})</h3>
              {selectedExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏋️</div>
                  <p>Nenhum exercício selecionado</p>
                  <p className="text-sm">Adicione exercícios da biblioteca</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedExercises.map((workoutExercise, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {workoutExercise.exercise.name_pt || workoutExercise.exercise.name}
                        </h4>
                        <button
                          onClick={() => removeExerciseFromWorkout(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Séries</label>
                          <input
                            type="number"
                            value={workoutExercise.sets}
                            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            min="1"
                            max="10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Repetições</label>
                          <input
                            type="text"
                            value={workoutExercise.reps}
                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                            placeholder="10-12"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Descanso</label>
                          <input
                            type="text"
                            value={workoutExercise.rest}
                            onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                            placeholder="60s"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg)</label>
                          <input
                            type="number"
                            value={workoutExercise.weight || ''}
                            onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                        <input
                          type="text"
                          value={workoutExercise.notes || ''}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          placeholder="Observações sobre o exercício..."
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveWorkout}
              disabled={selectedExercises.length === 0 || !workoutName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Treino
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
