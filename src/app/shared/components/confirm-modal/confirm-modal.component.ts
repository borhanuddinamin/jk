import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule], // ✅ Import CommonModule for *ngIf
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ title }}</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p>{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button *ngIf="showConfirmButton" type="button" class="btn btn-primary" (click)="activeModal.close('confirm')">
        {{ confirmText }}
      </button>
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">
        {{ cancelText || 'Cancel' }}
      </button>
    </div>
  `
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Are you sure?';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() showConfirmButton: boolean = true;

  constructor(public activeModal: NgbActiveModal) {}
}
