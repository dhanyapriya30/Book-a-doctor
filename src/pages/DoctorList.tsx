import React, { useState, useEffect } from 'react';
import { Search, Filter, Stethoscope, RefreshCw, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Doctor } from '../types';
import { SPECIALIZATIONS } from '../data/seedData';
import { doctorService, systemService } from '../services/api';
import { DoctorCard } from '../components/DoctorCard';

interface DoctorListProps {
  onSelectDoctor: (doctor: Doctor) => void;
  onBookAppointment: (doctor: Doctor) => void;
}

export const DoctorList: React.FC<DoctorListProps> = ({
  onSelectDoctor,
  onBookAppointment,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getDoctors({
        search: searchQuery,
        specialization: selectedSpecialization !== 'All' ? selectedSpecialization : undefined,
      });

      // Local sorting
      const sorted = [...data].sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        if (sortBy === 'fee') return a.consultationFee - b.consultationFee;
        return 0;
      });

      setDoctors(sorted);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization, searchQuery, sortBy]);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await systemService.seedDatabase();
      await fetchDoctors();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-8 md:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30 mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Verified Healthcare Professionals</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-serif leading-tight">
            Find & Schedule Doctors for In-Person or Telehealth Care
          </h1>
          <p className="text-sm md:text-base text-teal-100/90 mt-3 leading-relaxed">
            Browse top specialists, view verified patient ratings, check real-time availability,
            and instantly book appointments with zero wait time.
          </p>

          {/* Search Box */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by doctor name, condition, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shrink-0"
              title="Reset sample seed data"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Seed Data'}</span>
            </button>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Specialization Pills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter Specialization</span>
          </h2>

          <div className="flex items-center space-x-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="fee">Lowest Fee</option>
            </select>
          </div>
        </div>

        {/* Specialization Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSpecialization('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSpecialization === 'All'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Doctors ({doctors.length})
          </button>

          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialization(spec)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSpecialization === spec
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading verified medical specialists...</p>
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              onSelectDoctor={onSelectDoctor}
              onBookAppointment={onBookAppointment}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try resetting your search query or selecting a different medical specialization.
          </p>
          <button
            onClick={() => {
              setSelectedSpecialization('All');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
