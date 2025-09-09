import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class UiHelperService {
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // ---------------------
  // ALERT
  // ---------------------
  async showAlert(
    header: string,
    message: string,
    buttons: Array<string | { text: string; handler?: () => void }> = ['OK']
  ) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons,
    });
    await alert.present();
  }

  // ---------------------
  // CONFIRM ALERT
  // ---------------------
  async showConfirm(
    header: string,
    message: string,
    okText: string = 'Yes',
    cancelText: string = 'No'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: okText,
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }

  // ---------------------
  // TOAST
  // ---------------------
  async showToast(
    message: string,
    duration: number = 2000,
    position: 'top' | 'middle' | 'bottom' = 'bottom',
    color: string = 'primary'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position,
      color,
    });
    await toast.present();
  }
}
