import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { setAuthToken } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      console.log("[Login] Sending credentials:", credentials);
      try {
        const response = await api.post("/auth/login", credentials);
        console.log("[Login] Response received:", response);
        console.log("[Login] Response data:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("[Login] Request failed:", error);
        console.error("[Login] Error response:", error.response);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[Login] onSuccess called with data:", data);
      // Armazenar token no localStorage
      setAuthToken(data.token);
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("[Login] onError called:", error);
      setError(error.response?.data?.error || "Erro ao fazer login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Entre com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>


          </form>
        </CardContent>
      </Card>
    </div>
  );
}
