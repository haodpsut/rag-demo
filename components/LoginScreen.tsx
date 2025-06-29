
import React from 'react';
import { GoogleIcon, DocumentIcon } from './icons';

interface LoginScreenProps {
    onSignIn: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn }) => {
    return (
        <div className="w-full max-w-md text-center bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <DocumentIcon className="mx-auto h-16 w-16 text-blue-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-white">Chat with Your Documents</h2>
            <p className="mt-3 text-md text-gray-400">
                Securely connect your Google Drive account to get answers from your files.
            </p>
            <div className="mt-8">
                <button
                    onClick={onSignIn}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                >
                    <GoogleIcon className="w-6 h-6 mr-3" />
                    Sign in with Google
                </button>
            </div>
            <p className="mt-6 text-xs text-gray-500">
                This app requests read-only access to your Google Drive files. We do not store your files or data.
            </p>
        </div>
    );
};