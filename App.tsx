
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DriveFile, Message, AppState, ChatRole } from './types';
import { loadGapi, initGapiClient, showPicker, getFileContent, handleSignIn, handleSignOut } from './services/googleApiService';
import { initGemini, createRAGChatSession, sendMessage } from './services/geminiService';
import { LoginScreen } from './components/LoginScreen';
import { FileSelectionScreen } from './components/FileSelectionScreen';
import { ChatScreen } from './components/ChatScreen';
import { Header } from './components/Header';
import { Chat } from '@google/genai';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { LoadingSpinner } from './components/LoadingSpinner';


interface AppConfig {
  apiKey: string;
  clientId: string;
  developerKey: string;
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.Initializing);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const chatRef = useRef<Chat | null>(null);
  const tokenClientRef = useRef<any | null>(null);
  
  useEffect(() => {
    // This effect runs once on mount to load config from localStorage
    const storedApiKey = localStorage.getItem('GEMINI_API_KEY');
    const storedClientId = localStorage.getItem('GOOGLE_CLIENT_ID');
    const storedDeveloperKey = localStorage.getItem('GOOGLE_DEVELOPER_KEY');

    if (storedApiKey && storedClientId && storedDeveloperKey) {
        const loadedConfig = { apiKey: storedApiKey, clientId: storedClientId, developerKey: storedDeveloperKey };
        setConfig(loadedConfig);
        try {
            initGemini(loadedConfig.apiKey);
            setAppState(AppState.Initializing);
        } catch(e) {
            console.error(e);
            setError("Failed to initialize AI services. The API key might be invalid.");
            setAppState(AppState.Error);
        }
    } else {
        setAppState(AppState.Configuration);
    }
  }, []);

  const handleConfigure = useCallback((newConfig: AppConfig) => {
    localStorage.setItem('GEMINI_API_KEY', newConfig.apiKey);
    localStorage.setItem('GOOGLE_CLIENT_ID', newConfig.clientId);
    localStorage.setItem('GOOGLE_DEVELOPER_KEY', newConfig.developerKey);
    setConfig(newConfig);
    try {
        initGemini(newConfig.apiKey);
        setAppState(AppState.Initializing);
    } catch(e) {
        console.error(e);
        setError("Failed to initialize AI services. The API key might be invalid.");
        setAppState(AppState.Error);
    }
  }, []);

  const updateGAuthState = useCallback((isSignedIn: boolean) => {
    if (isSignedIn) {
      setAppState(AppState.FileSelection);
    } else {
      setAppState(AppState.LoggedOut);
      setSelectedFiles([]);
      setMessages([]);
      chatRef.current = null;
    }
  }, []);

  const handleAuthError = useCallback((err: any) => {
    console.error("Authentication Error", err);
    let specificMessage: string;

    // Check for user-driven actions that aren't fatal configuration errors.
    let isUserAction = false;
    if (err) {
      // GSI can return errors as objects or strings. We check for common user cancellation patterns.
      const errStr = JSON.stringify(err).toLowerCase();
      if (errStr.includes('popup_closed') || errStr.includes('access_denied') || errStr.includes('cancelled')) {
        isUserAction = true;
      }
    }

    if (isUserAction) {
      // This is a user action (closing the popup), not a configuration error.
      // Silently return to the logged-out state so they can try again.
      console.log("Authentication flow cancelled by user.");
      setAppState(AppState.LoggedOut);
      return; 
    }

    // If it's not a simple user action, it's a real error.
    if (err && typeof err === 'object') {
        const errorDetails = err.error || 'unknown_reason';
        const errorType = err.type || '';

        if (errorDetails === 'invalid_request' || errorDetails === 'redirect_uri_mismatch' || errorType === 'token_failed') {
            const helpLink = "https://console.cloud.google.com/apis/credentials";
            // Use a special marker to trigger the guide UI
            specificMessage = `__AUTH_ERROR_GUIDE__
This error (400: ${errorDetails}) is almost always caused by a misconfiguration in your Google Cloud project.

Please follow these steps to fix it:
1.  Go to your Google Cloud Console Credentials page.
    Link: ${helpLink}
2.  Select the project you are using for this app.
3.  Find the "OAuth 2.0 Client ID" you're using and click to edit it.
4.  Under "Authorized JavaScript origins", you MUST add the following URI:
    ${window.location.origin}
5.  Save your changes. It may take a few minutes to take effect.
6.  Return here, reset the configuration, and try signing in again.

If the issue persists, your Google Workspace administrator may need to approve this application.`;
        } else {
            specificMessage = `An unexpected error occurred during authentication.\nDetails: ${err.details || errorDetails || 'Not available.'}`;
        }
    } else if (err && typeof err === 'string') {
        specificMessage = `An unexpected error occurred during authentication.\nDetails: ${err}`;
    } else {
        specificMessage = 'An unknown error occurred during Google Sign-In.';
    }
    
    setError(specificMessage);
    setAppState(AppState.Error);
  }, []);

  useEffect(() => {
    // This effect handles Google API initialization
    if (appState !== AppState.Initializing || !config) return;

    const initializeGoogleApis = async () => {
        try {
            await loadGapi();
            await initGapiClient(
                config.clientId,
                (tokenClient) => {
                    tokenClientRef.current = tokenClient;
                    // Initialization is complete. Show the login screen
                    // for the user to initiate sign-in.
                    setAppState(AppState.LoggedOut);
                },
                updateGAuthState,
                handleAuthError
            );
        } catch (err: any) {
            console.error("Initialization Error", err);
            const errorMessage = err.message || 'Please check your connection and Google Client ID.';
            setError(`Failed to initialize Google services. ${errorMessage}`);
            setAppState(AppState.Error);
        }
    };
    initializeGoogleApis();
  }, [appState, config, updateGAuthState, handleAuthError]);

  const onSignIn = useCallback(() => {
    if (!tokenClientRef.current) {
        setError("Google Client not initialized.");
        return;
    }
    handleSignIn(tokenClientRef.current);
  }, []);

  const onSignOut = useCallback(() => {
    handleSignOut();
  }, []);

  const handleSelectFiles = useCallback(async () => {
    if (!config) {
        setError("Configuration is missing.");
        setAppState(AppState.Configuration);
        return;
    }

    const accessToken = gapi.auth.getToken()?.access_token;
    if (!accessToken) {
      setError("Not authenticated. Please sign in again.");
      setAppState(AppState.LoggedOut);
      return;
    }

    try {
      const docs = await showPicker(accessToken, config.clientId, config.developerKey);
      if (docs.length > 0) {
        setSelectedFiles(docs);
        setIsProcessingFiles(true);
        setAppState(AppState.Processing);

        const fileContents = await Promise.all(
          docs.map(doc => getFileContent(doc.id, accessToken))
        );
        
        const context = fileContents.join('\n\n---\n\n');
        
        chatRef.current = createRAGChatSession(context);

        setMessages([
          {
            id: Date.now().toString(),
            role: ChatRole.AI,
            text: `I've finished reading ${docs.length} document(s). What would you like to know?`,
          }
        ]);

        setAppState(AppState.Chatting);
      }
    } catch (err: any) {
      console.error('Error during file selection or processing:', err);
      if (err.message !== 'Picker closed.') {
          setError('An error occurred while selecting or processing your files. Please try again.');
          setAppState(AppState.FileSelection);
      }
    } finally {
      setIsProcessingFiles(false);
    }
  }, [config]);
  
  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatRef.current) {
        setError("Chat session is not initialized.");
        return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: ChatRole.User, text };
    const aiMessagePlaceholder: Message = { id: (Date.now() + 1).toString(), role: ChatRole.AI, text: '' };
    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);

    try {
        await sendMessage(chatRef.current, text, (chunk) => {
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessagePlaceholder.id ? { ...msg, text: msg.text + chunk } : msg
            ));
        });
    } catch (err) {
        console.error("Error sending message:", err);
        const errorText = "Sorry, I encountered an error. Please try again.";
        setMessages(prev => prev.map(msg => 
            msg.id === aiMessagePlaceholder.id ? { ...msg, text: errorText } : msg
        ));
    }
  }, []);

  const handleReset = () => {
    setSelectedFiles([]);
    setMessages([]);
    chatRef.current = null;
    setAppState(AppState.FileSelection);
  }
  
  const handleResetConfig = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    localStorage.removeItem('GOOGLE_CLIENT_ID');
    localStorage.removeItem('GOOGLE_DEVELOPER_KEY');
    setConfig(null);
    setAppState(AppState.Configuration);
    setError(null);
    tokenClientRef.current = null;
    chatRef.current = null;
  }

  const renderContent = () => {
    switch (appState) {
      case AppState.Configuration:
        return <ConfigurationScreen onConfigure={handleConfigure} />;
      case AppState.Initializing:
        return <div className="flex flex-col justify-center items-center h-full text-white"><LoadingSpinner /> <span className="mt-4">Initializing Services...</span></div>;
      case AppState.LoggedOut:
        return <LoginScreen onSignIn={onSignIn} />;
      case AppState.FileSelection:
        return <FileSelectionScreen onSelectFiles={handleSelectFiles} />;
      case AppState.Processing:
        return <FileSelectionScreen onSelectFiles={handleSelectFiles} isProcessing={isProcessingFiles} selectedFiles={selectedFiles} />;
      case AppState.Chatting:
        return <ChatScreen messages={messages} onSendMessage={handleSendMessage} selectedFiles={selectedFiles} onReset={handleReset}/>;
      case AppState.Error:
        const isAuthGuideError = error?.startsWith('__AUTH_ERROR_GUIDE__');
        const errorMessage = isAuthGuideError ? error.replace('__AUTH_ERROR_GUIDE__\n', '') : error;
        
        const renderErrorContent = () => {
            if (!isAuthGuideError || !errorMessage) {
                return (
                    <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-left">
                        <p className="text-red-200 whitespace-pre-line leading-relaxed font-mono text-sm">{error}</p>
                    </div>
                );
            }
            
            const lines = errorMessage.split('\n');
            const originUri = lines.find(l => l.trim().startsWith('http'))?.trim();
            const helpLinkLine = lines.find(l => l.includes('console.cloud.google.com'));
            const helpLink = helpLinkLine?.split('Link: ')[1];

            return (
                <div className="mt-6 text-left text-gray-300 space-y-4 text-base leading-relaxed">
                    <p>{lines.find(l => l.includes('almost always caused'))}</p>
                    <p>{lines.find(l => l.startsWith('Please follow'))}</p>
                    <ol className="list-decimal list-inside space-y-3 pl-2 mt-4">
                        <li>
                            Go to your Google Cloud Console Credentials page.
                            {helpLink && <a href={helpLink} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-400 hover:underline break-all mt-1">{helpLink}</a>}
                        </li>
                        <li>Select the project you are using for this app.</li>
                        <li>Find the <strong>"OAuth 2.0 Client ID"</strong> you're using and click to edit it.</li>
                        <li>
                            Under <strong>"Authorized JavaScript origins"</strong>, you MUST add the following URI:
                            <code className="block bg-gray-900/70 p-3 rounded-md text-yellow-300 font-mono my-2 select-all text-center">{originUri}</code>
                        </li>
                        <li>Save your changes. It may take a few minutes to take effect.</li>
                        <li>Return here, reset the configuration, and try signing in again.</li>
                    </ol>
                    <p className="text-sm text-gray-400 italic pt-4 mt-4 border-t border-gray-700/50">{lines[lines.length - 1]}</p>
                </div>
            );
        };
        
        return (
            <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-red-500/50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-400">{isAuthGuideError ? 'Authentication Help' : 'Application Error'}</h2>
                    <p className="mt-2 text-md text-gray-400">
                       {isAuthGuideError ? 'A configuration issue was detected. Please follow the guide below.' : 'An error occurred that prevented the app from continuing.'}
                    </p>
                </div>
                {renderErrorContent()}
                <div className="mt-8 text-center">
                    <button 
                        onClick={handleResetConfig}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                        Reset Configuration and Start Over
                    </button>
                </div>
            </div>
        );
      default:
        return <div className="text-white">Something went wrong.</div>;
    }
  };
  
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col font-sans">
      <Header isSignedIn={appState !== AppState.LoggedOut && appState !== AppState.Initializing && appState !== AppState.Configuration} onSignOut={onSignOut} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
          {renderContent()}
      </main>
    </div>
  );
}
