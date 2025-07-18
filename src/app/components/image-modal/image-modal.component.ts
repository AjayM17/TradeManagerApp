import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from 'src/app/services/supabase.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonToolbar,
  IonProgressBar,
  ModalController,
  IonImg,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-image-modal',
  standalone: true,
  imports: [CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonIcon,
    IonToolbar,
    IonImg,
    IonButton,
    IonButtons
  ],
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.scss'],
})
export class ImageModalComponent {
  @Input() imageUrl: string = '';
  @Input() imagePath: string = ''; // ✅ Add this input

  constructor(
    private modalCtrl: ModalController,
    private supabaseService: SupabaseService
  ) {}

  close() {
    this.modalCtrl.dismiss();
  }

  async deleteImage() {
    const confirmed = confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;
    const deleted = await this.supabaseService.deleteImage(this.imagePath);
    if (deleted) {
      this.modalCtrl.dismiss({ deleted: true }); // ✅ Let parent know
    } else {
      alert('Failed to delete image');
    }
  }
}
