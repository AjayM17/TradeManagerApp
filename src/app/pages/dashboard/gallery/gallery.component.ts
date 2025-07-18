import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from 'src/app/services/supabase.service';
// import { ModalController } from '@ionic/angular';
import { ImageModalComponent } from '../../../components/image-modal/image-modal.component';
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
  ModalController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonFab,
    IonFabButton,
    IonIcon,
    IonToolbar,
    IonProgressBar
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit {
  images: string[] = [];
  progress = 0;
  uploading = false;

  constructor(private supabaseService: SupabaseService, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.loadImages();
  }

  async loadImages() {
    this.images = await this.supabaseService.listImages();
    console.log(this.images)
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;

    const imageUrl = await this.supabaseService.uploadImage(file, (percent) => {
      this.progress = percent;
    });

    this.uploading = false;
    this.progress = 0;

    if (imageUrl) {
      this.images.unshift(imageUrl);
    }
  }
  async openImage(imageUrl: string) {
    const imagePath = this.getImagePathFromUrl(imageUrl);
    const modal = await this.modalCtrl.create({
      component: ImageModalComponent,
      componentProps: {
        imageUrl,
        imagePath
      },
    });
    await modal.present();

    modal.onWillDismiss().then((result: { data?: { deleted?: boolean } }) => {
      if (result.data?.deleted) {
        this.images = this.images.filter((img) => img !== imageUrl);
      }
    });
  }

getImagePathFromUrl(url: string): string {
  const parts = url.split('?')[0].split('/');
  const index = parts.findIndex(p => p === 'gallary');
  const path = parts.slice(index + 1).join('/');
  console.log('Parsed path to delete:', path); // Should be: public/filename.png
  return path;
}

}
