import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonCard,
  IonFab,
  IonFabButton,
  IonIcon,
  ModalController,
  LoadingController,
  ActionSheetController,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { TradeItemComponent } from '../../components/trade-item/trade-item.component';
import { RoundOffPipe } from 'src/app/pipes/round-off.pipe';
import { AddHoldingComponent } from '../add-holding/add-holding.component';
import { TradeEntry, Holding } from 'src/app/utils/holdings.helper';
import { UiHelperService } from 'src/app/services/ui-helper.service';

type SortField = 'name' | 'pnl' | 'investment';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-holding',
  standalone: true,
  templateUrl: './holding.component.html',
  styleUrls: ['./holding.component.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonFab,
    IonFabButton,
    IonIcon,
    TradeItemComponent,
    RoundOffPipe,
    IonButtons,
    IonButton,
    IonSelect,
    IonSelectOption
  ]
})
export class HoldingComponent {
  @ViewChild('sortSelect') sortSelect!: IonSelect;

  private modalCtrl = inject(ModalController);
  private supabase = inject(SupabaseService);
  private loadingCtrl = inject(LoadingController);
  private actionSheetCtrl = inject(ActionSheetController);
  private uiHelper = inject(UiHelperService);
  private cdr = inject(ChangeDetectorRef);

  holdings: Holding[] = [];
  sortedHoldings: Holding[] = [];
  expandedHoldingId: string | null = null;
  investment = 0;
  pnl_val = 0;
  selectedStatus: 'active' | 'waiting' | 'completed' = 'active';

  sortField: SortField = 'name';
  sortOrder: SortOrder = 'asc';

  async ngOnInit() {
    await this.refreshHoldings();
  }

  async refreshHoldings() {
    const loading = await this.loadingCtrl.create({ message: 'Loading Holdings...' });
    await loading.present();

    try {
      const data = await this.supabase.getHoldings(this.selectedStatus);
      this.holdings = data || [];
    } catch (err) {
      console.error('Error fetching holdings', err);
      this.holdings = [];
    } finally {
      await loading.dismiss();
    }

    this.calculateSummary();
    this.applySorting();
    this.cdr.detectChanges();
    console.log(this.sortedHoldings)
  }

  calculateSummary() {
    let investment = 0;
    let currentValue = 0;
    for (const h of this.holdings) {
      investment += h.totalInvested ?? 0;
      currentValue += (h.totalQty ?? 0) * (h.stoploss ?? 0);
    }
    this.investment = investment;
    this.pnl_val = currentValue - investment;
  }

  openFilterPopover(select: IonSelect) {
  select.open();
}

onFilterChange(value: 'active' | 'waiting' | 'completed') {
  this.selectedStatus = value;
  this.refreshHoldings();
}

  applySorting() {
    this.sortedHoldings = [...this.holdings].sort((a, b) => {
      let valA: any, valB: any;
      switch (this.sortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'pnl':
          valA = this.getHoldingPnL(a);
          valB = this.getHoldingPnL(b);
          break;
        case 'investment':
          valA = a.totalInvested ?? 0;
          valB = b.totalInvested ?? 0;
          break;
      }
      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  setSort(field: SortField, order: SortOrder) {
    this.sortField = field;
    this.sortOrder = order;
    this.applySorting();
  }

  openSortPopover(select: IonSelect) {
    select.open();
  }

  toggleExpand(holdingId: string) {
    this.expandedHoldingId = this.expandedHoldingId === holdingId ? null : holdingId;
    this.cdr.detectChanges();
  }

  getHoldingPnL(holding: Holding): number {
    return holding.trades?.reduce((sum, t) => sum + (t.stoploss - t.entryprice) * t.quantity, 0) || 0;
  }

  getPnlPer(): string {
    return this.investment ? ((this.pnl_val / this.investment) * 100).toFixed(2) + '%' : '0%';
  }

  async openAddHoldingModal() {
    const modal = await this.modalCtrl.create({ component: AddHoldingComponent,componentProps: { selectedStatus: this.selectedStatus } });
    modal.onDidDismiss().then(result => { if (result?.data?.success) this.refreshHoldings(); });
    await modal.present();
  }

  async openTradeActions(trade: TradeEntry, holding: Holding) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `${holding.name} - Trade`,
      buttons: [
        { text: 'Add More', icon: 'add-circle-outline', handler: () => this.openAddTradeModal(holding) },
        { text: 'Edit', icon: 'create-outline', handler: () => this.openEditTradeModal(holding, trade) },
        { text: 'Delete', role: 'destructive', icon: 'trash-outline', handler: () => this.deleteTrade(trade) },
        { text: 'Cancel', role: 'cancel', icon: 'close' }
      ]
    });
    await actionSheet.present();
  }

  async openAddTradeModal(holding: Holding) {
    const modal = await this.modalCtrl.create({ component: AddHoldingComponent, componentProps: { holding, isAdditionalTrade: true,  selectedStatus: this.selectedStatus } });
    modal.onDidDismiss().then(result => { if (result?.data?.success) this.refreshHoldings(); });
    await modal.present();
  }

  async openEditTradeModal(holding: Holding, trade: TradeEntry) {
    const modal = await this.modalCtrl.create({ component: AddHoldingComponent, componentProps: { holding, trade , selectedStatus: this.selectedStatus} });
    modal.onDidDismiss().then(result => { if (result?.data?.success) this.refreshHoldings(); });
    await modal.present();
  }

  async deleteTrade(trade: TradeEntry) {
    const confirmed = await this.uiHelper.showConfirm('Confirm', 'Are you sure want to delete trade?');
    if (!confirmed) return;

    try {
      await this.supabase.deleteHolding(trade.id);
      await this.uiHelper.showToast('Trade deleted successfully', 3000, 'top', 'success');
      this.expandedHoldingId = null;
      this.refreshHoldings();
    } catch (err) {
      console.error(err);
      await this.uiHelper.showToast('Failed to delete trade', 3000, 'top', 'danger');
    }
  }

  trackByHoldingId(index: number, holding: Holding) { return holding.id; }
  trackByTradeId(index: number, trade: TradeEntry) { return trade.id; }
}
