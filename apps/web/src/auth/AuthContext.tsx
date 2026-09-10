import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiGet, apiPost, clearToken, getToken, setToken } from '../services/apiClient';

export type Role = 'CIDADAO' | 'GESTOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  // true só durante a checagem inicial de uma sessão salva (token no
  // localStorage) contra GET /auth/me — não é um loading genérico de UI.
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Só começa true se já existe um token salvo — sem token não há sessão pra
  // restaurar, a UI já pode renderizar como "deslogado" de cara.
  const [loading, setLoading] = useState<boolean>(() => getToken() !== null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }
    apiGet<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => {
        // Token expirado/inválido (ou usuário removido) — a própria API já
        // rejeitou, então limpa em vez de deixar a UI presa numa sessão morta.
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const applyAuthResult = useCallback((result: AuthResult) => {
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiPost<AuthResult>('/auth/login', { email, password });
      applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await apiPost<AuthResult>('/auth/register', {
        name,
        email,
        password,
      });
      applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  }
  return context;
}
