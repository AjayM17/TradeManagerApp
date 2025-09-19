import { TestBed } from '@angular/core/testing';

import { HoldingService } from './holding.service';

describe('HoldingService', () => {
  let service: HoldingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HoldingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
