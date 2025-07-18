import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-add-holding',
  templateUrl: './add-holding.component.html',
  styleUrls: ['./add-holding.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AddHoldingComponent {
  holding = {
    name: '',
    status: '',
    entryPrice: null,
    stoploss: null,
    quantity: null,
    image: null,
  };

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {
    console.log('Holding data:', this.holding);
    this.modalCtrl.dismiss(this.holding);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.holding.image = file;
  }
}
