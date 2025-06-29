import React, { useState } from 'react';
import { KeyIcon } from './icons';

interface ConfigurationScreenProps {
    onConfigure: (config: { apiKey: string; clientId: string; developerKey: string }) => void;
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ onConfigure }) => {
    const [apiKey, setApiKey] = useState('');
    const [clientId, setClientId] = useState('');
    const [developerKey, setDeveloperKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim() && clientId.trim() && developerKey.trim()) {
            setIsLoading(true);
            // Simulate a small delay to give feedback
            setTimeout(() => {
                onConfigure({ apiKey: apiKey.trim(), clientId: clientId.trim(), developerKey: developerKey.trim() });
            }, 500);
        }
    };
    
    const isFormValid = apiKey.trim() && clientId.trim() && developerKey.trim();

    return (
        <div className="w-full max-w-lg text-center bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <KeyIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-white">Application Setup</h2>
            <p className="mt-3 text-md text-gray-400">
                Provide your API keys to get started. Your keys are stored in your browser's local storage and are never sent to a server.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
                <div>
                    <label htmlFor="gemini-key" className="text-sm font-medium text-gray-300">Gemini API Key</label>
                    <input
                        id="gemini-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="mt-1 block w-full bg-gray-900 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="client-id" className="text-sm font-medium text-gray-300">Google Client ID</label>
                    <input
                        id="client-id"
                        type="password"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="Enter your Google Client ID"
                        className="mt-1 block w-full bg-gray-900 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="developer-key" className="text-sm font-medium text-gray-300">Google API Key (for Picker)</label>
                    <input
                        id="developer-key"
                        type="password"
                        value={developerKey}
                        onChange={(e) => setDeveloperKey(e.target.value)}
                        placeholder="Enter your Google API Key"
                        className="mt-1 block w-full bg-gray-900 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={!isFormValid || isLoading}
                        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                    >
                         {isLoading ? 'Saving...' : 'Save & Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
};
