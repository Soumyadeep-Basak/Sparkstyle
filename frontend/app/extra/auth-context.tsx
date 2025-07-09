import React, { createContext, useContext, useState, ReactNode } from 'react';
import { signup as apiSignup, login as apiLogin } from '@/constants/Api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  signup: async () => {},
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const signup = async (name: string, email: string, password: string) => {
    await apiSignup({ name, email, password });
    await login(email, password);
  };

  const login = async (email: string, password: string) => {
    const data = await apiLogin({ email, password });
    setUser(data.user);
    setToken(data.access_token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 