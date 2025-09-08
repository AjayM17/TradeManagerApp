import { Component } from '@angular/core';
import {
  IonInput,
  IonLabel,
  IonItem,
  IonButton,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonDatetime,
  IonModal,
  IonFooter,
  LoadingController,
  ToastController,
  ModalController,
  IonText,
  IonNote
} from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from 'src/app/services/supabase.service';

@Component({
  selector: 'app-add-holding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonInput,
    IonLabel,
    IonItem,
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonDatetime,
    IonModal,
    IonFooter,
    IonText,
    IonNote
  ],
  templateUrl: './add-holding.component.html',
})
export class AddHoldingComponent {
  holdingForm: FormGroup;
  selectedFile: File | null = null;
  showDatePicker = false;
  tempDate: string = '';

  // Display-only calculated fields
  investment: number = 0;
  riskPer: number = 0;
  riskValue: number = 0;

  // Limits (future: load from Settings)
  maxInvestment = 50000;
  maxRiskValue = 3000;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private supabaseService: SupabaseService
  ) {
    this.holdingForm = this.fb.group({
      name: ['', Validators.required],
      status: ['', Validators.required],
      trade_date: ['', Validators.required],
      entryprice: [null],
      stoploss: [null],
      quantity: [null],
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  updateInvestmentAndRisk() {
    const entryPrice = +this.holdingForm.get('entryprice')?.value || 0;
    const stoploss = +this.holdingForm.get('stoploss')?.value || 0;
    const quantity = +this.holdingForm.get('quantity')?.value || 0;

    this.investment = entryPrice * quantity;
    this.riskValue = (entryPrice - stoploss) * quantity;
    this.riskPer = this.investment > 0 ? (this.riskValue / this.investment) * 100 : 0;
  }

  async save() {
    if (this.holdingForm.invalid) return;

    // extra safety (button already disabled if invalid)
    if (this.investment > this.maxInvestment) {
      this.presentToast(`Investment exceeds limit of ${this.maxInvestment}`, 'danger');
      return;
    }
    if (this.riskValue > this.maxRiskValue) {
      this.presentToast(`Risk Value exceeds limit of ${this.maxRiskValue}`, 'danger');
      return;
    }

    const formData = this.holdingForm.value;
    const loading = await this.loadingCtrl.create({
      message: 'Saving holding...',
      spinner: 'crescent',
    });

    await loading.present();

    try {
      if (this.selectedFile) {
        const imageUrl = await this.supabaseService.uploadImage(this.selectedFile);
        formData.image = imageUrl;
      }

      await this.supabaseService.insertHolding(formData);
      await loading.dismiss();
      this.presentToast('Holding saved successfully');
      this.dismiss(true);
    } catch (error) {
      console.error('Error saving holding:', error);
      this.presentToast('Error saving holding', 'danger');
      await loading.dismiss();
    }
  }

  dismiss(success: boolean = false) {
    this.modalCtrl.dismiss(success);
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }

  cancelDate() {
    this.tempDate = '';
    this.showDatePicker = false;
  }

  confirmDate() {
    if (this.tempDate) {
      this.holdingForm.get('trade_date')?.setValue(this.tempDate);
    }
    this.showDatePicker = false;
  }

  // Helper: check if save allowed
  canSave(): boolean {
    return (
      this.holdingForm.valid &&
      this.investment <= this.maxInvestment &&
      this.riskValue <= this.maxRiskValue
    );
  }
}
