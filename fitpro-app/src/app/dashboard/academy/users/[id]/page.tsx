'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'reception' | 'finance';
  status: 'active' | 'inactive';
}

export default function EditAcademyUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'instructor' | 'reception' | 'finance'>('instructor');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // TODO: Fetch real user details from API based on ID
      const mockUser: UserDetail = {
        id: id as string,
        name: 'Usuário Teste',
        email: 'usuario.teste@academia.com',
        role: 'instructor',
        status: 'active',
      };
      setUser(mockUser);
      setName(mockUser.name);
      setEmail(mockUser.email);
      setRole(mockUser.role);
      setStatus(mockUser.status);
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const updatedUser = {
      id,
      name,
      email,
      role,
      status,
    };

    // TODO: Implement API call to update academy user
    console.log('Updating user:', updatedUser);
    setMessage('Usuário atualizado com sucesso (mock)!');
    router.push('/dashboard/academy/users');
  };

  if (loading) {
    return <div className="p-8">Carregando detalhes do usuário...</div>;
  }

  if (!user) {
    return <div className="p-8">Usuário não encontrado.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Editar Usuário da Academia</h1>
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

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
          Atualizar Usuário
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
    </div>
  );
}
