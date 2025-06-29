
import React from 'react';
import { DriveFile } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleDriveIcon, DocumentTextIcon } from './icons';

interface FileSelectionScreenProps {
    onSelectFiles: () => void;
    isProcessing?: boolean;
    selectedFiles?: DriveFile[];
}

export const FileSelectionScreen: React.FC<FileSelectionScreenProps> = ({ onSelectFiles, isProcessing, selectedFiles }) => {
    return (
        <div className="w-full max-w-2xl text-center bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-extrabold text-white">Select Your Documents</h2>
            <p className="mt-3 text-md text-gray-400">
                Choose the Google Docs, Slides, PDFs, or text files you want to chat with.
            </p>

            <div className="mt-8">
                <button
                    onClick={onSelectFiles}
                    disabled={isProcessing}
                    className="w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                >
                    <GoogleDriveIcon className="w-6 h-6 mr-3" />
                    {isProcessing ? 'Processing...' : 'Select Files from Drive'}
                </button>
            </div>
            
            {isProcessing && selectedFiles && selectedFiles.length > 0 && (
                 <div className="mt-8 text-left">
                     <h3 className="text-lg font-semibold text-gray-300 mb-3">Processing {selectedFiles.length} file(s):</h3>
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {selectedFiles.map(file => (
                             <div key={file.id} className="flex items-center bg-gray-700/50 p-2 rounded-lg">
                                 <LoadingSpinner className="w-5 h-5 mr-3 text-blue-400"/>
                                 <img src={file.iconUrl} alt="file icon" className="w-5 h-5 mr-3" />
                                 <span className="text-sm text-gray-300 truncate">{file.name}</span>
                             </div>
                        ))}
                     </div>
                 </div>
            )}
        </div>
    );
};