'use client';

import { useState, useEffect } from 'react';

export default function WhiteLabelSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TODO: Fetch current white label settings from API
    const mockSettings = {
      logoUrl: '/placeholder-logo.png',
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
    };
    setLogoUrl(mockSettings.logoUrl);
    setPrimaryColor(mockSettings.primaryColor);
    setSecondaryColor(mockSettings.secondaryColor);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const settings = {
      logoUrl,
      primaryColor,
      secondaryColor,
    };

    // TODO: Implement API call to save white label settings
    console.log('Saving white label settings:', settings);
    setMessage('Configurações de White Label salvas com sucesso (mock)!');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Configurações de White Label</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">URL do Logo</label>
          <input
            type="text"
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          />
          {logoUrl && <img src={logoUrl} alt="Preview do Logo" className="mt-2 h-20" />}
        </div>

        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">Cor Primária</label>
          <input
            type="color"
            id="primaryColor"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">Cor Secundária</label>
          <input
            type="color"
            id="secondaryColor"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <button type="submit" className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
          Salvar Configurações
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
    </div>
  );
}
