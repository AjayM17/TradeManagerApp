import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase.service';

@Component({
  selector: 'app-setting',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class SettingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      capital_to_invest: ['', [Validators.required, Validators.min(1)]],
      max_stop_loss_amount: ['', [Validators.required, Validators.min(1)]],
      max_holding_limit: ['', [Validators.required, Validators.min(1)]],
      max_trade_amount: ['', [Validators.required, Validators.min(1)]],
    });

    this.loadSetting();

    // Subscribe to updates if settings change elsewhere
    this.supabase.settings$.subscribe(setting => {
      if (setting) {
        this.form.patchValue(setting);
      }
    });
  }

  private async loadSetting(): Promise<void> {
    try {
      await this.supabase.loadSettings(); // load once
      const setting = this.supabase.currentSettings;
      if (setting) {
        this.form.patchValue(setting);
      }
    } catch (err) {
      console.error('Error loading setting:', err);
      this.showToast('Error loading settings', 'danger');
    }
  }

  async saveSetting(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Saving...' });
    await loading.present();

    try {
      const updatedSetting = await this.supabase.updateSetting(this.form.value);
      this.showToast('Settings saved successfully', 'success');

      // form updated automatically via BehaviorSubject subscription
      this.form.patchValue(updatedSetting);
    } catch (err) {
      console.error('Error saving setting:', err);
      this.showToast('Error saving settings', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }
}
