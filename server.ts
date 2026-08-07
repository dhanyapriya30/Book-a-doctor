import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DOCTORS, INITIAL_REVIEWS } from './src/data/seedData';
import {
  User,
  Doctor,
  Appointment,
  Review,
  Role,
  MedicalDocument,
  AdminStats,
} from './src/types';
import {
  connectDatabase,
  getJsonFilePath,
  ensureDirectoryExists,
  isMongoConfigured,
  isMongoConnected,
  loadFromMongo,
  saveToMongo,
  type DBData,
} from './server/db';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-strong-secret';
const DB_FILE = getJsonFilePath(process.cwd(), process.env.DB_FILE || 'data-store.json');
const UPLOADS_DIR = getJsonFilePath(process.cwd(), process.env.UPLOADS_DIR || 'uploads');

// Ensure uploads folder exists
ensureDirectoryExists(UPLOADS_DIR);

// Multer storage setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});
const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed.'));
  },
});

let db: DBData = {
  users: [],
  passwords: {},
  doctors: [],
  appointments: [],
  reviews: [],
};

function hasPersistedData(data: DBData): boolean {
  return (
    data.users.length > 0 ||
    Object.keys(data.passwords).length > 0 ||
    data.doctors.length > 0 ||
    data.appointments.length > 0 ||
    data.reviews.length > 0
  );
}

// Data persistence helper functions
async function loadDatabase(): Promise<void> {
  try {
    if (isMongoConfigured()) {
      const connected = await connectDatabase();
      if (connected) {
        const mongoData = await loadFromMongo();
        if (mongoData && hasPersistedData(mongoData)) {
          db = mongoData;
          console.log('Database loaded successfully from MongoDB.');
          return;
        }

        if (mongoData) {
          console.log('MongoDB connection successful but no data was found. Seeding initial records.');
          seedDatabase();
          await saveDatabase();
          return;
        }
      }
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      console.log('Database loaded successfully from file.');
    } else {
      seedDatabase();
    }
  } catch (err) {
    console.error('Error loading database, re-seeding:', err);
    seedDatabase();
  }
}

