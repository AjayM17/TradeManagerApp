import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryComponent } from './gallery/gallery.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,GalleryComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  }
