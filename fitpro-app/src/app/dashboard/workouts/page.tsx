'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Workout {
  id: string;
  title: string;
  studentName: string;
  scheduledDate: string;
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    // TODO: Fetch real workouts from API
    const mockWorkouts: Workout[] = [
      { id: 'w1', title: 'Treino de Força - Aluno A', studentName: 'Aluno A', scheduledDate: '2025-08-05' },
      { id: 'w2', title: 'Treino de Resistência - Aluno B', studentName: 'Aluno B', scheduledDate: '2025-08-06' },
    ];
    setWorkouts(mockWorkouts);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Meus Treinos</h1>
      <div className="mb-6">
        <Link href="/dashboard/workouts/create" className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
          Criar Novo Treino
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-gray-500">Nenhum treino encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map(workout => (
            <div key={workout.id} className="border p-4 rounded-md shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{workout.title}</h2>
              <p className="text-gray-600">Aluno: {workout.studentName}</p>
              <p className="text-gray-600">Data: {workout.scheduledDate}</p>
              {/* TODO: Add link to view/edit workout details */}
              <Link href={`/dashboard/workouts/${workout.id}`} className="text-blue-500 hover:underline mt-2 block">
                Ver Detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
