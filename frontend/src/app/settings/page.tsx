'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../components/Navbar';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'coach' | 'client' | 'admin';
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    
    // Form states
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editBio, setEditBio] = useState('');
    const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    
    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const data = await response.json();
            setUser(data.user);
            
            // Initialize edit fields
            setEditName(data.user.name || '');
            setEditEmail(data.user.email || '');
            setEditPhoneNumber(data.user.phone_number || '');
            setEditBio(data.user.bio || '');
        } catch (error) {
            console.error('Error loading profile:', error);
            setError(error instanceof Error ? error.message : 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPEG, PNG, JPG, and GIF files are allowed');
            return;
        }

        setSelectedProfilePicture(file);
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setError('');
    };

    const removeProfilePicture = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedProfilePicture(null);
        setPreviewUrl(null);
    };

    const handleUpdateProfile = async () => {
        if (!editName.trim()) {
            setError('Name is required');
            return;
        }

        if (!editEmail.trim()) {
            setError('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setIsUpdating(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            let updateData: any = {
                name: editName.trim(),
                email: editEmail.trim(),
                phone_number: editPhoneNumber.trim() || null,
                bio: editBio.trim() || null,
            };

            // Upload profile picture if selected
            if (selectedProfilePicture) {
                setUploadingPicture(true);
                try {
                    const formData = new FormData();
                    formData.append('profile_picture', selectedProfilePicture);

                    const pictureResponse = await fetch(`${API_CONFIG.BASE_URL}/profile/picture`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!pictureResponse.ok) {
                        throw new Error('Failed to upload profile picture');
                    }

                    const pictureData = await pictureResponse.json();
                    if (pictureData.profile_picture) {
                        updateData.profile_picture = pictureData.profile_picture;
                    }
                } catch (error) {
                    console.error('Error uploading profile picture:', error);
                    setError('Failed to upload profile picture. Please try again.');
                    setUploadingPicture(false);
                    return;
                } finally {
                    setUploadingPicture(false);
                }
            } else if (user?.profile_picture) {
                updateData.profile_picture = user.profile_picture;
            }

            // Update profile data
            const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const data = await response.json();
            setUser(data.user);
            setShowEditProfile(false);
            setSelectedProfilePicture(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            setSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Profile update error:', error);
            setError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            setIsUpdating(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/change-password`, {
                method: 'POST',
                headers: getAuthHeaders(token),
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }

            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSuccess('Password changed successfully. You will be logged out for security.');
            
            // Logout after password change
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            console.error('Password change error:', error);
            setError(error instanceof Error ? error.message : 'Failed to change password');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                {success}
                            </div>
                        )}

                        {/* Profile Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
                            
                            {!showEditProfile ? (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="flex items-center space-x-6 mb-6">
                                        {user?.profile_picture ? (
                                            <img
                                                src={user.profile_picture}
                                                alt={user.name + "'s profile"}
                                                className="h-20 w-20 rounded-full object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                                            <p className="text-gray-600">{user?.email}</p>
                                            {user?.phone_number && (
                                                <p className="text-gray-600">{user.phone_number}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {user?.bio && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                                            <p className="text-gray-700">{user.bio}</p>
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={() => setShowEditProfile(true)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    {/* Profile Picture Section */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Profile Picture
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            {(previewUrl || user?.profile_picture) ? (
                                                <img
                                                    src={previewUrl || user?.profile_picture}
                                                    alt="Profile preview"
                                                    className="h-20 w-20 rounded-full object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="flex space-x-2">
                                                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                                    {previewUrl || user?.profile_picture ? 'Change' : 'Add'} Photo
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/jpeg,image/png,image/jpg,image/gif"
                                                        onChange={handleProfilePictureChange}
                                                    />
                                                </label>
                                                {(previewUrl || user?.profile_picture) && (
                                                    <button
                                                        type="button"
                                                        onClick={removeProfilePicture}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={editPhoneNumber}
                                                onChange={(e) => setEditPhoneNumber(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bio
                                        </label>
                                        <textarea
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                setShowEditProfile(false);
                                                setSelectedProfilePicture(null);
                                                if (previewUrl) {
                                                    URL.revokeObjectURL(previewUrl);
                                                    setPreviewUrl(null);
                                                }
                                                // Reset to original values
                                                setEditName(user?.name || '');
                                                setEditEmail(user?.email || '');
                                                setEditPhoneNumber(user?.phone_number || '');
                                                setEditBio(user?.bio || '');
                                            }}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isUpdating || uploadingPicture}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating || uploadingPicture ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Password Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Password</h2>
                            
                            {!showChangePassword ? (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <button
                                        onClick={() => setShowChangePassword(true)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                setShowChangePassword(false);
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isUpdating}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating ? 'Changing...' : 'Change Password'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 