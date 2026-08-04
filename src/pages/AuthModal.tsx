import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Stethoscope, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SPECIALIZATIONS } from '../data/seedData';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [role, setRole] = useState<Role>('patient');

  // Common Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Doctor Registration Fields
  const [specialization, setSpecialization] = useState<string>('Cardiology');
  const [qualifications, setQualifications] = useState<string>('MD - Harvard Medical');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [consultationFee, setConsultationFee] = useState<number>(100);
  const [hospital, setHospital] = useState<string>('St. Jude Medical Center');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          role,
          phone,
          specialization,
          qualifications,
          experienceYears,
          consultationFee,
          hospital,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication error. Check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-serif">
              {isLogin ? 'Sign In to Book a Doctor' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-400">
              {isLogin ? 'Enter your credentials to continue' : 'Join as Patient or Doctor'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Login/Register Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              isLogin
                ? 'border-teal-600 text-teal-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              !isLogin
                ? 'border-teal-600 text-teal-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    role === 'patient'
                      ? 'bg-teal-50 border-teal-600 text-teal-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Patient Account
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    role === 'doctor'
                      ? 'bg-teal-50 border-teal-600 text-teal-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Doctor Account
                </button>
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Doctor Additional Registration Fields */}
          {!isLogin && role === 'doctor' && (
            <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
              <span className="text-3xs font-extrabold uppercase text-teal-800 tracking-wider block">
                Doctor Professional Credentials
              </span>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                >
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                    Years Exp.
                  </label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                    Fee ($)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Hospital / Clinic Name
                </label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
