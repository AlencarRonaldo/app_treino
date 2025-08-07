'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  lastActivity: string;
  status: 'ativo' | 'inativo';
}

export default function PersonalDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    // TODO: Fetch real students from API
    const mockStudents: Student[] = [
      { id: 's1', name: 'Aluno A', lastActivity: '2 dias atrás', status: 'ativo' },
      { id: 's2', name: 'Aluno B', lastActivity: '1 hora atrás', status: 'ativo' },
      { id: 's3', name: 'Aluno C', lastActivity: '1 semana atrás', status: 'inativo' },
    ];
    setStudents(mockStudents);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard do Personal</h1>

      <div className="mb-6">
        <Link href="/dashboard/workouts/create" className="bg-green-600 text-white p-3 rounded-md hover:bg-green-700">
          Criar Novo Treino
        </Link>
      </div>

      <h2 className="text-xl font-semibold mb-4">Meus Alunos</h2>
      {students.length === 0 ? (
        <p className="text-gray-500">Nenhum aluno cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <div key={student.id} className="border p-4 rounded-md shadow-sm">
              <h3 className="text-lg font-medium mb-1">{student.name}</h3>
              <p className="text-gray-600">Status: {student.status}</p>
              <p className="text-gray-600">Última Atividade: {student.lastActivity}</p>
              {/* TODO: Add link to view student progress/details */}
              <Link href={`/dashboard/students/${student.id}`} className="text-blue-500 hover:underline mt-2 block">
                Ver Detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}