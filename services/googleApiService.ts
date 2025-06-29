import { SCOPES } from '../constants';
import { DriveFile } from '../types';

let tokenClient: any;

// Utility to load the GAPI script
export const loadGapi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => gapi.load('client:picker', resolve);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};


// Initializes the GAPI client and Google Identity Services
export const initGapiClient = (
  clientId: string,
  onTokenClientInitialized: (client: any) => void,
  updateGAuthState: (isSignedIn: boolean) => void,
  onAuthError: (error: any) => void
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!clientId) {
      return reject(new Error("Google Client ID is missing."));
    }
    
    try {
        await gapi.client.init({
          // API Key is not needed for Drive API v3 client initialization
        });
    } catch(err) {
        // This is a network error or something fundamental. Reject.
        return reject(new Error("GAPI client failed to initialize. Check network connection."));
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          gapi.client.setToken({ access_token: tokenResponse.access_token });
          updateGAuthState(true);
          // Load drive client after getting token
          try {
            await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
          } catch(e) {
            onAuthError({error: 'api_load_failed', details: 'Could not load the Google Drive API client.'});
          }
        } else {
          // This case is unlikely if there's no error, but handle it.
          updateGAuthState(false);
        }
      },
      error_callback: (error) => {
        console.error('GSI Error:', error);
        updateGAuthState(false);
        onAuthError(error);
      }
    });

    onTokenClientInitialized(tokenClient);
    resolve();
  });
};

export const handleSignIn = (client: any) => {
  // Prompt the user to select a Google Account and ask for consent to share their data
  // when establishing a new session.
  client.requestAccessToken({});
};

export const handleSignOut = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            // State update is handled by the callback in initGapiClient
        });
    }
};


// Shows the Google Picker UI for file selection
export const showPicker = (accessToken: string, clientId: string, developerKey: string): Promise<DriveFile[]> => {
    return new Promise((resolve, reject) => {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        // Only show files that can be converted to text
        view.setMimeTypes("application/vnd.google-apps.document,application/vnd.google-apps.presentation,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(clientId.split('-')[0])
            .setOAuthToken(accessToken)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setDeveloperKey(developerKey)
            .setCallback((data: any) => {
                if (data[google.picker.Action.PICKED]) {
                    const docs = data[google.picker.Response.DOCUMENTS].map((doc: any) => ({
                        id: doc[google.picker.Document.ID],
                        name: doc[google.picker.Document.NAME],
                        iconUrl: doc[google.picker.Document.ICON_URLS][0]
                    }));
                    resolve(docs as DriveFile[]);
                } else if (data[google.picker.Action.CANCEL]) {
                    reject(new Error("Picker closed."));
                }
            })
            .build();
        picker.setVisible(true);
    });
};

// Fetches the content of a file from Google Drive
export const getFileContent = async (fileId: string, accessToken: string): Promise<string> => {
    try {
        // First get metadata to check the mimeType
        const metaResponse = await gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'mimeType, name'
        });

        const mimeType = metaResponse.result.mimeType;

        // For Google Docs/Slides, we need to export them as text
        if (mimeType && mimeType.includes('google-apps')) {
            const exportResponse = await gapi.client.drive.files.export({
                fileId: fileId,
                mimeType: 'text/plain'
            });
            return `Content from document: ${metaResponse.result.name}\n\n${exportResponse.body}`;
        } else {
            // For other file types (like plain text, PDFs), get the content directly
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            // Note: Binary content (like PDFs) won't be readable as plain text here.
            // This setup works best for text-based files. A more advanced solution
            // would be needed for parsing PDFs on the client-side.
            return `Content from file: ${metaResponse.result.name}\n\n${response.body}`;
        }
    } catch (error) {
        console.error(`Error fetching content for file ${fileId}:`, error);
        return `[Error fetching content for file ${fileId}]`;
    }
};