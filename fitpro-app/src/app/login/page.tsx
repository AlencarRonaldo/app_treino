'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLoginFormPersistence } from '@/hooks/useFormPersistence';
import { MagicCard } from '@/components/magicui/magic-card';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { Particles } from '@/components/magicui/particles';
import { Eye, EyeOff, Lock, Mail, Zap, Sparkles, Shield, User, Crown, Target, Award } from 'lucide-react';

export default function LoginPage() {
  const { email, password, setEmail, setPassword, clearForm, clearOnSubmit } = useLoginFormPersistence();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        clearOnSubmit();
        // Redirecionar para dashboard após login bem-sucedido
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setMessage(data.message || 'Erro no login');
      }
    } catch (error) {
      setMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('test@fitpro.com');
    setPassword('test123');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.4),transparent)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>

      <Particles className="absolute inset-0" quantity={80} ease={30} color="#ffffff" />

      <NeonGradientCard className="relative z-10 p-8 rounded-3xl shadow-2xl w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Bem-vindo ao FitPro
          </h1>
          <p className="text-white/60 text-lg">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/40" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="Digite seu email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/40" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-white/40 hover:text-white/60 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-white/40 hover:text-white/60 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/20"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Entrando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Zap className="w-5 h-5 mr-2" />
                Entrar
              </div>
            )}
          </button>
        </form>

        {/* Test Credentials Section */}
        <MagicCard className="mt-8 bg-white/10 backdrop-blur-xl border border-white/20">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-white/10 rounded-lg mr-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold">Credenciais de Teste</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Email:</span>
                <span className="text-white font-mono">test@fitpro.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Senha:</span>
                <span className="text-white font-mono">test123</span>
              </div>
            </div>
            <button
              onClick={fillTestCredentials}
              className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/20"
            >
              Preencher Automaticamente
            </button>
          </div>
        </MagicCard>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center text-sm font-medium ${
            message.includes('sucesso') 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </NeonGradientCard>
    </div>
  );
}
