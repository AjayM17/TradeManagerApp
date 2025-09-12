import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly bucket = 'gallary';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // 👇 expose supabase client if needed
  get client(): SupabaseClient {
    return this.supabase;
  }

  // ========= SETTINGS =========
  async getSetting() {
    const { data, error } = await this.supabase
      .from('setting')
      .select('*')
      .eq('id', 1) // always fetch the global row
      .single();

    if (error) throw error;
    return data;
  }

  async saveSetting(setting: any) {
    const { data, error } = await this.supabase
      .from('setting')
      .upsert([{ id: 1, ...setting }], { onConflict: 'id' });

    if (error) throw error;
    return data;
  }

  // ========= HOLDINGS =========
  async insertHolding(holding: any): Promise<void> {
    const { error } = await this.supabase.from('holdings').insert([holding]);
    if (error) throw error;
  }

  async updateHolding(holding: any): Promise<void> {
    if (!holding.id) throw new Error('Holding ID is required for update');

    const { error } = await this.supabase
      .from('holdings')
      .update(holding)
      .eq('id', holding.id);

    if (error) throw error;
  }

  async getHoldings() {
    const { data, error } = await this.supabase
      .from('holdings')
      .select('*')
      .order('trade_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async deleteHolding(id: string): Promise<void> {
    if (!id) throw new Error('Trade/Holding ID is required for deletion');

    const { error } = await this.supabase.from('holdings').delete().eq('id', id);
    if (error) throw error;
  }

  // ========= STORAGE =========
  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `${timestamp}.${extension}`;
    const filePath = `public/${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file, { upsert: false });

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
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list('public', { limit: 100 });

    if (error) {
      console.error('List error:', error.message);
      return [];
    }

    return data.map((item) =>
      this.supabase.storage.from(this.bucket).getPublicUrl(`public/${item.name}`).data.publicUrl
    );
  }

  async deleteImage(path: string): Promise<boolean> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([path]);
    if (error) {
      console.error('Delete failed:', error.message);
      return false;
    }
    return true;
  }
}
