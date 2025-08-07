import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="animate-fade-in mb-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">FitPro</span>
            </h1>
          </div>
          <div className="animate-slide-up">
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              A plataforma completa para personal trainers e academias gerenciarem treinos, 
              acompanharem progresso e conectarem com seus alunos de forma profissional.
            </p>
          </div>
          <div className="animate-bounce-in flex gap-4 justify-center flex-wrap">
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Entrar
            </Link>
            <Link 
              href="/signup" 
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              Criar Conta
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="text-blue-600 text-4xl mb-4">💪</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Criação de Treinos</h3>
            <p className="text-gray-600 leading-relaxed">
              Crie treinos personalizados com drag & drop, exercícios organizados e instruções detalhadas para cada aluno.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="text-blue-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Acompanhamento</h3>
            <p className="text-gray-600 leading-relaxed">
              Visualize o progresso dos alunos com gráficos interativos, métricas detalhadas e relatórios personalizados.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
            <div className="text-blue-600 text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Comunicação</h3>
            <p className="text-gray-600 leading-relaxed">
              Chat integrado para tirar dúvidas, enviar lembretes e manter contato direto com os alunos.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Personal Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">10k+</div>
            <div className="text-gray-600">Alunos Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">50k+</div>
            <div className="text-gray-600">Treinos Criados</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4.9★</div>
            <div className="text-gray-600">Avaliação Média</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-2xl text-center shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Pronto para revolucionar seus treinos?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a centenas de personal trainers que já estão usando o FitPro para escalar seus negócios
          </p>
          <Link 
            href="/signup" 
            className="bg-white text-blue-600 px-10 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-block shadow-lg"
          >
            Começar Agora - Grátis
          </Link>
        </div>
      </div>
    </main>
  );
}