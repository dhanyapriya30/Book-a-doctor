import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  FileText,
  XCircle,
  Upload,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Appointment } from '../types';
import { appointmentService } from '../services/api';
import { DocumentUploadModal } from '../components/DocumentUploadModal';

export const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAptForDocs, setSelectedAptForDocs] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load patient appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (aptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await appointmentService.updateStatus(aptId, 'cancelled');
      await fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'pending';
    if (activeTab === 'completed') return apt.status === 'completed';
    if (activeTab === 'cancelled') return apt.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">My Appointments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your booked medical consultations, view doctor updates, and upload lab reports.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upcoming' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'completed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cancelled' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Appointment Cards List */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Retrieving your appointments...</p>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isCancelled = apt.status === 'cancelled';
            const isCompleted = apt.status === 'completed';
            const isConfirmed = apt.status === 'confirmed';

            return (
              <div
                key={apt._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Dr. {apt.doctorName}</h3>
                      <p className="text-xs text-teal-700 font-medium">
                        {apt.doctorSpecialization} • {apt.doctorHospital}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center space-x-1 ${
                      isConfirmed
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isCancelled
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                    {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    {isCancelled && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                    <span>{apt.status}</span>
                  </span>
                </div>

                {/* Appointment Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/70 p-4 rounded-2xl">
                  <div>
                    <span className="text-2xs text-slate-400 font-bold uppercase block">Date & Slot</span>
                    <span className="font-semibold text-slate-900 flex items-center mt-0.5">
                      <Clock className="w-3.5 h-3.5 mr-1 text-teal-600" />
                      {apt.date} at {apt.timeSlot}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 font-bold uppercase block">Fee Paid</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      ${apt.consultationFee}
                    </span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 font-bold uppercase block">Attached Documents</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {apt.documents?.length || 0} Files
                    </span>
                  </div>
                </div>

                {/* Symptoms / Notes */}
                <div className="text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700">Symptoms noted:</span>
                  <p className="bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    {apt.symptoms}
                  </p>
                  {apt.notes && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 mt-2">
                      <span className="font-bold block">Doctor Notes & Prescription:</span>
                      <span>{apt.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedAptForDocs(apt)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>Upload Medical Records ({apt.documents?.length || 0})</span>
                  </button>

                  {!isCancelled && !isCompleted && (
                    <button
                      onClick={() => handleCancel(apt._id)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Appointment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Recorded</h3>
          <p className="text-xs text-slate-500 mt-1">You do not have any appointments in this category.</p>
        </div>
      )}

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
