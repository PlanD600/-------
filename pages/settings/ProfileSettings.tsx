

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';

const ProfileSettings = () => {
    const { user, currentUserRole, updateUser, token } = useAuth();

    const [fullName, setFullName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePictureFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };


    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setJobTitle(user.jobTitle || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            let newProfilePictureUrl = user?.profilePictureUrl;
            if (profilePictureFile) {
                const uploadResponse = await api.uploadProfilePicture(profilePictureFile);[]
                const serverBaseUrl = 'https://api.mypland.com';
                newProfilePictureUrl = `${serverBaseUrl}${uploadResponse.profilePictureUrl}`;
            }

            const updatedUser = await api.updateMyProfile({
                fullName,
                jobTitle,
                email,
                profilePictureUrl: newProfilePictureUrl
            });

            updateUser(updatedUser);
            setSuccess('הפרופיל עודכן בהצלחה!');
            setProfilePictureFile(null); // Clear the selected file
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6">הפרופיל שלי</h3>
            <form onSubmit={handleSaveChanges} className="space-y-4 max-w-lg" key={user?.id || 'profile'}>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">שם מלא</label>
                    <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                    />
                </div>
                <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">תפקיד</label>
                    <input
                        id="jobTitle"
                        type="text"
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">אימייל</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">טלפון</label>
                    <input
                        id="phone"
                        type="tel"
                        value={phone}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">לא ניתן לערוך את מספר הטלפון.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">תמונת פרופיל</label>
                    <div className="mt-1 flex items-center space-x-4 space-x-reverse">
                        {profilePictureFile ? (
                            <img src={URL.createObjectURL(profilePictureFile)} alt="פרופיל זמני" className="w-16 h-16 rounded-full object-cover" />
                        ) : user?.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="פרופיל" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#4A2B2C] text-white font-bold text-2xl">
                                {user?.fullName?.charAt(0) || ''}
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {profilePictureFile ? 'תמונה נבחרה' : 'שנה תמונה'}
                        </button>
                    </div>
                </div>

                <div className="pt-4 flex justify-end items-center space-x-4 space-x-reverse">
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50">
                        {isLoading ? 'שומר...' : 'שמור שינויים'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;