async function saveDatabase(): Promise<void> {
  try {
    if (isMongoConfigured() && isMongoConnected()) {
      await saveToMongo(db);
      return;
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database.', err);
  }
}

function seedDatabase(): void {
  const salt = bcrypt.genSaltSync(10);
  const patientPassword = bcrypt.hashSync('patient123', salt);
  const doctorPassword = bcrypt.hashSync('doctor123', salt);
  const adminPassword = bcrypt.hashSync('admin123', salt);

  const now = new Date().toISOString();

  // Create Users
  const adminUser: User = {
    _id: 'usr_admin',
    name: 'Healthcare Admin',
    email: 'admin@bookadoctor.com',
    role: 'admin',
    phone: '+1 (800) 555-0199',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: now,
    isActive: true,
  };

  const patient1: User = {
    _id: 'usr_patient_1',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    role: 'patient',
    phone: '+1 (555) 111-2233',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: now,
    isActive: true,
  };

  const patient2: User = {
    _id: 'usr_patient_2',
    name: 'Sarah Connor',
    email: 'sarah.connor@gmail.com',
    role: 'patient',
    phone: '+1 (555) 999-8877',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    createdAt: now,
    isActive: true,
  };

  const usersList: User[] = [adminUser, patient1, patient2];
  const passwordsDict: Record<string, string> = {
    [adminUser._id]: adminPassword,
    [patient1._id]: patientPassword,
    [patient2._id]: patientPassword,
  };

  const doctorsList: Doctor[] = [];

  INITIAL_DOCTORS.forEach((docData, idx) => {
    const userId = `usr_doctor_${idx + 1}`;
    const docId = `doc_${idx + 1}`;

    const userObj: User = {
      _id: userId,
      name: docData.name,
      email: docData.email,
      role: 'doctor',
      phone: docData.phone,
      avatar: docData.avatar,
      createdAt: now,
      isActive: true,
    };

    usersList.push(userObj);
    passwordsDict[userId] = doctorPassword;

    doctorsList.push({
      _id: docId,
      userId,
      ...docData,
      createdAt: now,
    });
  });

  // Seed initial appointments
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const initialAppointments: Appointment[] = [
    {
      _id: 'apt_1',
      patientId: patient1._id,
      doctorId: doctorsList[0]._id, // Dr. Sarah Smith
      patientName: patient1.name,
      patientEmail: patient1.email,
      patientPhone: patient1.phone || '',
      doctorName: doctorsList[0].name,
      doctorSpecialization: doctorsList[0].specialization,
      doctorHospital: doctorsList[0].hospital,
      date: tomorrow,
      timeSlot: '10:00 AM',
      status: 'confirmed',
      symptoms: 'Experiencing mild chest tightness after exercise and elevated blood pressure readings.',
      consultationFee: doctorsList[0].consultationFee,
      documents: [
        {
          id: 'doc_ref_1',
          name: 'ECG_Report_July.pdf',
          fileUrl: '/uploads/sample-ecg.pdf',
          mimeType: 'application/pdf',
          size: 1024500,
          uploadedAt: now,
          uploadedBy: patient1.name,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'apt_2',
      patientId: patient2._id,
      doctorId: doctorsList[1]._id, // Dr. Rajesh Patel
      patientName: patient2.name,
      patientEmail: patient2.email,
      patientPhone: patient2.phone || '',
      doctorName: doctorsList[1].name,
      doctorSpecialization: doctorsList[1].specialization,
      doctorHospital: doctorsList[1].hospital,
      date: today,
      timeSlot: '02:00 PM',
      status: 'pending',
      symptoms: 'Persistent skin rash on forearm with redness and swelling.',
      consultationFee: doctorsList[1].consultationFee,
      documents: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'apt_3',
      patientId: patient1._id,
      doctorId: doctorsList[2]._id, // Dr. Emily Chen
      patientName: patient1.name,
      patientEmail: patient1.email,
      patientPhone: patient1.phone || '',
      doctorName: doctorsList[2].name,
      doctorSpecialization: doctorsList[2].specialization,
      doctorHospital: doctorsList[2].hospital,
      date: '2026-07-15',
      timeSlot: '11:00 AM',
      status: 'completed',
      symptoms: 'Frequent migraine headaches with light sensitivity.',
      notes: 'Prescribed preventative medication and recommended sleep cycle adjustment.',
      consultationFee: doctorsList[2].consultationFee,
      documents: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const seededReviews: Review[] = INITIAL_REVIEWS.map((rev, index) => ({
    _id: `rev_${index + 1}`,
    doctorId: doctorsList[index % doctorsList.length]._id,
    patientId: patient1._id,
    patientName: rev.patientName,
    rating: rev.rating,
    comment: rev.comment,
    date: rev.date,
  }));

  db = {
    users: usersList,
    passwords: passwordsDict,
    doctors: doctorsList,
    appointments: initialAppointments,
    reviews: seededReviews,
  };

  void saveDatabase();
  console.log('Database seeded with sample doctors, patients, admin, and appointments.');
}

// Load database on server start
void loadDatabase();

// Express Auth Request Type
interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: Role;
  };
}

// Authentication Middleware
function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      email: string;
      role: Role;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

// Role Authorization Guard Middleware
function authorizeRoles(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Requires one of the following roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

const verifyAdmin = authorizeRoles('admin');
const verifyDoctor = authorizeRoles('doctor');
const verifyPatient = authorizeRoles('patient');
const authenticateToken = verifyToken;

function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed.', errors: errors.array() });
  }
  next();
}

function hasAppointmentAccess(req: AuthRequest, appointment: Appointment): boolean {
  const isAdmin = req.user?.role === 'admin';
  const isPatientOwner = req.user?.role === 'patient' && appointment.patientId === req.user._id;
  const doctorProfile = db.doctors.find((d) => d.userId === req.user?._id);
  const isDoctorOwner = req.user?.role === 'doctor' && doctorProfile?._id === appointment.doctorId;
  return Boolean(isAdmin || isPatientOwner || isDoctorOwner);
}

// Create Express app
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// ------------------- API ROUTES -------------------

// 1. Auth: Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role = 'patient',
      phone,
      specialization,
      qualifications,
      experienceYears,
      consultationFee,
      hospital,
      location,
      bio,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const userId = `usr_${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser: User = {
      _id: userId,
      name,
      email: email.toLowerCase(),
      role: role as Role,
      phone: phone || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    db.users.push(newUser);
    db.passwords[userId] = hashedPassword;

    let doctorProfile: Doctor | undefined;

    if (role === 'doctor') {
      const docId = `doc_${Date.now()}`;
      doctorProfile = {
        _id: docId,
        userId,
        name,
        email: email.toLowerCase(),
        phone: phone || '',
        avatar: newUser.avatar,
        specialization: specialization || 'General Medicine',
        qualifications: qualifications || 'MBBS',
        experienceYears: Number(experienceYears) || 1,
        consultationFee: Number(consultationFee) || 80,
        bio: bio || 'Dedicated healthcare professional.',
        hospital: hospital || 'General Healthcare Clinic',
        location: location || 'City Medical District',
        rating: 5.0,
        reviewCount: 0,
        status: 'pending', // Doctor applications require Admin verification!
        availability: [
          { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
        ],
        createdAt: new Date().toISOString(),
      };
      db.doctors.push(doctorProfile);
    }

    await saveDatabase();

    const token = jwt.sign(
      { _id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: newUser,
      doctorProfile,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error during registration.' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated by Admin.' });
    }

    const hashedPassword = db.passwords[user._id];
    const isMatch = bcrypt.compareSync(password, hashedPassword || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const doctorProfile = db.doctors.find((d) => d.userId === user._id);

    return res.json({
      message: 'Login successful.',
      token,
      user,
      doctorProfile,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error during login.' });
  }
});

// 3. Auth: Current User Profile
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u._id === req.user?._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  const doctorProfile = db.doctors.find((d) => d.userId === user._id);
  return res.json({ user, doctorProfile });
});

// 4. Doctors: List & Search
app.get('/api/doctors', (req: Request, res: Response) => {
  try {
    const { search, specialization, status } = req.query;

    let result = db.doctors;

    // Default to approved doctors for general listing unless filtered by admin
    if (status) {
      result = result.filter((d) => d.status === status);
    } else {
      result = result.filter((d) => d.status === 'approved');
    }

    if (specialization && specialization !== 'All') {
      result = result.filter(
        (d) => d.specialization.toLowerCase() === (specialization as string).toLowerCase()
      );
    }

    if (search) {
      const q = (search as string).toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q)
      );
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: 'Error fetching doctors list.' });
  }
});

// 5. Doctor: Get Single Doctor Details
app.get('/api/doctors/:id', (req: Request, res: Response) => {
  const doctor = db.doctors.find((d) => d._id === req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found.' });
  }
  const doctorReviews = db.reviews.filter((r) => r.doctorId === doctor._id);
  return res.json({ doctor, reviews: doctorReviews });
});

// 6. Doctor: Create / Update / Delete profile (Doctor/Admin)
app.post(
  '/api/doctors',
  authenticateToken,
  verifyDoctor,
  [
    body('specialization').trim().notEmpty().withMessage('Specialization is required.'),
    body('qualifications').trim().notEmpty().withMessage('Qualifications are required.'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number.'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const existingDoctor = db.doctors.find((d) => d.userId === req.user?._id);
      if (existingDoctor) {
        return res.status(409).json({ message: 'Doctor profile already exists.' });
      }

      const user = db.users.find((u) => u._id === req.user?._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const doctorProfile: Doctor = {
        _id: `doc_${Date.now()}`,
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar,
        specialization: req.body.specialization,
        qualifications: req.body.qualifications,
        experienceYears: Number(req.body.experienceYears) || 1,
        consultationFee: Number(req.body.consultationFee) || 80,
        bio: req.body.bio || 'Dedicated healthcare professional.',
        hospital: req.body.hospital || 'General Healthcare Clinic',
        location: req.body.location || 'City Medical District',
        rating: 5,
        reviewCount: 0,
        status: 'pending',
        availability: [
          { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
        ],
        createdAt: new Date().toISOString(),
      };

      db.doctors.push(doctorProfile);
      await saveDatabase();

      return res.status(201).json({ message: 'Doctor profile created.', doctor: doctorProfile });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to create doctor profile.' });
    }
  }
);

app.put(
  '/api/doctors/:id',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  [
    body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty.'),
    body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number.'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = db.doctors.find((d) => d._id === req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found.' });
      }

      if (req.user?.role === 'doctor' && doctor.userId !== req.user._id) {
        return res.status(403).json({ message: 'You can only update your own profile.' });
      }

      const { specialization, qualifications, experienceYears, consultationFee, bio, hospital, location } = req.body;
      if (specialization) doctor.specialization = specialization;
      if (qualifications) doctor.qualifications = qualifications;
      if (experienceYears !== undefined) doctor.experienceYears = Number(experienceYears);
      if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
      if (bio) doctor.bio = bio;
      if (hospital) doctor.hospital = hospital;
      if (location) doctor.location = location;

      await saveDatabase();
      return res.json({ message: 'Doctor profile updated.', doctor });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to update doctor profile.' });
    }
  }
);

app.delete(
  '/api/doctors/:id',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctorIndex = db.doctors.findIndex((d) => d._id === req.params.id);
      if (doctorIndex === -1) {
        return res.status(404).json({ message: 'Doctor profile not found.' });
      }

      const doctor = db.doctors[doctorIndex];
      if (req.user?.role === 'doctor' && doctor.userId !== req.user._id) {
        return res.status(403).json({ message: 'You can only delete your own profile.' });
      }

      db.doctors.splice(doctorIndex, 1);
      await saveDatabase();
      return res.json({ message: 'Doctor profile removed.' });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to delete doctor profile.' });
    }
  }
);

// 6. Doctor: Update Availability / Schedule (Doctor only)
app.put(
  '/api/doctors/:id/availability',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  [
    body('availability').isArray().withMessage('Availability must be an array.'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = db.doctors.find((d) => d._id === req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found.' });
      }

      // Check doctor ownership
      if (req.user?.role === 'doctor' && doctor.userId !== req.user._id) {
        return res.status(403).json({ message: 'You can only update your own schedule.' });
      }

      const { availability } = req.body;
      if (!Array.isArray(availability)) {
        return res.status(400).json({ message: 'Availability must be an array.' });
      }

      doctor.availability = availability;
      await saveDatabase();

      return res.json({
        message: 'Doctor availability schedule updated successfully.',
        doctor,
      });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to update doctor availability.' });
    }
  }
);

// 7. Appointments: List
app.get('/api/appointments', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?._id;

    let userAppointments: Appointment[] = [];

    if (userRole === 'admin') {
      userAppointments = db.appointments;
    } else if (userRole === 'patient') {
      userAppointments = db.appointments.filter((a) => a.patientId === userId);
    } else if (userRole === 'doctor') {
      const doctorProfile = db.doctors.find((d) => d.userId === userId);
      if (doctorProfile) {
        userAppointments = db.appointments.filter((a) => a.doctorId === doctorProfile._id);
      }
    }

    // Sort by date descending
    userAppointments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return res.json(userAppointments);
  } catch (err: any) {
    return res.status(500).json({ message: 'Error retrieving appointments.' });
  }
});

// 8. Appointments: Book Appointment (Prevent double booking)
app.post(
  '/api/appointments',
  authenticateToken,
  verifyPatient,
  [
    body('doctorId').trim().notEmpty().withMessage('Doctor selection is required.'),
    body('date').trim().notEmpty().withMessage('Appointment date is required.'),
    body('timeSlot').trim().notEmpty().withMessage('Appointment time is required.'),
    body('symptoms').optional().trim().isLength({ min: 3 }).withMessage('Symptoms must be at least 3 characters.'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { doctorId, date, timeSlot, symptoms, patientName, patientPhone } = req.body;

      if (!doctorId || !date || !timeSlot) {
        return res.status(400).json({ message: 'Doctor, date, and time slot are required.' });
      }

      const doctor = db.doctors.find((d) => d._id === doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Selected doctor does not exist.' });
      }

      if (doctor.status !== 'approved') {
        return res.status(400).json({ message: 'Cannot book appointment with an unverified doctor.' });
      }

      // Check for double booking conflict
      const existingBooking = db.appointments.find(
        (a) =>
          a.doctorId === doctorId &&
          a.date === date &&
          a.timeSlot === timeSlot &&
          a.status !== 'cancelled'
      );

      if (existingBooking) {
        return res.status(409).json({
          message: `The time slot ${timeSlot} on ${date} is already booked for Dr. ${doctor.name}. Please choose another slot.`,
        });
      }

      const patientUser = db.users.find((u) => u._id === req.user?._id);

      const now = new Date().toISOString();
      const newAppointment: Appointment = {
        _id: `apt_${Date.now()}`,
        patientId: req.user!._id,
        doctorId,
        patientName: patientName || patientUser?.name || 'Patient',
        patientEmail: patientUser?.email || '',
        patientPhone: patientPhone || patientUser?.phone || '',
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorHospital: doctor.hospital,
        date,
        timeSlot,
        status: 'pending',
        symptoms: symptoms || 'General Consultation',
        documents: [],
        consultationFee: doctor.consultationFee,
        createdAt: now,
        updatedAt: now,
      };

      db.appointments.push(newAppointment);
      await saveDatabase();

      return res.status(201).json({
        message: 'Appointment booked successfully.',
        appointment: newAppointment,
      });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to create appointment.' });
    }
  }
);

// 9. Appointments: Update Status
app.put(
  '/api/appointments/:id/status',
  authenticateToken,
  [body('status').trim().notEmpty().withMessage('Status is required.')],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    const apt = db.appointments.find((a) => a._id === req.params.id);

    if (!apt) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const doctorProfile = db.doctors.find((d) => d.userId === req.user?._id);

    // Permission check: Admin, the assigned Doctor, or the Patient cancelling their own appointment
    const isAdmin = req.user?.role === 'admin';
    const isDoctorOwner = req.user?.role === 'doctor' && doctorProfile?._id === apt.doctorId;
    const isPatientOwner = req.user?.role === 'patient' && req.user._id === apt.patientId;

    if (!isAdmin && !isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({ message: 'Unauthorized to update this appointment.' });
    }

    if (isPatientOwner && status !== 'cancelled') {
      return res.status(403).json({ message: 'Patients can only cancel appointments.' });
    }

    apt.status = status;
    if (notes) apt.notes = notes;
    apt.updatedAt = new Date().toISOString();

    await saveDatabase();

    return res.json({
      message: `Appointment status updated to ${status}.`,
      appointment: apt,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to update appointment status.' });
  }
});

// 10. Appointments: Document Upload (Multer)
app.post(
  '/api/appointments/:id/documents',
  authenticateToken,
  upload.single('document'),
  async (req: AuthRequest, res: Response) => {
    try {
          const apt = db.appointments.find((a) => a._id === req.params.id);
      if (!apt) {
        return res.status(404).json({ message: 'Appointment not found.' });
      }

      if (!hasAppointmentAccess(req, apt)) {
        return res.status(403).json({ message: 'Unauthorized to modify documents for this appointment.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No document file uploaded.' });
      }

      const fileDoc: MedicalDocument = {
        id: `doc_${Date.now()}`,
        name: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user?.email || 'User',
      };

      apt.documents.push(fileDoc);
      await saveDatabase();

      return res.status(201).json({
        message: 'Document uploaded and attached successfully.',
        document: fileDoc,
        appointment: apt,
      });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to upload document.' });
    }
  }
);

// 11. Appointments: Delete Document
app.delete(
  '/api/appointments/:id/documents/:docId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const apt = db.appointments.find((a) => a._id === req.params.id);
    if (!apt) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (!hasAppointmentAccess(req, apt)) {
      return res.status(403).json({ message: 'Unauthorized to modify documents for this appointment.' });
    }

    const docIndex = apt.documents.findIndex((d) => d.id === req.params.docId);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    apt.documents.splice(docIndex, 1);
    await saveDatabase();

    return res.json({ message: 'Document removed successfully.', appointment: apt });
  }
);

// 12. Admin: System Stats
app.get(
  '/api/admin/stats',
  authenticateToken,
  verifyAdmin,
  (_req: Request, res: Response) => {
    const totalPatients = db.users.filter((u) => u.role === 'patient').length;
    const totalDoctors = db.doctors.filter((d) => d.status === 'approved').length;
    const pendingDoctorVerifications = db.doctors.filter((d) => d.status === 'pending').length;
    const totalAppointments = db.appointments.length;
    const completedAppointments = db.appointments.filter((a) => a.status === 'completed').length;

    const totalRevenue = db.appointments
      .filter((a) => a.status === 'completed' || a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);

    const stats: AdminStats = {
      totalPatients,
      totalDoctors,
      pendingDoctorVerifications,
      totalAppointments,
      completedAppointments,
      totalRevenue,
    };

    return res.json(stats);
  }
);

// 13. Admin: Doctors Pending Verification
app.get(
  '/api/admin/doctors/pending',
  authenticateToken,
  verifyAdmin,
  (_req: Request, res: Response) => {
    const pendingDoctors = db.doctors.filter((d) => d.status === 'pending');
    return res.json(pendingDoctors);
  }
);

// 14. Admin: Doctor Verification Approval/Rejection
app.put(
  '/api/admin/doctors/:id/verify',
  authenticateToken,
  verifyAdmin,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body; // 'approved' | 'rejected'
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be approved or rejected.' });
      }

      const doctor = db.doctors.find((d) => d._id === req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found.' });
      }

      doctor.status = status;
      await saveDatabase();

      return res.json({
        message: `Doctor ${doctor.name} verification status updated to ${status}.`,
        doctor,
      });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to update verification status.' });
    }
  }
);

// 15. Admin: Users List & Deactivation
app.get(
  '/api/admin/users',
  authenticateToken,
  verifyAdmin,
  (_req: Request, res: Response) => {
    return res.json(db.users);
  }
);

app.put(
  '/api/admin/users/:id/status',
  authenticateToken,
  verifyAdmin,
  async (req: Request, res: Response) => {
    const { isActive } = req.body;
    const user = db.users.find((u) => u._id === req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate Admin account.' });
    }

    user.isActive = Boolean(isActive);
    await saveDatabase();

    return res.json({
      message: `User ${user.name} status updated to ${user.isActive ? 'Active' : 'Inactive'}.`,
      user,
    });
  }
);

// 16. Seed Data Reset Trigger
app.post('/api/seed', async (_req: Request, res: Response) => {
  seedDatabase();
  await saveDatabase();
  return res.json({ message: 'Database reset and successfully seeded with initial test data.' });
});

// 17. Postman Collection Export Endpoint
app.get('/api/postman-collection', (req: Request, res: Response) => {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  const postmanCollection = {
    info: {
      name: 'Book a Doctor API Collection',
      _postman_id: 'book-a-doctor-v1-collection',
      description: 'Complete MERN Healthcare Booking System API collection for Postman testing.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Login (Patient)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'john.doe@gmail.com', password: 'patient123' }, null, 2),
              },
              url: { raw: `${baseUrl}/api/auth/login` },
            },
          },
          {
            name: 'Login (Doctor)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'dr.smith@bookadoctor.com', password: 'doctor123' }, null, 2),
              },
              url: { raw: `${baseUrl}/api/auth/login` },
            },
          },
          {
            name: 'Login (Admin)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'admin@bookadoctor.com', password: 'admin123' }, null, 2),
              },
              url: { raw: `${baseUrl}/api/auth/login` },
            },
          },
          {
            name: 'Register Patient',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    name: 'Alice Johnson',
                    email: 'alice.j@gmail.com',
                    password: 'patient123',
                    role: 'patient',
                    phone: '+1 555-444-3322',
                  },
                  null,
                  2
                ),
              },
              url: { raw: `${baseUrl}/api/auth/register` },
            },
          },
          {
            name: 'Register Doctor (Pending Verification)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    name: 'Dr. Robert Vance',
                    email: 'dr.vance@bookadoctor.com',
                    password: 'doctor123',
                    role: 'doctor',
                    phone: '+1 555-888-2211',
                    specialization: 'Neurology',
                    qualifications: 'MD - Harvard Medical',
                    experienceYears: 11,
                    consultationFee: 140,
                    hospital: 'Metro Health Hospital',
                    location: 'New York, NY',
                  },
                  null,
                  2
                ),
              },
              url: { raw: `${baseUrl}/api/auth/register` },
            },
          },
          {
            name: 'Get Current User Profile',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: `${baseUrl}/api/auth/me` },
            },
          },
        ],
      },
      {
        name: 'Doctors',
        item: [
          {
            name: 'Get Approved Doctors List',
            request: {
              method: 'GET',
              url: { raw: `${baseUrl}/api/doctors?specialization=All` },
            },
          },
          {
            name: 'Search Doctors by Specialization or Name',
            request: {
              method: 'GET',
              url: { raw: `${baseUrl}/api/doctors?search=Smith&specialization=Cardiology` },
            },
          },
          {
            name: 'Get Doctor Details',
            request: {
              method: 'GET',
              url: { raw: `${baseUrl}/api/doctors/doc_1` },
            },
          },
        ],
      },
      {
        name: 'Appointments',
        item: [
          {
            name: 'Get User Appointments',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: `${baseUrl}/api/appointments` },
            },
          },
          {
            name: 'Book Appointment',
            request: {
              method: 'POST',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{token}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    doctorId: 'doc_1',
                    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                    timeSlot: '02:00 PM',
                    symptoms: 'Routine cardiac health review and cholesterol check',
                  },
                  null,
                  2
                ),
              },
              url: { raw: `${baseUrl}/api/appointments` },
            },
          },
          {
            name: 'Update Appointment Status',
            request: {
              method: 'PUT',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{token}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ status: 'confirmed', notes: 'Confirmed by doctor.' }, null, 2),
              },
              url: { raw: `${baseUrl}/api/appointments/apt_1/status` },
            },
          },
        ],
      },
      {
        name: 'Admin Dashboard',
        item: [
          {
            name: 'Get System Stats',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: `${baseUrl}/api/admin/stats` },
            },
          },
          {
            name: 'Get Pending Doctor Registrations',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: `${baseUrl}/api/admin/doctors/pending` },
            },
          },
          {
            name: 'Approve Doctor Verification',
            request: {
              method: 'PUT',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{token}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ status: 'approved' }, null, 2),
              },
              url: { raw: `${baseUrl}/api/admin/doctors/doc_4/verify` },
            },
          },
          {
            name: 'Get All Platform Users',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{token}}' }],
              url: { raw: `${baseUrl}/api/admin/users` },
            },
          },
        ],
      },
    ],
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="Book_a_Doctor_Postman_Collection.json"');
  return res.json(postmanCollection);
});

// Start Express Server + Vite Integration
async function startServer(startPort = PORT) {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(startPort, HOST, () => {
    console.log(`Healthcare Server running on http://${HOST}:${startPort}`);
  });

  server.on('error', (error: any) => {
    if (error?.code === 'EADDRINUSE') {
      const fallbackPort = startPort + 1;
      console.warn(`Port ${startPort} is already in use. Trying ${fallbackPort}...`);
      if (fallbackPort <= startPort + 3) {
        startServer(fallbackPort);
      } else {
        console.error(`Unable to start server. Please free port ${startPort} or set PORT to a free port.`);
        process.exit(1);
      }
      return;
    }

    console.error('Server failed to start:', error);
    process.exit(1);
  });
}

startServer();
