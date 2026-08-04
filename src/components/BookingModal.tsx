import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Stethoscope, User, Phone } from 'lucide-react';
import { Doctor, Appointment } from '../types';
import { appointmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface BookingModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (appointment: Appointment) => void;
  openAuthModal: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onBookingSuccess,
  openAuthModal,
}) => {
  const { user } = useAuth();

  // Default date to tomorrow
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [date, setDate] = useState<string>(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [patientName, setPatientName] = useState<string>(user?.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !doctor) return null;

  // Determine available slots for chosen day
  const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const daySchedule = doctor.availability?.find(
    (a) => a.day.toLowerCase() === dayOfWeek.toLowerCase()
  );
  const availableSlots = daySchedule ? daySchedule.slots : ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'];

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      openAuthModal();
      return;
    }

    if (!date) {
      setErrorMessage('Please select an appointment date.');
      return;
    }

    if (!selectedSlot) {
      setErrorMessage('Please choose a time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newApt = await appointmentService.bookAppointment({
        doctorId: doctor._id,
        date,
        timeSlot: selectedSlot,
        symptoms: symptoms || 'General Consultation',
        patientName: patientName || user.name,
        patientPhone: patientPhone || user.phone,
      });

      onBookingSuccess(newApt);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to schedule appointment. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Book Appointment</h3>
              <p className="text-xs text-teal-100">Confirm time & details with Dr. {doctor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor Summary Banner */}
        <div className="px-6 py-3 bg-teal-50/60 border-b border-teal-100/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-10 h-10 rounded-lg object-cover ring-2 ring-teal-200"
            />
            <div>
              <div className="text-sm font-bold text-slate-900">{doctor.name}</div>
              <div className="text-xs text-teal-700 font-medium">{doctor.specialization} • {doctor.hospital}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xs text-slate-400 uppercase font-semibold">Fee</div>
            <div className="text-base font-bold text-slate-900">${doctor.consultationFee}</div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitBooking} className="p-6 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You must be signed in to complete booking.</span>
              </div>
              <button
                type="button"
                onClick={openAuthModal}
                className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-200/80 rounded-lg hover:bg-amber-300"
              >
                Sign In Now
              </button>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Appointment Date
            </label>
            <div className="relative">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
            <p className="text-2xs text-slate-500 mt-1">
              Available on: {doctor.availability?.map((a) => a.day).join(', ') || 'All Days'}
            </p>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Select Time Slot ({dayOfWeek})</span>
              {selectedSlot && (
                <span className="text-2xs text-teal-600 font-semibold flex items-center">
                  <CheckCircle className="w-3 h-3 mr-0.5" /> Selected: {selectedSlot}
                </span>
              )}
            </label>

            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all flex items-center justify-center space-x-1 ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300'
                      }`}
                    >
                      <Clock className="w-3 h-3 opacity-70" />
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Dr. {doctor.name} is not scheduled for {dayOfWeek}. Please pick another date.
              </p>
            )}
          </div>

          {/* Patient Info Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Symptoms / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Symptoms / Reason for Visit
            </label>
            <textarea
              rows={2}
              placeholder="Describe symptoms, medical history, or primary concerns..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
