'use server';

/**
 * @fileOverview A flow to upload a note to Google Drive.
 * 
 * - uploadNoteToDrive - A function that handles uploading a file to a specific Google Drive folder.
 * - UploadNoteToDriveInput - The input type for the uploadNoteToDrive function.
 * - UploadNoteToDriveOutput - The return type for the uploadNoteToDrive function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { Readable } from 'stream';

const UploadNoteToDriveInputSchema = z.object({
  fileName: z.string().describe('The name of the file to be uploaded.'),
  fileContent: z.string().describe('The base64 encoded content of the file.'),
  mimeType: z.string().describe('The MIME type of the file.'),
});
export type UploadNoteToDriveInput = z.infer<typeof UploadNoteToDriveInputSchema>;

const UploadNoteToDriveOutputSchema = z.object({
  success: z.boolean(),
  fileId: z.string().optional(),
  webViewLink: z.string().optional(),
  webContentLink: z.string().optional(),
  error: z.string().optional(),
});
export type UploadNoteToDriveOutput = z.infer<typeof UploadNoteToDriveOutputSchema>;

async function getGoogleAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '{}');
  if (!credentials.client_email) {
      return null;
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return auth.getClient();
}

const uploadNoteToDriveFlow = ai.defineFlow(
  {
    name: 'uploadNoteToDriveFlow',
    inputSchema: UploadNoteToDriveInputSchema,
    outputSchema: UploadNoteToDriveOutputSchema,
  },
  async (input) => {
    const { fileName, fileContent, mimeType } = input;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
        return { success: false, error: "Google Drive Folder ID is not configured in .env file. Please ask the administrator to provide it." };
    }

    const auth = await getGoogleAuth();
    if (!auth) {
        return { success: false, error: "Google Service Account credentials are not configured correctly in .env file." };
    }

    const drive = google.drive({ version: 'v3', auth });

    const fileBuffer = Buffer.from(fileContent, 'base64');
    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    try {
        const file = await drive.files.create({
            media: media,
            requestBody: fileMetadata,
            fields: 'id, webViewLink, webContentLink',
        });
        
        // Make the file publicly readable
        await drive.permissions.create({
            fileId: file.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        return {
            success: true,
            fileId: file.data.id!,
            webViewLink: file.data.webViewLink!,
            webContentLink: file.data.webContentLink!,
        };
    } catch(e: any) {
        console.error("Google Drive API Error:", e);
        return { success: false, error: e.message || "An error occurred while uploading to Google Drive."}
    }
  }
);


export async function uploadNoteToDrive(input: UploadNoteToDriveInput): Promise<UploadNoteToDriveOutput> {
    return uploadNoteToDriveFlow(input);
}
