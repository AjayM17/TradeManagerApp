import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoundOffPipe } from 'src/app/pipes/round-off.pipe';
import { AgePipe } from 'src/app/pipes/age.pipe';

@Component({
  selector: 'app-trade-item',
  standalone: true,
  templateUrl: './trade-item.component.html',
  styleUrls: ['./trade-item.component.scss'],
  imports: [CommonModule, RoundOffPipe, AgePipe]
})
export class TradeItemComponent {
  @Input() trade: any;
}
