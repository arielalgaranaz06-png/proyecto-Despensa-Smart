import { TestBed } from '@angular/core/testing';
//import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProductosService } from './prodcutos.service';

describe('ProductosService', () => {
  let service: ProductosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
