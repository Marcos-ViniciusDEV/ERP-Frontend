/**
 * @module useAuth
 * @description Hook principal de autenticação JWT para toda a aplicação
 *
 * Gerencia o ciclo completo de autenticação:
 * - **Login/Logout**: Armazena token JWT no localStorage
 * - **Verificação de usuário**: Consulta tRPC auth.me para dados do usuário logado
 * - **Renovação automática**: Renova token a cada 24h para evitar logout
 * - **Redirecionamento**: Redireciona para /login se não autenticado (opcional)
 * - **Cache inteligente**: Mantém dados do usuário em cache por 5 minutos
 *
 * @example
 * // Em páginas protegidas:
 * const { user, isAuthenticated, loading, logout } = useAuth({
 *   redirectOnUnauthenticated: true
 * });
 *
 * if (loading) return <div>Carregando...</div>;
 * return <div>Bem-vindo, {user?.name}!</div>;
 *
 * // Para fazer logout:
 * <button onClick={logout}>Sair</button>
 */

import { api, getRefreshToken, refreshSessionToken, setSessionTokens } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  /** Se true, redireciona para redirectPath quando não autenticado */
  redirectOnUnauthenticated?: boolean;
  /** Caminho para redirecionar quando não autenticado (padrão: /login) */
  redirectPath?: string;
};

const TOKEN_KEY = "auth_token";

/**
 * Define ou remove o token de autenticação do localStorage
 * @param token - Token JWT ou null para remover
 */
export const setAuthToken = (token: string | null, refreshToken?: string | null) => {
  setSessionTokens(token, refreshToken);
};

/**
 * Recupera o token JWT do localStorage
 * @returns Token JWT ou null se não existir
 */
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Hook de autenticação com gerenciamento completo de sessão JWT
 *
 * @param options - Configurações opcionais de redirecionamento
 * @returns Estado de autenticação e funções de controle
 *
 * @property user - Dados do usuário logado ou null
 * @property loading - Indica se está carregando dados de auth
 * @property error - Erro de autenticação se houver
 * @property isAuthenticated - true se usuário está autenticado
 * @property refresh - Função para recarregar dados do usuário
 * @property logout - Função para fazer logout (limpa token e cache)
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      try {
        const { data } = await api.get("/auth/me");
        return data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Manter dados por 5 minutos
    gcTime: 10 * 60 * 1000, // Manter cache por 10 minutos
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const token = await refreshSessionToken();
      return token ? { token } : null;
    },
    onSuccess: (data: any) => {
      if (data?.token) {
        setAuthToken(data.token);
        queryClient.setQueryData(["auth", "me"], data.user);
      }
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Ignore errors on logout
    } finally {
      setAuthToken(null);
      queryClient.setQueryData(["auth", "me"], null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  }, [logoutMutation, queryClient]);

  const state = useMemo(() => {
    if (meQuery.data) {
        localStorage.setItem("auth-user", JSON.stringify(meQuery.data));
    }
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    // Avoid redirect loop if already on login page (or register)
    if (window.location.pathname === "/register") return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  // Renova antes da expiracao padrao de 4 horas.
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(
      () => {
        refreshMutation.mutate();
      },
      3 * 60 * 60 * 1000
    );

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, refreshMutation]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
