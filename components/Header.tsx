
import React from 'react';
import { GoogleIcon } from './icons';

interface HeaderProps {
    isSignedIn: boolean;
    onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSignedIn, onSignOut }) => {
    return (
        <header className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
            <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">DriveRAG</h1>
            </div>
            {isSignedIn && (
                <button
                    onClick={onSignOut}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600 transition-colors duration-200 rounded-lg text-white font-semibold text-sm"
                >
                    <GoogleIcon className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            )}
        </header>
    );
};