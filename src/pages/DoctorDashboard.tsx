import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { Appointment, Doctor, DayAvailability } from '../types';
import { appointmentService, doctorService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SLOTS } from '../data/seedData';
import { DocumentUploadModal } from '../components/DocumentUploadModal';

export const DoctorDashboard: React.FC = () => {
  const { doctorProfile, user, refreshUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAptForDocs, setSelectedAptForDocs] = useState<Appointment | null>(null);

  // Availability state
  const [availability, setAvailability] = useState<DayAvailability[]>(
    doctorProfile?.availability || [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
    ]
  );
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // Consultation notes modal
  const [activeNotesAptId, setActiveNotesAptId] = useState<string | null>(null);
  const [consultationNotes, setConsultationNotes] = useState<string>('');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load doctor appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (
    aptId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    notes?: string
  ) => {
    try {
      await appointmentService.updateStatus(aptId, status, notes);
      setActiveNotesAptId(null);
      setConsultationNotes('');
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSaveSchedule = async () => {
    if (!doctorProfile?._id) return;
    setIsSavingSchedule(true);
    try {
      await doctorService.updateAvailability(doctorProfile._id, availability);
      setScheduleSuccessMsg('Schedule saved and updated live!');
      setTimeout(() => setScheduleSuccessMsg(null), 3000);
      refreshUser();
    } catch (err: any) {
      alert('Failed to save schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleAddDay = (dayName: string) => {
    if (availability.some((a) => a.day === dayName)) return;
    setAvailability([...availability, { day: dayName, slots: ['09:00 AM', '10:00 AM', '02:00 PM'] }]);
  };

  const handleRemoveDay = (dayName: string) => {
    setAvailability(availability.filter((a) => a.day !== dayName));
  };

  const handleToggleSlot = (dayName: string, slotTime: string) => {
    setAvailability(
      availability.map((dayObj) => {
        if (dayObj.day === dayName) {
          const exists = dayObj.slots.includes(slotTime);
          const newSlots = exists
            ? dayObj.slots.filter((s) => s !== slotTime)
            : [...dayObj.slots, slotTime];
          return { ...dayObj, slots: newSlots };
        }
        return dayObj;
      })
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200'}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-500/50"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold font-serif">{user?.name}</h1>
              {doctorProfile?.status === 'approved' ? (
                <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Approved Doctor</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Pending Admin Approval</span>
                </span>
              )}
            </div>
            <p className="text-xs text-teal-200/80 mt-1">
              {doctorProfile?.specialization} • {doctorProfile?.hospital}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="text-2xs text-teal-300 block uppercase font-bold">Today Consults</span>
            <span className="text-lg font-bold">
              {appointments.filter((a) => a.date === new Date().toISOString().split('T')[0]).length}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="text-2xs text-teal-300 block uppercase font-bold">Fee Rate</span>
            <span className="text-lg font-bold">${doctorProfile?.consultationFee || 100}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Appointments & Schedule Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-serif flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span>Patient Appointments Queue ({appointments.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading schedule...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{apt.patientPhone || 'No phone supplied'}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        apt.status === 'confirmed'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : apt.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : apt.status === 'cancelled'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  {/* Slot Details */}
                  <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>
                        {apt.date} @ {apt.timeSlot}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-500">
                      Doc Records: {apt.documents?.length || 0}
                    </span>
                  </div>

                  {/* Patient Symptoms */}
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-700">Patient Symptoms:</span>
                    <p className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
                      {apt.symptoms}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedAptForDocs(apt)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Patient Records ({apt.documents?.length || 0})</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Confirm
                        </button>
                      )}

                      {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                        <button
                          onClick={() => setActiveNotesAptId(apt._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete & Add Notes</span>
                        </button>
                      )}

                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Consultation Notes Modal / Box */}
                  {activeNotesAptId === apt._id && (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase">
                        Doctor Consultation Notes & Prescription
                      </h4>
                      <textarea
                        rows={3}
                        placeholder="Write medical notes, prescription guidelines, or follow-up instructions..."
                        value={consultationNotes}
                        onChange={(e) => setConsultationNotes(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-emerald-300 text-xs text-slate-900 focus:outline-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setActiveNotesAptId(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(apt._id, 'completed', consultationNotes)
                          }
                          className="px-4 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-xl shadow-xs"
                        >
                          Save & Mark Completed
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Patient Appointments</h3>
              <p className="text-xs text-slate-500 mt-1">
                When patients book consultations with you, they will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Schedule & Availability Editor Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Schedule Editor</span>
              </h3>
              <button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSchedule ? 'Saving...' : 'Save Schedule'}</span>
              </button>
            </div>

            {scheduleSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                {scheduleSuccessMsg}
              </div>
            )}

            {/* Day Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Available Days & Time Slots</span>
                <div className="flex space-x-1 text-3xs">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (d) => (
                      <button
                        key={d}
                        onClick={() => handleAddDay(d)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-teal-100 rounded text-slate-700 font-bold"
                        title={`Add ${d}`}
                      >
                        +{d.slice(0, 3)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {availability.map((dayObj) => (
                <div
                  key={dayObj.day}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{dayObj.day}</span>
                    <button
                      onClick={() => handleRemoveDay(dayObj.day)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove Day"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_SLOTS.map((time) => {
                      const isActive = dayObj.slots.includes(time);
                      return (
                        <button
                          key={time}
                          onClick={() => handleToggleSlot(dayObj.day, time)}
                          className={`px-2 py-1 rounded-lg text-3xs font-semibold transition-all ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-500 hover:border-teal-300'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {selectedAptForDocs && (
        <DocumentUploadModal
          appointment={selectedAptForDocs}
          isOpen={!!selectedAptForDocs}
          onClose={() => setSelectedAptForDocs(null)}
          onUploadSuccess={(updatedApt) => {
            setSelectedAptForDocs(updatedApt);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};
