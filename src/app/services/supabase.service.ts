import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient | any;
  bucket = 'gallary';

  constructor() {
     this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey,{
         auth: {
      persistSession: false,
      autoRefreshToken: false
    }
     });
  }

  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
   const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'png'; // fallback to .png
  const fileName = `${timestamp}.${extension}`;
  const filePath = `public/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file, {
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  }

  async listImages(): Promise<string[]> {
    console.log('get')
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list('public', { limit: 100 });

    if (error) {
      console.error('List error:', error.message);
      return [];
    }

    return data.map((item: { name: any; }) =>
      this.supabase.storage.from(this.bucket).getPublicUrl(`public/${item.name}`).data.publicUrl
    );
  }

async deleteImage(path: string): Promise<boolean> {
  console.log('Deleting:', path); // Should be: public/filename.png
  const { error } = await this.supabase.storage.from('gallary').remove([path]);
  if (error) {
    console.error('Delete failed:', error.message);
    return false;
  }
  return true;
}
}
