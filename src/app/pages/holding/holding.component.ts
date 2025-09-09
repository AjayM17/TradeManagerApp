import { ChangeDetectorRef, Component, inject } from '@angular/core';
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
  AlertController,
  IonButton
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { TradeItemComponent } from '../../components/trade-item/trade-item.component';
import { RoundOffPipe } from 'src/app/pipes/round-off.pipe';
import { AddHoldingComponent } from '../add-holding/add-holding.component';
import { transformHoldings, TradeEntry } from 'src/app/utils/holdings.helper';
import { UiHelperService } from 'src/app/services/ui-helper.service';

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
    IonButton
  ]
})
export class HoldingComponent {
  private modalCtrl = inject(ModalController);
  private supabase = inject(SupabaseService);
  private loadingCtrl = inject(LoadingController);
  private actionSheetCtrl = inject(ActionSheetController);
  private uiHelper = inject(UiHelperService);
  private cdr = inject(ChangeDetectorRef);

  holdings: any[] = [];
  expandedIndex: number | null = null;

  investment = 0;
  pnl_val = 0;
  selectedStatusType: any;

  async ngOnInit() {
    this.refreshHoldings()
  }

  async refreshHoldings() {
    await this.loadHoldings();
    this.calculateSummary();
    this.cdr.detectChanges()
  }


  calculateSummary() {
    this.investment = this.holdings.reduce((sum, h) => sum + (h.totalInvested ?? 0), 0);

    const currentValue = this.holdings.reduce(
      (sum, h) => sum + ((h.totalQty ?? 0) * (h.stoploss ?? 0)),
      0
    );

    this.pnl_val = currentValue - this.investment;
  }

  getPnlPer(): string {
    return this.investment ? ((this.pnl_val / this.investment) * 100).toFixed(2) + '%' : '0%';
  }

  openFilter() {
    console.log('Filter clicked');
    // implement filter logic
  }

  openSort() {
    console.log('Sort clicked');
    // implement sort logic
  }

  async loadHoldings() {
    const loading = await this.loadingCtrl.create({ message: 'Loading Holdings...' });
    await loading.present();

    try {
      const data = await this.supabase.getHoldings();
      this.holdings = data ? transformHoldings(data as TradeEntry[]) : [];
      console.log('Holdings:', this.holdings);
    } catch (err) {
      console.error('Error fetching holdings', err);
      this.holdings = [];
    } finally {
      await loading.dismiss();
    }
  }

  toggleExpand(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  openAddHoldingModal() {
    this.modalCtrl.create({ component: AddHoldingComponent }).then(modal => {
      modal.onDidDismiss().then((result) => {
        // Only reload if user actually saved
        console.log(result)
        if (result?.data === true) {
          this.refreshHoldings()
        }
      });
      modal.present();
    });
  }

  getHoldingPnL(holding: any): number {
    const pnl =
      holding.trades?.reduce(
        (sum: number, t: any) => sum + (t.entryprice - t.stoploss) * t.quantity,
        0
      ) || 0;
    return pnl;
  }

  getSortedTrades(holding: any) {
    if (!holding.trades) return [];

    // Sort oldest first
    const sorted = [...holding.trades].sort(
      (a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    // Mark the first trade as initial
    return sorted.map((trade, index) => ({
      ...trade,
      isInitial: index === 0
    }));
  }



  async openTradeActions(trade: any, holding: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `${holding.name} - Trade`,
      buttons: [
        {
          text: 'Add More',
          icon: 'add-circle-outline',
          handler: () => {
            this.modalCtrl.create({
              component: AddHoldingComponent,
              componentProps: { holding }  // ✅ pass whole holding
            }).then(modal => {
              modal.onDidDismiss().then((result) => {
                // Only reload if user actually saved
                console.log(result)
                if (result?.data === true) {
                  this.refreshHoldings()
                }
              });
              modal.present();
            });
          }
        },
        {
          text: 'Edit',
          icon: 'create-outline',
          handler: () => {
            this.modalCtrl.create({
              component: AddHoldingComponent,
              componentProps: {
                holding,    // pass the holding
                trade       // pass the specific trade to edit
              }
            }).then(modal => {
              modal.onDidDismiss().then((result) => {
                // Only reload if user actually saved
                console.log(result)
                if (result?.data === true) {
                  this.refreshHoldings()
                }
              });
              modal.present();
            });
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            // Wrap in async IIFE
            (async () => {
              const confirmed = await this.uiHelper.showConfirm('Confirm', 'Are you sure want to delete trade?');
              if (!confirmed) return;

              try {
                await this.supabase.deleteHolding(trade.id);
                await this.uiHelper.showToast('Trade deleted successfully', 3000, 'top', 'success');
                this.refreshHoldings()

              } catch (error) {
                console.error('Error deleting trade:', error);
                await this.uiHelper.showToast('Failed to delete trade', 3000, 'top', 'danger');
              }
            })();
          }
        },
        {
          text: 'Mark As Complete',
          icon: 'checkmark-done-outline',
          handler: () => {
            console.log('Mark complete clicked', trade, holding);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });

    await actionSheet.present();
  }

}
