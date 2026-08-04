import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DoctorList } from './pages/DoctorList';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { PatientAppointments } from './pages/PatientAppointments';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { BookingModal } from './components/BookingModal';
import { AuthModal } from './pages/AuthModal';
import { PostmanModal } from './components/PostmanModal';
import { Doctor, Appointment } from './types';
import { CheckCircle2 } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('doctors');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // Modals
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPostmanModalOpen, setIsPostmanModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctorId(doctor._id);
    setCurrentTab('doctor-profile');
  };

  const handleOpenBookingModal = (doctor: Doctor) => {
    setBookingDoctor(doctor);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    triggerToast(
      `Appointment booked with Dr. ${appointment.doctorName} for ${appointment.date} at ${appointment.timeSlot}!`
    );
    if (user?.role === 'patient') {
      setCurrentTab('my-appointments');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/30 flex items-center space-x-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openPostmanModal={() => setIsPostmanModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'doctors' && (
          <DoctorList
            onSelectDoctor={handleSelectDoctor}
            onBookAppointment={handleOpenBookingModal}
          />
        )}

        {currentTab === 'doctor-profile' && selectedDoctorId && (
          <DoctorProfilePage
            doctorId={selectedDoctorId}
            onBack={() => setCurrentTab('doctors')}
            onBookAppointment={handleOpenBookingModal}
          />
        )}

        {currentTab === 'my-appointments' && <PatientAppointments />}

        {currentTab === 'doctor-dashboard' && <DoctorDashboard />}

        {currentTab === 'admin-dashboard' && <AdminDashboard />}
      </main>

      {/* Booking Modal */}
      <BookingModal
        doctor={bookingDoctor}
        isOpen={!!bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        onBookingSuccess={handleBookingSuccess}
        openAuthModal={() => {
          setBookingDoctor(null);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Postman Collection Modal */}
      <PostmanModal isOpen={isPostmanModalOpen} onClose={() => setIsPostmanModalOpen(false)} />

      {/* Simple Clean Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© 2026 Book a Doctor — Healthcare Appointment Booking System.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
