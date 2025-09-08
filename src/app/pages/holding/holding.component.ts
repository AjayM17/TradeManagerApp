import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonFab, IonFabButton, IonIcon, ModalController, LoadingController } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { TradeItemComponent } from '../../components/trade-item/trade-item.component';
import { RoundOffPipe } from 'src/app/pipes/round-off.pipe';
import { AddHoldingComponent } from '../add-holding/add-holding.component';
import { transformHoldings, TradeEntry } from 'src/app/utils/holdings.helper';

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
    RoundOffPipe
  ]
})
export class HoldingComponent {
  private modalCtrl = inject(ModalController);
  private supabase = inject(SupabaseService);
  private loadingCtrl = inject(LoadingController);

  holdings: any[] = [];
  expandedIndex: number | null = null;

  async ngOnInit() {
    await this.loadHoldings();
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
      modal.onDidDismiss().then(() => this.loadHoldings());
      modal.present();
    });
  }

getHoldingPnL(holding: any): number {
  const pnl = holding.trades?.reduce((sum: number, t: any) => sum + ((t.entryprice - t.stoploss) * t.quantity), 0) || 0;
  return pnl;
}
}
