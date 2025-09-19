import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Holding, TradeEntry } from '../utils/holdings.helper';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly bucket = 'gallary';

  // ---------- SETTINGS ----------
  private settingsSubject = new BehaviorSubject<any | null>(null);
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Expose supabase client if needed
  get client(): SupabaseClient {
    return this.supabase;
  }

  // Get current settings snapshot
  get currentSettings() {
    return this.settingsSubject.value;
  }

  // Load settings from Supabase
  async loadSettings(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('setting')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
       console.log(data)
      this.settingsSubject.next(data || null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      this.settingsSubject.next(null);
    }
  }

async updateSetting(newValues: any): Promise<any> {
  // Step 1: upsert the new values
  const { error: upsertError } = await this.supabase
    .from('setting')
    .upsert([{ id: 1, ...newValues }], { onConflict: 'id' });

  if (upsertError) throw upsertError;

  // Step 2: fetch the updated row
  const { data, error: fetchError } = await this.supabase
    .from('setting')
    .select('*')
    .eq('id', 1)
    .single();

  if (fetchError) throw fetchError;

  // Step 3: emit updated settings
  console.log('Updated setting from DB:', data);
  this.settingsSubject.next(data || null);

  return data;
}


  // Optional: get setting once without updating BehaviorSubject
  async getSetting(): Promise<any> {
    const { data, error } = await this.supabase
      .from('setting')
      .select('*')
      .eq('id', 1)
      .single();

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

  async getHoldings(status: string = 'active'): Promise<Holding[]> {
    const { data, error } = await this.supabase
      .from('holdings')
      .select('*')
      .eq('status', status)
      .order('trade_date', { ascending: false });

    if (error) throw error;

    // Group trades by holding name
    const grouped = data.reduce((acc: Record<string, TradeEntry[]>, row: any) => {
      const trade: TradeEntry = {
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        entryprice: row.entryprice,
        stoploss: row.stoploss,
        initial_stoploss: row.initial_stoploss ?? row.stoploss,
        status: row.status,
        trade_date: row.trade_date,
        image: row.image,
        created_at: row.created_at,
        is_primary: false,
        riskReward: '',
        riskRewardValue: 0,
      };
      if (!acc[row.name]) acc[row.name] = [];
      acc[row.name].push(trade);
      return acc;
    }, {});

    // Build Holding objects
    const holdings: Holding[] = Object.entries(grouped).map(([name, trades]) => {
      trades.sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

      const totalQty = trades.reduce((sum, t) => sum + t.quantity, 0);
      const totalInvested = trades.reduce((sum, t) => sum + t.entryprice * t.quantity, 0);
      const avgPrice = totalQty ? totalInvested / totalQty : 0;

      trades = trades.map((t, idx) => ({ ...t, is_primary: idx === 0 }));
      const primaryTrade = trades[0];
      const primarySL = primaryTrade.stoploss;
      const initialSL = primaryTrade.initial_stoploss ?? primarySL;

      const updatedTrades = trades.map(t => {
        const initialRisk = t.entryprice - t.initial_stoploss;
        const reward = primarySL - t.entryprice;
        const ratioValue = initialRisk !== 0 ? reward / initialRisk : 0;
        const ratioStr = initialRisk === 0 ? 'N/A' : `1:${ratioValue % 1 === 0 ? ratioValue : ratioValue.toFixed(2)}`;
        return { ...t, stoploss: primarySL, riskReward: ratioStr, riskRewardValue: ratioValue };
      });

      const initialRiskHolding = avgPrice - initialSL;
      const rewardHolding = primarySL - avgPrice;
      const holdingRRValue = initialRiskHolding !== 0 ? rewardHolding / initialRiskHolding : 0;
      const holdingRR = initialRiskHolding === 0 ? 'N/A' : `1:${holdingRRValue % 1 === 0 ? holdingRRValue : holdingRRValue.toFixed(2)}`;

      return {
        id: primaryTrade.id,
        name,
        totalQty,
        avgPrice,
        totalInvested,
        stoploss: primarySL,
        initial_stoploss: initialSL,
        riskReward: holdingRR,
        riskRewardValue: holdingRRValue,
        trades: updatedTrades,
      };
    });

    return holdings;
  }

  async deleteHolding(id: string): Promise<void> {
    if (!id) throw new Error('Trade/Holding ID is required for deletion');

    const { error } = await this.supabase.from('holdings').delete().eq('id', id);
    if (error) throw error;
  }

  // ========= STORAGE / IMAGES =========
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

    const { data: publicUrlData } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  }

  async listImages(): Promise<string[]> {
    const { data, error } = await this.supabase.storage.from(this.bucket).list('public', { limit: 100 });
    if (error) {
      console.error('List error:', error.message);
      return [];
    }

    return data.map(item => this.supabase.storage.from(this.bucket).getPublicUrl(`public/${item.name}`).data.publicUrl);
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
