import axios from 'axios';
import {
  User,
  Doctor,
  Appointment,
  AuthResponse,
  AdminStats,
  DayAvailability,
} from '../types';

// Create base Axios instance
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Services
export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  register: async (userData: Record<string, any>): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },
  getCurrentUser: async (): Promise<{ user: User; doctorProfile?: Doctor }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Doctor Services
export const doctorService = {
  getDoctors: async (params?: {
    search?: string;
    specialization?: string;
    status?: string;
  }): Promise<Doctor[]> => {
    const response = await api.get<Doctor[]>('/doctors', { params });
    return response.data;
  },
  getDoctorById: async (id: string): Promise<{ doctor: Doctor; reviews: any[] }> => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },
  updateAvailability: async (id: string, availability: DayAvailability[]): Promise<Doctor> => {
    const response = await api.put(`/doctors/${id}/availability`, { availability });
    return response.data.doctor;
  },
};

// Appointment Services
export const appointmentService = {
  getAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>('/appointments');
    return response.data;
  },
  bookAppointment: async (data: {
    doctorId: string;
    date: string;
    timeSlot: string;
    symptoms: string;
    patientName?: string;
    patientPhone?: string;
  }): Promise<Appointment> => {
    const response = await api.post<{ message: string; appointment: Appointment }>(
      '/appointments',
      data
    );
    return response.data.appointment;
  },
  updateStatus: async (
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    notes?: string
  ): Promise<Appointment> => {
    const response = await api.put<{ appointment: Appointment }>(
      `/appointments/${id}/status`,
      { status, notes }
    );
    return response.data.appointment;
  },
  uploadDocument: async (appointmentId: string, file: File): Promise<Appointment> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post<{ appointment: Appointment }>(
      `/appointments/${appointmentId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.appointment;
  },
  deleteDocument: async (appointmentId: string, docId: string): Promise<Appointment> => {
    const response = await api.delete<{ appointment: Appointment }>(
      `/appointments/${appointmentId}/documents/${docId}`
    );
    return response.data.appointment;
  },
};

// Admin Services
export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },
  getPendingDoctors: async (): Promise<Doctor[]> => {
    const response = await api.get<Doctor[]>('/admin/doctors/pending');
    return response.data;
  },
  verifyDoctor: async (doctorId: string, status: 'approved' | 'rejected'): Promise<Doctor> => {
    const response = await api.put<{ doctor: Doctor }>(`/admin/doctors/${doctorId}/verify`, {
      status,
    });
    return response.data.doctor;
  },
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },
  setUserStatus: async (userId: string, isActive: boolean): Promise<User> => {
    const response = await api.put<{ user: User }>(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data.user;
  },
};

// Utility Services
export const systemService = {
  seedDatabase: async (): Promise<{ message: string }> => {
    const response = await api.post('/seed');
    return response.data;
  },
};
