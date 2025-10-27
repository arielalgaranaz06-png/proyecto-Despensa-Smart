import { TestBed } from '@angular/core/testing';

import { AuthRestService } from './auth-rest.service';

describe('AuthRestService', () => {
  let service: AuthRestService;

  beforeEach(() => {
    // Proveemos un stub para evitar que el constructor real haga llamadas de red
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthRestService, useValue: { getToken: () => null, setToken: (_: string) => {} } }
      ]
    });
    service = TestBed.inject(AuthRestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
