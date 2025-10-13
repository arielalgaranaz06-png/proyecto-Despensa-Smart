import { TestBed } from '@angular/core/testing';

import { Firebase } from './firebase';

describe('Firebase', () => {
  let service: Firebase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Firebase);
  });
  
//debug
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
