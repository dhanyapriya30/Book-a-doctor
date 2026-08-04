import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AdminStats, Doctor, User } from '../types';
import { adminService, systemService } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsData, pendingData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingDoctors(),
        adminService.getAllUsers(),
      ]);
      setStats(statsData);
      setPendingDoctors(pendingData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyDoctor = async (doctorId: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.verifyDoctor(doctorId, status);
      setActionMessage(`Doctor registration status updated to ${status}.`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify doctor');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentIsActive?: boolean) => {
    try {
      await adminService.setUserStatus(userId, !currentIsActive);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetSystem = async () => {
    if (!window.confirm('Reset database to clean initial state with pre-seeded sample data?')) return;
    try {
      await systemService.seedDatabase();
      fetchAdminData();
      setActionMessage('System database reset & re-seeded successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Failed to reset system database');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold font-serif">Platform Admin Console</h1>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1">
            Role-based governance, doctor credential verification, system analytics, and user account management.
          </p>
        </div>

        <button
          onClick={handleResetSystem}
          className="px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-indigo-300" />
          <span>Re-Seed Platform Data</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Metrics Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Total Patients</span>
          </span>
          <span className="text-2xl font-extrabold text-slate-900 block">{stats?.totalPatients || 0}</span>
          <span className="text-3xs text-slate-500 font-medium">Registered Patients</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Doctors</span>
          </span>
          <span className="text-2xl font-extrabold text-slate-900 block">{stats?.totalDoctors || 0}</span>
          <span className="text-3xs text-slate-500 font-medium">Approved Medical Specialists</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-amber-600 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
          </span>
          <span className="text-2xl font-extrabold text-amber-700 block">
            {stats?.pendingDoctorVerifications || 0}
          </span>
          <span className="text-3xs text-slate-500 font-medium">Requires Admin Verification</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
            <span>Platform Volume</span>
          </span>
          <span className="text-2xl font-extrabold text-slate-900 block">${stats?.totalRevenue || 0}</span>
          <span className="text-3xs text-slate-500 font-medium">{stats?.totalAppointments || 0} Total Consultations</span>
        </div>
      </div>

      {/* Doctor Verification Queue */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Doctor Verification Queue ({pendingDoctors.length})</span>
          </h2>
        </div>

        {pendingDoctors.length > 0 ? (
          <div className="space-y-3">
            {pendingDoctors.map((doc) => (
              <div
                key={doc._id}
                className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-300"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-xs text-amber-900 font-medium">
                      {doc.specialization} • {doc.qualifications} ({doc.experienceYears} yrs exp)
                    </p>
                    <p className="text-3xs text-slate-500 mt-0.5">
                      Hospital: {doc.hospital} ({doc.location}) • Fee: ${doc.consultationFee}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleVerifyDoctor(doc._id, 'approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Doctor</span>
                  </button>
                  <button
                    onClick={() => handleVerifyDoctor(doc._id, 'rejected')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Application</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Verification Queue Clear</p>
            <p className="text-3xs text-slate-500">All registered doctor applications have been processed.</p>
          </div>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>User Accounts & Status Controls ({users.length})</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user email or name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-400 bg-slate-50">
                <th className="p-3">User Profile</th>
                <th className="p-3">Role</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isActive = u.isActive !== false;
                return (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 flex items-center space-x-2">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 uppercase text-2xs font-extrabold tracking-wider">
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : u.role === 'doctor'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-2xs font-bold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                          className={`px-3 py-1 rounded-lg text-2xs font-bold transition-all ${
                            isActive
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
