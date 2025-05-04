import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesEnteryComponent } from './sales-entery.component';

describe('SalesEnteryComponent', () => {
  let component: SalesEnteryComponent;
  let fixture: ComponentFixture<SalesEnteryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesEnteryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesEnteryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
