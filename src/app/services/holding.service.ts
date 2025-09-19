import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HoldingService {

  private holdingCountSubject = new BehaviorSubject<number>(0);
  holdingCount$ = this.holdingCountSubject.asObservable();
  
  constructor() { }

    setCount(count: number) {
    this.holdingCountSubject.next(count);
  }
}
