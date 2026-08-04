import React from 'react';
import { Star, MapPin, Building2, Award, Calendar, Clock } from 'lucide-react';
import { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
  onBookAppointment: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onSelectDoctor,
  onBookAppointment,
}) => {
  return (
    <div
      id={`doctor-card-${doctor._id}`}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col justify-between group"
    >
      <div>
        {/* Header Avatar + Badges */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative">
            <img
              src={
                doctor.avatar ||
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
              }
              alt={doctor.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-teal-500/40 transition-all"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full ring-2 ring-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="inline-block px-2.5 py-0.5 text-2xs font-bold text-teal-700 bg-teal-50 border border-teal-200/60 rounded-full uppercase tracking-wider mb-1">
                {doctor.specialization}
              </span>
              <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-slate-800">{doctor.rating}</span>
                <span className="text-2xs text-slate-500">({doctor.reviewCount})</span>
              </div>
            </div>

            <h3
              onClick={() => onSelectDoctor(doctor)}
              className="text-base font-bold text-slate-900 group-hover:text-teal-700 cursor-pointer truncate transition-colors"
            >
              {doctor.name}
            </h3>

            <p className="text-xs text-slate-500 truncate flex items-center mt-0.5">
              <Award className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              <span>{doctor.qualifications}</span>
            </p>
          </div>
        </div>

        {/* Hospital & Location Details */}
        <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600 mb-4">
          <div className="flex items-center">
            <Building2 className="w-3.5 h-3.5 mr-2 text-teal-600 shrink-0" />
            <span className="truncate">{doctor.hospital}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
              <span>{doctor.location}</span>
            </div>
            <span className="text-2xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              {doctor.experienceYears} yrs exp
            </span>
          </div>
        </div>

        {/* Bio snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {doctor.bio}
        </p>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <span className="text-2xs text-slate-400 uppercase tracking-wider block">
            Consultation Fee
          </span>
          <span className="text-lg font-bold text-slate-900">${doctor.consultationFee}</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onSelectDoctor(doctor)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 rounded-xl transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onBookAppointment(doctor)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm shadow-teal-600/20 flex items-center space-x-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
