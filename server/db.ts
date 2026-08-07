import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import type { User, Doctor, Appointment, Review } from '../src/types';

export interface DBData {
  users: User[];
  passwords: Record<string, string>;
  doctors: Doctor[];
  appointments: Appointment[];
  reviews: Review[];
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/book-a-doctor';
const MONGODB_DB = process.env.MONGODB_DB || 'book-a-doctor';

interface UserDocument extends User {
  passwordHash?: string;
}

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    createdAt: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    passwordHash: { type: String },
  },
  { timestamps: true }
);

const doctorSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    avatar: { type: String },
    specialization: { type: String, required: true },
    qualifications: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    consultationFee: { type: Number, required: true },
    bio: { type: String },
    hospital: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, required: true },
    reviewCount: { type: Number, required: true },
    status: { type: String, required: true },
    availability: { type: Array, default: [] },
    createdAt: { type: String, required: true },
  },
  { timestamps: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorSpecialization: { type: String, required: true },
    doctorHospital: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, required: true },
    symptoms: { type: String },
    notes: { type: String },
    documents: { type: Array, default: [] },
    consultationFee: { type: Number, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

const passwordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
export const DoctorModel = mongoose.model('Doctor', doctorSchema);
export const AppointmentModel = mongoose.model('Appointment', appointmentSchema);
export const ReviewModel = mongoose.model('Review', reviewSchema);
export const PasswordModel = mongoose.model('PasswordRecord', passwordSchema);

let mongoConnected = false;
let mongoConnectionError: string | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(MONGODB_URI);
}

export function isMongoConnected(): boolean {
  return mongoConnected;
}

export function getMongoConnectionError(): string | null {
  return mongoConnectionError;
}

export async function connectDatabase(): Promise<boolean> {
  if (!MONGODB_URI) {
    console.log('No MONGODB_URI configured. Falling back to JSON file persistence.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    mongoConnected = true;
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,
    });
    mongoConnected = true;
    mongoConnectionError = null;
    console.log(`MongoDB connected successfully to database '${MONGODB_DB}'.`);
    return true;
  } catch (error) {
    mongoConnected = false;
    mongoConnectionError = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    console.error('MongoDB connection failed. Falling back to JSON file persistence.', error);
    return false;
  }
}

export async function loadFromMongo(): Promise<DBData | null> {
  if (!mongoConnected) {
    return null;
  }

  try {
    const [users, doctors, appointments, reviews, passwordDocs] = await Promise.all([
      UserModel.find({}).lean(),
      DoctorModel.find({}).lean(),
      AppointmentModel.find({}).lean(),
      ReviewModel.find({}).lean(),
      PasswordModel.find({}).lean(),
    ]);

    const passwords = Object.fromEntries(
      (passwordDocs as Array<{ userId: string; hashedPassword: string }>).map((record) => [record.userId, record.hashedPassword])
    );

    return {
      users: users as User[],
      passwords,
      doctors: doctors as Doctor[],
      appointments: appointments as Appointment[],
      reviews: reviews as Review[],
    };
  } catch (error) {
    console.error('Failed to load data from MongoDB.', error);
    return null;
  }
}

export async function saveToMongo(data: DBData): Promise<void> {
  if (!mongoConnected) {
    return;
  }

  try {
    await UserModel.deleteMany({});
    await DoctorModel.deleteMany({});
    await AppointmentModel.deleteMany({});
    await ReviewModel.deleteMany({});
    await PasswordModel.deleteMany({});

    await UserModel.insertMany(
      data.users.map((user) => ({ ...user, passwordHash: undefined }))
    );
    await DoctorModel.insertMany(data.doctors);
    await AppointmentModel.insertMany(data.appointments);
    await ReviewModel.insertMany(data.reviews);
    await PasswordModel.insertMany(
      Object.entries(data.passwords).map(([userId, hashedPassword]) => ({
        userId,
        hashedPassword,
      }))
    );
  } catch (error) {
    console.error('Failed to persist data to MongoDB.', error);
    throw error;
  }
}

export function getJsonFilePath(baseDir: string, fileName: string): string {
  return path.join(baseDir, fileName);
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
