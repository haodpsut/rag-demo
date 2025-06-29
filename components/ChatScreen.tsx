
import React, { useState, useRef, useEffect } from 'react';
import { Message, DriveFile, ChatRole } from '../types';
import { SendIcon, UserIcon, BotIcon, ResetIcon } from './icons';

interface ChatScreenProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    selectedFiles: DriveFile[];
    onReset: () => void;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === ChatRole.User;
    
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-gray-600'}`}>
                {isUser ? <UserIcon className="w-5 h-5 text-white" /> : <BotIcon className="w-5 h-5 text-white" />}
            </div>
            <div className={`relative px-4 py-3 rounded-2xl max-w-lg ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                 <p className="whitespace-pre-wrap break-words">{message.text || <span className="inline-block w-2 h-4 bg-white animate-pulse rounded-sm" />}</p>
            </div>
        </div>
    );
};


export const ChatScreen: React.FC<ChatScreenProps> = ({ messages, onSendMessage, selectedFiles, onReset }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    return (
        <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">Chatting with {selectedFiles.length} file(s)</h3>
                     <div className="flex items-center gap-2 mt-1 overflow-x-auto pb-1">
                        {selectedFiles.map(file => (
                            <div key={file.id} className="flex-shrink-0 flex items-center gap-1.5 bg-gray-700 px-2 py-1 rounded-full text-xs">
                                <img src={file.iconUrl} alt="icon" className="w-4 h-4" />
                                <span className="text-gray-300">{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={onReset}
                    className="ml-4 flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-yellow-600 transition-colors duration-200 rounded-lg text-white font-semibold text-sm"
                    title="Start Over"
                >
                    <ResetIcon className="w-4 h-4"/>
                    <span>Reset</span>
                </button>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question based on your documents..."
                        className="flex-1 w-full bg-gray-900 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 text-white rounded-xl p-3 hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                       <SendIcon className="w-6 h-6"/>
                    </button>
                </form>
            </div>
        </div>
    );
};