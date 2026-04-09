import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, clearAuthStorage, getToken, readAuthMeta, saveAuth } from '../api/client';

type AuthState = {
  token: string | null;
  role: string;
  username: string;
  fullName: string;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: getToken(),
    ...readAuthMeta(),
  }));

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{
      accessToken: string;
      role: string;
      username: string;
      fullName: string;
    }>('/api/auth/login', { username: username.trim(), password });
    saveAuth(data.accessToken, data.role, data.username, data.fullName);
    setState({
      token: data.accessToken,
      role: data.role,
      username: data.username,
      fullName: data.fullName,
    });
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setState({ token: null, role: '', username: '', fullName: '' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      login,
      logout,
    }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
