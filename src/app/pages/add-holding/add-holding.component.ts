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
  IonFooter,
  LoadingController,
  ModalController,
  IonText,
  IonNote
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
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
      name: new FormControl({ value: '', disabled: false }, Validators.required),
      status: ['active', Validators.required],
      trade_date: ['', Validators.required],
      entryprice: [null, Validators.required],
      stoploss: new FormControl({ value: null, disabled: false }, Validators.required),
      quantity: [null, Validators.required],
    });
  }

  ngOnInit() {
    if (this.trade) {
      this.modalHeader = 'Edit Trade';
      this.patchForm(this.trade);
    } else if (this.holding) {
      this.modalHeader = 'Add Trade';
      this.patchForm(this.holding);
    }
  }

  private patchForm(data: any) {
    const nameControl = this.holdingForm.get('name');
    const stoplossControl = this.holdingForm.get('stoploss');

    nameControl?.enable({ emitEvent: false });
    stoplossControl?.enable({ emitEvent: false });

    this.holdingForm.patchValue({
      name: data.name || '',
      status: data.status || '',
      trade_date: data.trade_date || '',
      entryprice: data.entryprice || null,
      stoploss: data.stoploss || null,
      quantity: data.quantity || null,
    }, { emitEvent: false });

    nameControl?.disable({ emitEvent: false });
    stoplossControl?.disable({ emitEvent: false });

    this.updateInvestmentAndRisk();
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
    this.modalCtrl.dismiss({ success });
  }

  canSave(): boolean {
    return this.holdingForm.valid && this.investment <= this.maxInvestment && this.riskValue <= this.maxRiskValue;
  }
}
