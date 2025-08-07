'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'reception' | 'finance';
  status: 'active' | 'inactive';
}

export default function AcademyUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // TODO: Fetch real users for the academy from API
    const mockUsers: User[] = [
      { id: 'u1', name: 'João Silva', email: 'joao@academia.com', role: 'admin', status: 'active' },
      { id: 'u2', name: 'Maria Souza', email: 'maria@academia.com', role: 'instructor', status: 'active' },
      { id: 'u3', name: 'Pedro Santos', email: 'pedro@academia.com', role: 'reception', status: 'active' },
      { id: 'u4', name: 'Ana Costa', email: 'ana@academia.com', role: 'finance', status: 'inactive' },
    ];
    setUsers(mockUsers);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestão de Usuários da Academia</h1>

      <div className="mb-6">
        <Link href="/dashboard/academy/users/add" className="bg-green-600 text-white p-3 rounded-md hover:bg-green-700">
          Adicionar Novo Usuário
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500">Nenhum usuário cadastrado para esta academia.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-sm">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Nome</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Função</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-black">{user.name}</td>
                  <td className="py-2 px-4 border-b text-black">{user.email}</td>
                  <td className="py-2 px-4 border-b text-black">{user.role}</td>
                  <td className="py-2 px-4 border-b text-black">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <Link href={`/dashboard/academy/users/${user.id}`} className="text-blue-500 hover:underline mr-2">
                      Editar
                    </Link>
                    {/* TODO: Add delete functionality */}
                    <button className="text-red-500 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
