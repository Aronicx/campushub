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
  fileId: z.string().describe('The ID of the uploaded file.'),
  webViewLink: z.string().describe('A link to view the file in the browser.'),
  webContentLink: z.string().describe('A link to download the file directly.'),
});
export type UploadNoteToDriveOutput = z.infer<typeof UploadNoteToDriveOutputSchema>;

async function getGoogleAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '{}');
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
        throw new Error("Google Drive Folder ID is not configured in .env file. Please ask the user to provide it from the folder's URL.");
    }

    const auth = await getGoogleAuth();
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
      fileId: file.data.id!,
      webViewLink: file.data.webViewLink!,
      webContentLink: file.data.webContentLink!,
    };
  }
);


export async function uploadNoteToDrive(input: UploadNoteToDriveInput): Promise<UploadNoteToDriveOutput> {
    return uploadNoteToDriveFlow(input);
}
