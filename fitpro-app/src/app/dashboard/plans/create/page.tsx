'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePlanPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [features, setFeatures] = useState<string>('');
  const [type, setType] = useState<'personal' | 'academy'>('personal');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const newPlan = {
      name,
      price,
      currency,
      features: features.split(',').map(f => f.trim()),
      type,
    };

    // TODO: Implement API call to create plan
    console.log('Creating new plan:', newPlan);
    setMessage('Plano criado com sucesso (mock)!');
    router.push('/dashboard/plans');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Criar Novo Plano</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Plano</label>
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
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Moeda</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          >
            <option value="USD">USD</option>
            <option value="BRL">BRL</option>
          </select>
        </div>

        <div>
          <label htmlFor="features" className="block text-sm font-medium text-gray-700">Funcionalidades (separadas por vírgula)</label>
          <textarea
            id="features"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={3}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          ></textarea>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Plano</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'personal' | 'academy')}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          >
            <option value="personal">Personal Trainer</option>
            <option value="academy">Academia</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
          Criar Plano
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
    </div>
  );
}
