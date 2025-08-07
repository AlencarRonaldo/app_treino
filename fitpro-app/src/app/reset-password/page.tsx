'use client';

import { useState } from 'react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    setMessage(data.message);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-4">Redefinir Senha</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded text-black"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Enviar Link de Redefinição
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
      <p className="mt-4">
        Lembrou da senha? <a href="/login" className="text-blue-500">Faça login</a>
      </p>
    </div>
  );
}
