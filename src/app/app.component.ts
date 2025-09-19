import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent  implements OnInit {
  constructor(private supabaseService: SupabaseService) {}

    async ngOnInit() {
    await this.supabaseService.loadSettings(); // load only once
  }
}
