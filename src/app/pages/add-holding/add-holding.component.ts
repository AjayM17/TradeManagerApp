import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  IonInput,
  IonButton,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonToggle,
  LoadingController,
  ModalController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { SupabaseService } from 'src/app/services/supabase.service';
import { UiHelperService } from 'src/app/services/ui-helper.service';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-holding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonInput,
    IonButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonToggle
  ],
  templateUrl: './add-holding.component.html',
  styleUrls: ['./add-holding.component.scss']
})
export class AddHoldingComponent implements OnInit, OnDestroy {
  @Input() holding: any;
  @Input() trade: any;
  @Input() isAdditionalTrade: boolean = false;
  @Input() selectedStatus: 'active' | 'waiting' | 'completed' = 'active';

  holdingForm: FormGroup;
  selectedFile: File | null = null;

  investment = 0;
  riskPer = 0;
  riskValue = 0;

  maxInvestment = 50000;
  maxRiskValue = 3000;

  modalHeader = 'Add Holding';
  private settingsSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private supabaseService: SupabaseService,
    private uiHelper: UiHelperService
  ) {
    this.holdingForm = this.fb.group({
      name: new FormControl('', Validators.required),
      status: [this.selectedStatus, Validators.required],
      trade_date: [null],
      entryprice: [null, Validators.required],
      stoploss: [null, Validators.required],
      quantity: [null, Validators.required],
      initial_stoploss: [null],
      enableInitialSL: [true]
    });
  }

  async ngOnInit() {
    console.log(this.holding)
    // Subscribe to latest settings
    this.settingsSub = this.supabaseService.settings$.subscribe(s => {
      if (s) {
        this.maxInvestment = s.max_trade_amount || 50000;
        this.maxRiskValue = s.max_stop_loss_amount || 3000;
      }
    });

    // Ensure settings loaded at least once
    if (!this.supabaseService.currentSettings) {
      await this.supabaseService.loadSettings();
    }

    this.holdingForm.get('status')?.setValue(this.selectedStatus || 'active');

    if (this.trade) {
      this.setupEditCase();
    } else if (this.holding) {
      this.setupAddMoreCase();
    } else {
      this.setupNewCase();
    }

    this.applyNonEditableRules();
  }

  ngOnDestroy() {
    if (this.settingsSub) {
      this.settingsSub.unsubscribe();
    }
  }

  /** ----------------- CASE HANDLERS ----------------- **/

  private setupEditCase() {
    this.modalHeader = 'Edit Trade';
    this.patchForm(this.trade);
    this.holdingForm.get('enableInitialSL')?.setValue(false);
    this.holdingForm.get('initial_stoploss')?.disable();
  }

  private setupAddMoreCase() {
    this.modalHeader = 'Add More';
    this.patchForm(this.holding);
    this.setInitialSLFromStoploss();
    this.syncStoplossToInitial();
  }

  private setupNewCase() {
    this.modalHeader = 'Add Trade';
    this.holdingForm.reset({
      status: this.selectedStatus || 'active',
      enableInitialSL: true
    });
    this.syncStoplossToInitial();
  }

  /** ----------------- HELPERS ----------------- **/

  private patchForm(data: any) {
    this.holdingForm.patchValue({
      name: data.name || '',
      trade_date: data.trade_date || '',
      entryprice: data.entryprice || null,
      stoploss: data.stoploss || null,
      quantity: data.quantity || null,
      initial_stoploss: data.initial_stoploss ?? data.stoploss ?? null,
    }, { emitEvent: false });

    this.updateInvestmentAndRisk();
  }

  private setInitialSLFromStoploss() {
    const sl = this.holdingForm.get('stoploss')?.value;
    this.holdingForm.get('initial_stoploss')?.setValue(sl);
    this.holdingForm.get('enableInitialSL')?.setValue(true);
  }

  private syncStoplossToInitial() {
    this.holdingForm.get('stoploss')?.valueChanges.subscribe(val => {
      if (this.holdingForm.get('enableInitialSL')?.value) {
        this.holdingForm.get('initial_stoploss')?.setValue(val, { emitEvent: false });
      }
    });
  }

  private applyNonEditableRules() {
    const isNonEditable = this.isAdditionalTrade || (this.trade && !this.trade.is_primary);
    if (isNonEditable) {
      this.holdingForm.get('name')?.disable();
      this.holdingForm.get('stoploss')?.disable();
    }
  }

  /** ----------------- FILE & CALC ----------------- **/

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  updateInvestmentAndRisk() {
    const entryPrice = +(this.holdingForm.get('entryprice')?.value || 0);
    const stoploss = +(this.holdingForm.get('stoploss')?.value || 0);
    const quantity = +(this.holdingForm.get('quantity')?.value || 0);

    this.investment = entryPrice * quantity;
    this.riskValue = (stoploss - entryPrice) * (quantity || 1);
    this.riskPer = entryPrice > 0 ? ((stoploss - entryPrice) / entryPrice) * 100 : 0;
  }

  /** ----------------- SAVE ----------------- **/

  async save() {
    if (!this.holdingForm.valid) return;

    const formData = this.holdingForm.getRawValue();
    const enableInitialSL = formData.enableInitialSL;
    delete formData.enableInitialSL;

    if (!enableInitialSL) delete formData.initial_stoploss;
    if (this.trade?.id) formData.id = this.trade.id;
    if (!formData.trade_date) formData.trade_date = null;

    const loading = await this.loadingCtrl.create({
      message: 'Saving holding...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (this.selectedFile) {
        const imageUrl = await this.supabaseService.uploadImage(this.selectedFile);
        formData.image = imageUrl;
      }
console.log(formData)
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
    return this.holdingForm.valid &&
      this.investment <= this.maxInvestment &&
      (
        this.riskValue >= 0 ||
        Math.abs(this.riskValue) <= this.maxRiskValue
      );
  }

  get riskValueAbs(): number {
    return Math.abs(this.riskValue || 0);
  }

  onToggleInitialSL(event: any) {
    if (event.detail.checked) {
      this.holdingForm.get('initial_stoploss')?.enable();
      this.setInitialSLFromStoploss();
    } else {
      this.holdingForm.get('initial_stoploss')?.disable();
    }
  }
}
