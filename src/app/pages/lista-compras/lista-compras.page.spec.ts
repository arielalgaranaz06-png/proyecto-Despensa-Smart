import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaComprasPage } from './lista-compras.page';

describe('ListaComprasPage', () => {
  let component: ListaComprasPage;
  let fixture: ComponentFixture<ListaComprasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaComprasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
