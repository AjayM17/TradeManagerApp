import { Component, Input, OnInit } from '@angular/core';
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
  ModalController,
  IonText,
  IonNote
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from 'src/app/services/supabase.service';
import { UiHelperService } from 'src/app/services/ui-helper.service';

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
  styleUrls: ['./add-holding.component.scss']
})
export class AddHoldingComponent implements OnInit {
  @Input() holding: any;
  @Input() trade: any;

  holdingForm: FormGroup;
  selectedFile: File | null = null;
  showDatePicker = false;
  tempDate: string = '';

  investment = 0;
  riskPer = 0;
  riskValue = 0;

  maxInvestment = 50000;
  maxRiskValue = 3000;

  modalHeader = 'Add Holding';

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private supabaseService: SupabaseService,
    private uiHelper: UiHelperService
  ) {
    this.holdingForm = this.fb.group({
      name: ['', Validators.required],
      status: ['', Validators.required],
      trade_date: ['', Validators.required], // string safe
      entryprice: [null, Validators.required],
      stoploss: [null, Validators.required],
      quantity: [null, Validators.required],
    });
  }

  ngOnInit() {
    if (this.trade) {
      this.modalHeader = 'Edit Trade';
      this.holdingForm.patchValue({
        name: this.trade.name || '',
        status: this.trade.status || '',
        trade_date: this.trade.trade_date || '',
        entryprice: this.trade.entryprice || null,
        stoploss: this.trade.stoploss || null,
        quantity: this.trade.quantity || null,
      });

      this.holdingForm.get('name')?.disable();
      this.holdingForm.get('stoploss')?.disable();

      this.updateInvestmentAndRisk();
    } else if (this.holding) {
      this.modalHeader = 'Add Trade';
      this.holdingForm.patchValue({
        name: this.holding.name || '',
        stoploss: this.holding.stoploss || null,
      });

      this.holdingForm.get('name')?.disable();
      this.holdingForm.get('stoploss')?.disable();
    }
  }

  get isNameDisabled(): boolean {
    return !!this.holdingForm.get('name')?.disabled;
  }

  get isStoplossDisabled(): boolean {
    return !!this.holdingForm.get('stoploss')?.disabled;
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  updateInvestmentAndRisk() {
    const entryPrice = +(this.holdingForm.get('entryprice')?.value || 0);
    const stoploss = +(this.holdingForm.get('stoploss')?.value || 0);
    const quantity = +(this.holdingForm.get('quantity')?.value || 0);

    this.investment = entryPrice * quantity;
    this.riskValue = (entryPrice - stoploss) * quantity;
    this.riskPer = this.investment > 0 ? (this.riskValue / this.investment) * 100 : 0;
  }

  async save() {
    if (!this.holdingForm.valid) return;

    if (this.investment > this.maxInvestment) {
      await this.uiHelper.showToast(`Investment exceeds limit of ${this.maxInvestment}`, 3000, 'top', 'danger');
      return;
    }
    if (this.riskValue > this.maxRiskValue) {
      await this.uiHelper.showToast(`Risk Value exceeds limit of ${this.maxRiskValue}`, 3000, 'top', 'danger');
      return;
    }

    const formData = this.holdingForm.getRawValue();
    if (this.holding?.id) formData.holdingId = this.holding.id;
    if (this.trade?.id) formData.id = this.trade.id;

    const loading = await this.loadingCtrl.create({ message: 'Saving holding...', spinner: 'crescent' });
    await loading.present();

    try {
      if (this.selectedFile) {
        const imageUrl = await this.supabaseService.uploadImage(this.selectedFile);
        formData.image = imageUrl;
      }

      if (this.trade?.id) {
        await this.supabaseService.updateHolding(formData);
      } else {
        await this.supabaseService.insertHolding(formData);
      }

      await loading.dismiss();
      this.dismiss(true);
    } catch (error) {
      console.error(error);
      await loading.dismiss();
    }
  }

  dismiss(success: boolean = false) {
     this.modalCtrl.dismiss({
    success: success
  });
  }

  cancelDate() {
    this.tempDate = '';
    this.showDatePicker = false;
  }

  confirmDate() {
    if (this.tempDate) this.holdingForm.get('trade_date')?.setValue(this.tempDate);
    this.showDatePicker = false;
  }

  canSave(): boolean {
    return this.holdingForm.valid && this.investment <= this.maxInvestment && this.riskValue <= this.maxRiskValue;
  }

  onDateChange(event: any) {
  const value = event?.detail?.value;
  if (value && typeof value === 'string') {
    this.tempDate = value;
  }
}
}
