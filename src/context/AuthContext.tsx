import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Doctor, Role } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  doctorProfile?: Doctor;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  register: (data: Record<string, any>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | undefined>(undefined);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    if (!token) {
      setUser(null);
      setDoctorProfile(undefined);
      setIsLoading(false);
      return;
    }
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      setDoctorProfile(data.doctorProfile);
    } catch (err) {
      console.error('Failed to authenticate stored token:', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setDoctorProfile(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password: pass });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setDoctorProfile(res.doctorProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: Role) => {
    setIsLoading(true);
    try {
      let email = 'john.doe@gmail.com';
      let pass = 'patient123';

      if (role === 'doctor') {
        email = 'dr.smith@bookadoctor.com';
        pass = 'doctor123';
      } else if (role === 'admin') {
        email = 'admin@bookadoctor.com';
        pass = 'admin123';
      }

      const res = await authService.login({ email, password: pass });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setDoctorProfile(res.doctorProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setDoctorProfile(res.doctorProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDoctorProfile(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctorProfile,
        token,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
