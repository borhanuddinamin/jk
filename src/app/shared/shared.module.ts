import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';

@NgModule({
  declarations: [
    ConfirmModalComponent
  ],
  imports: [
    CommonModule,
    NgbModule
  ],
  exports: [
    ConfirmModalComponent
  ]
})
export class SharedModule { } 