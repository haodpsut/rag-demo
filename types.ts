// Add global declarations for Google APIs to fix TypeScript errors.
// These objects are loaded from <script> tags and are available globally.
declare global {
  const gapi: any;
  const google: any;
}

export interface DriveFile {
  id: string;
  name: string;
  iconUrl: string;
}

export enum ChatRole {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  role: ChatRole;
  text: string;
}

export enum AppState {
  Configuration,
  Initializing,
  LoggedOut,
  FileSelection,
  Processing,
  Chatting,
  Error,
}
