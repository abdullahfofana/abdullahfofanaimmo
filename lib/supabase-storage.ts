import { supabase } from '@/backend/supabase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

async function uriToFileData(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
}

export const storageService = {
  async uploadFile(
    uri: string,
    path: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    try {
      const fileData = await uriToFileData(uri);

      const storageClient = supabase.storage.from('property-files');

      const { data, error } = await storageClient.upload(path, fileData, {
        contentType,
        upsert: false,
      });

      if (error) {
        if (error.message?.includes('not configured') || error.code === 'SUPABASE_NOT_CONFIGURED' || error.code === 'SUPABASE_INIT_FAILED') {
          throw new Error('Supabase is not properly configured. Please check your environment variables.');
        }

        if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
          throw new Error('Storage bucket "property-files" does not exist. Please create it in your Supabase dashboard.');
        }

        throw new Error(`Storage upload failed: ${error.message || JSON.stringify(error)}`);
      }

      const { data: urlData } = storageClient.getPublicUrl(path);
      return urlData.publicUrl;
    } catch (error) {
      console.error('[Storage] Upload failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  },

  async uploadPhoto(uri: string, propertyId: string, index: number): Promise<string> {
    const fileName = `photo_${index}_${Date.now()}.jpg`;
    const path = `properties/${propertyId}/photos/${fileName}`;
    return this.uploadFile(uri, path, 'image/jpeg');
  },

  async uploadVideo(uri: string, propertyId: string): Promise<string> {
    const fileName = `video_${Date.now()}.mp4`;
    const path = `properties/${propertyId}/videos/${fileName}`;
    return this.uploadFile(uri, path, 'video/mp4');
  },

  async uploadDocument(uri: string, propertyId: string): Promise<string> {
    const extension = uri.split('.').pop() || 'pdf';
    const fileName = `document_${Date.now()}.${extension}`;
    const path = `properties/${propertyId}/documents/${fileName}`;
    return this.uploadFile(uri, path, 'application/pdf');
  },

  async uploadMultiplePhotos(
    uris: string[],
    propertyId: string,
    onProgress?: (index: number, total: number) => void
  ): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < uris.length; i++) {
      if (onProgress) {
        onProgress(i + 1, uris.length);
      }
      const url = await this.uploadPhoto(uris[i], propertyId, i);
      urls.push(url);
    }

    return urls;
  },
};
