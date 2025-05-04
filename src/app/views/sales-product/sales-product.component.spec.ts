import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesProductComponent } from './sales-product.component';

describe('SalesProductComponent', () => {
  let component: SalesProductComponent;
  let fixture: ComponentFixture<SalesProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
