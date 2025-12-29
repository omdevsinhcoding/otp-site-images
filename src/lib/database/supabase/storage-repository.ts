import { supabase } from '@/integrations/supabase/client';
import type { IStorageRepository } from '../interfaces';
import type { OperationResult } from '../types';

const SUPABASE_URL = "https://sqbqutpuiqwwclyxjeem.supabase.co";

export class SupabaseStorageRepository implements IStorageRepository {
  async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<OperationResult<{ url: string }>> {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const url = this.getPublicUrl(bucket, path);
      
      // Add cache buster
      const urlWithCacheBuster = `${url}?t=${Date.now()}`;

      return { success: true, data: { url: urlWithCacheBuster } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async deleteFile(bucket: string, path: string): Promise<OperationResult> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
}
