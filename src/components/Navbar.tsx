import React, { useState } from 'react';
import {
  Stethoscope,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  FileCode,
  Sparkles,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
  openPostmanModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  openPostmanModal,
}) => {
  const { user, doctorProfile, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const handleDemoSwitch = async (role: Role) => {
    setDemoDropdownOpen(false);
    await demoLogin(role);
    if (role === 'patient') setCurrentTab('doctors');
    else if (role === 'doctor') setCurrentTab('doctor-dashboard');
    else if (role === 'admin') setCurrentTab('admin-dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => setCurrentTab('doctors')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                Book a Doctor
              </span>
              <span className="block text-xs font-medium text-teal-600 tracking-wide uppercase">
                Healthcare Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-btn-doctors"
              onClick={() => setCurrentTab('doctors')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'doctors'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Find Doctors
            </button>

            {user?.role === 'patient' && (
              <button
                id="nav-btn-appointments"
                onClick={() => setCurrentTab('my-appointments')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  currentTab === 'my-appointments'
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Appointments</span>
              </button>
            )}

            {user?.role === 'doctor' && (
              <button
                id="nav-btn-doc-dash"
                onClick={() => setCurrentTab('doctor-dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  currentTab === 'doctor-dashboard'
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Doctor Workspace</span>
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                id="nav-btn-admin-dash"
                onClick={() => setCurrentTab('admin-dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  currentTab === 'admin-dashboard'
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                id="demo-role-switcher"
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-teal-50 to-indigo-50 text-slate-800 border border-teal-200/80 rounded-lg hover:border-teal-300 transition-all shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Account</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Instant Switch Role
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('patient')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center justify-between"
                  >
                    <span>Patient (John Doe)</span>
                    <span className="text-2xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      Patient
                    </span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('doctor')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center justify-between"
                  >
                    <span>Doctor (Dr. Smith)</span>
                    <span className="text-2xs bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">
                      Doctor
                    </span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('admin')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center justify-between"
                  >
                    <span>Admin</span>
                    <span className="text-2xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono">
                      Admin
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Postman Collection Modal Trigger */}
            <button
              id="btn-postman-modal"
              onClick={openPostmanModal}
              title="Download API Postman Collection"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-1 text-xs font-medium"
            >
              <FileCode className="w-4 h-4 text-orange-500" />
              <span className="hidden lg:inline">Postman API</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-500/30"
                  />
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-slate-900 leading-none">
                      {user.name}
                    </span>
                    <span className="text-3xs uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 mt-0.5 inline-block">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-auth"
                onClick={openAuthModal}
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md shadow-teal-600/20"
              >
                Sign In / Register
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              setCurrentTab('doctors');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Find Doctors
          </button>

          {user?.role === 'patient' && (
            <button
              onClick={() => {
                setCurrentTab('my-appointments');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              My Appointments
            </button>
          )}

          {user?.role === 'doctor' && (
            <button
              onClick={() => {
                setCurrentTab('doctor-dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Doctor Workspace
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setCurrentTab('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Admin Console
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={openPostmanModal}
              className="text-xs font-semibold text-orange-600 flex items-center space-x-1"
            >
              <FileCode className="w-4 h-4" />
              <span>Postman Collection</span>
            </button>

            {user ? (
              <button
                onClick={logout}
                className="text-xs font-semibold text-red-600 flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
