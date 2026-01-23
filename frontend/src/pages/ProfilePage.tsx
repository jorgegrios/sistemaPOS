import React, { useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { authService } from '../services/auth-service';
import {
    User,
    KeyRound,
    Shield,
    Building2,
    Mail,
    Save,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('The new passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.changePassword(user!.id, currentPassword, newPassword);
            if (response.ok) {
                toast.success('Password updated successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-2">My Account</h1>
                <p className="text-gray-500 text-lg">Manage your personal information and security settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                        <div className="px-6 pb-8 text-center -mt-12">
                            <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-lg mb-4">
                                <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-12 h-12 text-blue-600" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-blue-600 font-bold text-sm uppercase tracking-wider">{user.role}</p>

                            <div className="mt-8 space-y-4 text-left">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm truncate">Company ID: {user.companyId.substring(0, 8)}...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Information (Read Only) */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    value={user.name}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                                <input
                                    type="text"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Contact your system administrator if you need to change your name or email.
                            </p>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <KeyRound className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        placeholder="Min 6 characters"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-100"
                            >
                                {isLoading ? 'Updating...' : <><Save className="w-4 h-4" /> Save New Password</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
