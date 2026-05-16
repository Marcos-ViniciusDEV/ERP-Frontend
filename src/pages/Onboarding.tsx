import { useAuth } from "@/_core/hooks/useAuth";

export function Onboarding() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo!</h1>
        <p className="text-gray-600 mb-8">
          Olá {user?.name || 'usuário'}, estamos configurando seu ambiente.
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir para o Dashboard
        </button>
      </div>
    </div>
  );
}