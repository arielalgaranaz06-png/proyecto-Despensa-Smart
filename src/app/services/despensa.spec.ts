import { TestBed } from '@angular/core/testing';
import { DespensaService } from './despensa';

describe('DespensaService', () => {
  let service: DespensaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DespensaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});