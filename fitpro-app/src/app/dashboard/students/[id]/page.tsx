'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  status: 'ativo' | 'inativo';
  lastActivity: string;
  workouts: { id: string; title: string; scheduledDate: string; completed: boolean }[];
  progressMetrics: { date: string; weight: number; bodyFat: number }[];
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // TODO: Fetch real student details from API based on ID
      const mockStudent: StudentDetail = {
        id: id as string,
        name: 'Aluno Exemplo',
        email: 'aluno.exemplo@email.com',
        status: 'ativo',
        lastActivity: '1 hora atrás',
        workouts: [
          { id: 'w1', title: 'Treino A - Força', scheduledDate: '2025-08-01', completed: true },
          { id: 'w2', title: 'Treino B - Resistência', scheduledDate: '2025-08-03', completed: false },
        ],
        progressMetrics: [
          { date: '2025-07-01', weight: 75, bodyFat: 18 },
          { date: '2025-08-01', weight: 74, bodyFat: 17.5 },
        ],
      };
      setStudent(mockStudent);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="p-8">Carregando detalhes do aluno...</div>;
  }

  if (!student) {
    return <div className="p-8">Aluno não encontrado.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Aluno: {student.name}</h1>
      <p className="text-gray-600 mb-2">Email: {student.email}</p>
      <p className="text-gray-600 mb-2">Status: <span className={student.status === 'ativo' ? 'text-green-500' : 'text-red-500'}>{student.status}</span></p>
      <p className="text-gray-600 mb-6">Última Atividade: {student.lastActivity}</p>

      <h2 className="text-xl font-semibold mb-4">Treinos Atribuídos</h2>
      {student.workouts.length === 0 ? (
        <p className="text-gray-500">Nenhum treino atribuído.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {student.workouts.map(workout => (
            <div key={workout.id} className="border p-3 rounded-md shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-medium">{workout.title}</h3>
                <p className="text-gray-600 text-sm">Data: {workout.scheduledDate}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${workout.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {workout.completed ? 'Concluído' : 'Pendente'}
              </span>
              {/* TODO: Add link to view/edit workout details */}
              <Link href={`/dashboard/workouts/${workout.id}`} className="text-blue-500 hover:underline">
                Ver Treino
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Métricas de Progresso</h2>
      {student.progressMetrics.length === 0 ? (
        <p className="text-gray-500">Nenhuma métrica de progresso registrada.</p>
      ) : (
        <div className="space-y-3">
          {student.progressMetrics.map((metric, index) => (
            <div key={index} className="border p-3 rounded-md shadow-sm">
              <p className="font-medium">Data: {metric.date}</p>
              <p className="text-gray-600">Peso: {metric.weight} kg</p>
              <p className="text-gray-600">Percentual de Gordura: {metric.bodyFat}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
