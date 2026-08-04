import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Building2,
  MapPin,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { Doctor, Review } from '../types';
import { doctorService } from '../services/api';

interface DoctorProfilePageProps {
  doctorId: string;
  onBack: () => void;
  onBookAppointment: (doctor: Doctor) => void;
}

export const DoctorProfilePage: React.FC<DoctorProfilePageProps> = ({
  doctorId,
  onBack,
  onBookAppointment,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await doctorService.getDoctorById(doctorId);
        setDoctor(data.doctor);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [doctorId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading doctor profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Doctor Profile Not Found</h3>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl"
        >
          Back to Doctors List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctors Discovery</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-28 h-28 rounded-2xl object-cover ring-4 ring-slate-100 shrink-0"
            />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-2xs font-extrabold text-teal-800 bg-teal-50 border border-teal-200 uppercase tracking-wider">
                  {doctor.specialization}
                </span>
                <span className="px-3 py-1 rounded-full text-2xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Specialist</span>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 font-serif">{doctor.name}</h1>
              <p className="text-xs font-medium text-slate-500">{doctor.qualifications}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 text-teal-600 mr-1.5" />
                  <span>{doctor.hospital}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-slate-400 mr-1.5" />
                  <span>{doctor.location}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-slate-800">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{doctor.rating}</span>
                  <span className="text-slate-400 font-normal">({doctor.reviewCount} reviews)</span>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                  {doctor.experienceYears} Years Clinical Experience
                </span>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Award className="w-4 h-4 text-teal-600" />
              <span>About Dr. {doctor.name.split(' ').pop()}</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
          </div>

          {/* Schedule & Availability */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Weekly Availability Schedule</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctor.availability?.map((daySched) => (
                <div
                  key={daySched.day}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{daySched.day}</span>
                    <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      {daySched.slots.length} Slots
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {daySched.slots.map((slot) => (
                      <span
                        key={slot}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-3xs font-semibold text-slate-700 flex items-center space-x-1"
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{slot}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Reviews Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>Patient Testimonials & Reviews ({reviews.length})</span>
            </h3>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rev.patientName}</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                    <span className="text-3xs text-slate-400 block">{rev.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No reviews recorded yet for this doctor.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar: Booking Widget */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md sticky top-24 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">
                Standard Consultation
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">${doctor.consultationFee}</span>
                <span className="text-xs text-slate-500 font-medium">/ 30 min session</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant appointment confirmation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Secure medical report & file uploads</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Free cancellation up to 24h prior</span>
              </div>
            </div>

            <button
              onClick={() => onBookAppointment(doctor)}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-2xl transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
