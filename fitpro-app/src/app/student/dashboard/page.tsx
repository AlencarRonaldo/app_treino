'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Workout {
  id: string;
  title: string;
  trainerName: string;
  scheduledDate: string;
  completed: boolean;
}

export default function StudentDashboardPage() {
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<Workout[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    // TODO: Fetch real workouts for the student from API
    const mockUpcoming: Workout[] = [
      { id: 'sw1', title: 'Treino de Pernas e Glúteos', trainerName: 'Personal João', scheduledDate: '2025-08-05', completed: false },
      { id: 'sw2', title: 'Treino de Braços e Abdômen', trainerName: 'Personal João', scheduledDate: '2025-08-07', completed: false },
    ];
    const mockCompleted: Workout[] = [
      { id: 'sc1', title: 'Treino de Peito e Costas', trainerName: 'Personal João', scheduledDate: '2025-08-03', completed: true },
    ];
    setUpcomingWorkouts(mockUpcoming);
    setCompletedWorkouts(mockCompleted);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Meu Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Próximos Treinos</h2>
        {upcomingWorkouts.length === 0 ? (
          <p className="text-gray-500">Nenhum treino agendado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingWorkouts.map(workout => (
              <div key={workout.id} className="border p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-medium mb-1">{workout.title}</h3>
                <p className="text-gray-600">Personal: {workout.trainerName}</p>
                <p className="text-gray-600">Data: {workout.scheduledDate}</p>
                <Link href={`/student/workouts/${workout.id}`} className="text-blue-500 hover:underline mt-2 block">
                  Ver Treino
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Treinos Concluídos</h2>
        {completedWorkouts.length === 0 ? (
          <p className="text-gray-500">Nenhum treino concluído ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedWorkouts.map(workout => (
              <div key={workout.id} className="border p-4 rounded-md shadow-sm opacity-70">
                <h3 className="text-lg font-medium mb-1">{workout.title}</h3>
                <p className="text-gray-600">Personal: {workout.trainerName}</p>
                <p className="text-gray-600">Data: {workout.scheduledDate}</p>
                <p className="text-green-600 font-semibold">Concluído</p>
                <Link href={`/student/workouts/${workout.id}`} className="text-blue-500 hover:underline mt-2 block">
                  Ver Detalhes
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
