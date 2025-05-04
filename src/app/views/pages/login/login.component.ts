import { Component } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective } from '@coreui/angular';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [
      CommonModule,
      ReactiveFormsModule,
      ContainerComponent, 
      RowComponent, 
      ColComponent, 
      TextColorDirective, 
      CardComponent, 
      CardBodyComponent, 
      FormDirective, 
      InputGroupComponent, 
      InputGroupTextDirective, 
      IconDirective, 
      FormControlDirective, 
      ButtonDirective
    ],
    standalone: true
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      phone: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onForgotPassword() {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
      size: 'md'
    });
    
    modalRef.componentInstance.title = 'Reset Password';
    modalRef.componentInstance.message = 'Are you sure you want to reset your password?';
    modalRef.componentInstance.confirmText = 'Reset Password';
    
    modalRef.result.then((result) => {
      if (result === 'confirm') {
        // Show success message
        const successModal = this.modalService.open(ConfirmModalComponent, {
          centered: true,
          size: 'md'
        });
        
        successModal.componentInstance.title = 'Password Reset';
        successModal.componentInstance.message = 'Your password will be reset by Admin';
        successModal.componentInstance.showConfirmButton = false;
        successModal.componentInstance.cancelText = 'Close';
      }
    }).catch(() => {
      // Handle dismiss
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    const credentials = this.loginForm.value;
    
    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
