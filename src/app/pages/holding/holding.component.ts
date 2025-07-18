import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddHoldingComponent } from '../../pages/add-holding/add-holding.component';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonFab,
  IonFabButton,
  IonIcon,
  ModalController,
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-holding',
  templateUrl: './holding.component.html',
  styleUrls: ['./holding.component.scss'],
  imports: [CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonFab,
    IonFabButton,
    IonToolbar,
    IonIcon],
})
export class HoldingComponent {
  constructor(private modalCtrl: ModalController) { }

  async openAddHoldingModal() {
    const modal = await this.modalCtrl.create({
      component: AddHoldingComponent,
    });

    await modal.present();
  }
}
