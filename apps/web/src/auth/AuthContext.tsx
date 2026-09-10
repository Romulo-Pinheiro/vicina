import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, apiGet, apiPost } from '../services/apiClient';

export type Role = 'CIDADAO' | 'GESTOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  // true só durante a checagem inicial da sessão no boot do app (GET
  // /auth/me). O token vive num cookie httpOnly, invisível a este código —
  // essa checagem é a única forma de saber se existe uma sessão válida, não
  // dá pra só olhar se "tem token salvo" como antes com localStorage.
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<AuthUser>('/auth/me')
      .then(setUser)
      .catch((error: unknown) => {
        // 401 é o caso normal de "ninguém logado" (sem cookie, ou cookie
        // expirado) — não é uma falha a reportar, só significa "desloga".
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error('Falha ao restaurar sessão', error);
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedUser = await apiPost<AuthUser>('/auth/login', { email, password });
    setUser(loggedUser);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const newUser = await apiPost<AuthUser>('/auth/register', {
        name,
        email,
        password,
      });
      setUser(newUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } finally {
      // Limpa o estado local mesmo se a chamada falhar (ex.: rede fora) — o
      // usuário pediu pra sair, a UI não deve ficar presa numa sessão que
      // ele já não confirma mais, mesmo que o cookie no servidor persista
      // até expirar sozinho.
      setUser(null);
    }
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
