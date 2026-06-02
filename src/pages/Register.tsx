import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { setAuthToken } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.post("/auth/register", userData);
      return data;
    },
    onSuccess: (data) => {
      // Armazenar token no localStorage
      setAuthToken(data.token, data.refreshToken);
      setLocation("/onboarding"); // Redirect to onboarding after registration
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || "Erro ao registrar");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    registerMutation.mutate({ email, name, password });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center py-12 bg-gray-50">
      <div className="max-w-xl w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Crie sua conta
              </h1>
              <p className="text-gray-600">
                Comece seu trial gratuito de 7 dias sem cartão de crédito
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail profissional
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@empresa.com"
                  required
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar senha
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3"
                disabled={false}
              >
                Criar conta gratuita
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Já tem uma conta?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
                Faça login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
