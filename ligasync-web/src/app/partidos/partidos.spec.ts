import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartidosComponent } from './partidos';

describe('Partidos', () => {
  let component: PartidosComponent;
  let fixture: ComponentFixture<PartidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartidosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PartidosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
