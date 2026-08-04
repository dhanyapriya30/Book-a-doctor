/**
 * Core Data Models & Types for "Book a Doctor" Healthcare System
 */

export type Role = 'patient' | 'doctor' | 'admin';

export type DoctorStatus = 'pending' | 'approved' | 'rejected';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  createdAt: string;
  isActive?: boolean;
}

export interface DayAvailability {
  day: string; // e.g. 'Monday', 'Tuesday', 'Wednesday'
  slots: string[]; // e.g. ['09:00 AM', '10:00 AM', '02:00 PM']
}

export interface Doctor {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  bio: string;
  hospital: string;
  location: string;
  rating: number;
  reviewCount: number;
  status: DoctorStatus;
  availability: DayAvailability[];
  createdAt: string;
}

export interface MedicalDocument {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string; // user name or role
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorHospital: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM"
  status: AppointmentStatus;
  symptoms: string;
  notes?: string;
  documents: MedicalDocument[];
  consultationFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  doctorProfile?: Doctor;
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  pendingDoctorVerifications: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}
