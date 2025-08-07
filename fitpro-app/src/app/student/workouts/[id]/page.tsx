'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ExerciseDetail {
  id: string;
  name: string;
  videoUrl: string;
  sets: number;
  reps: number;
  load: string;
  completed: boolean;
}

interface WorkoutDetail {
  id: string;
  title: string;
  trainerName: string;
  scheduledDate: string;
  exercises: ExerciseDetail[];
}

export default function StudentWorkoutDetailPage() {
  const { id } = useParams();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // TODO: Fetch real workout details from API based on ID
      const mockWorkout: WorkoutDetail = {
        id: id as string,
        title: 'Treino de Exemplo',
        trainerName: 'Personal Exemplo',
        scheduledDate: '2025-08-05',
        exercises: [
          { id: 'e1', name: 'Agachamento', videoUrl: 'https://example.com/agachamento.mp4', sets: 3, reps: 10, load: '50kg', completed: false },
          { id: 'e2', name: 'Supino Reto', videoUrl: 'https://example.com/supino.mp4', sets: 4, reps: 8, load: '40kg', completed: false },
          { id: 'e3', name: 'Remada Curvada', videoUrl: 'https://example.com/remada.mp4', sets: 3, reps: 12, load: '30kg', completed: false },
        ],
      };
      setWorkout(mockWorkout);
      setLoading(false);
    }
  }, [id]);

  const handleToggleComplete = (exerciseId: string) => {
    if (workout) {
      setWorkout({
        ...workout,
        exercises: workout.exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
        )
      });
      // TODO: Update completion status in backend
    }
  };

  if (loading) {
    return <div className="p-8">Carregando treino...</div>;
  }

  if (!workout) {
    return <div className="p-8">Treino não encontrado.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{workout.title}</h1>
      <p className="text-gray-600 mb-2">Personal: {workout.trainerName}</p>
      <p className="text-gray-600 mb-6">Data: {workout.scheduledDate}</p>

      <h2 className="text-xl font-semibold mb-4">Exercícios</h2>
      <div className="space-y-4">
        {workout.exercises.map(exercise => (
          <div key={exercise.id} className="border p-4 rounded-md shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{exercise.name}</h3>
              <p className="text-gray-600">Séries: {exercise.sets}, Repetições: {exercise.reps}, Carga: {exercise.load}</p>
              {exercise.videoUrl && (
                <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Ver Vídeo
                </a>
              )}
            </div>
            <button
              onClick={() => handleToggleComplete(exercise.id)}
              className={`px-4 py-2 rounded-md ${exercise.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {exercise.completed ? 'Concluído' : 'Marcar como Concluído'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
