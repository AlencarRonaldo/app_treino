'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddAcademyUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'instructor' | 'reception' | 'finance'>('instructor');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const newUser = {
      name,
      email,
      role,
    };

    // TODO: Implement API call to add new academy user
    console.log('Adding new academy user:', newUser);
    setMessage('Usuário adicionado com sucesso (mock)!');
    router.push('/dashboard/academy/users');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Adicionar Novo Usuário da Academia</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Função</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'instructor' | 'reception' | 'finance')}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          >
            <option value="instructor">Instrutor</option>
            <option value="admin">Admin</option>
            <option value="reception">Recepção</option>
            <option value="finance">Financeiro</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
          Adicionar Usuário
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
    </div>
  );
}
