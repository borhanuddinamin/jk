import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

interface Customer {
  id?: number;
  name: string;
  phone: string;
  address: string;
  nidNumber: string;
  attachments: File[];
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Associate {
  id: number;
  name: string;
}

@Component({
  selector: 'app-customer-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './customer-entry.component.html',
  styleUrl: './customer-entry.component.scss'
})
export class CustomerEntryComponent implements OnInit {
  customerForm: FormGroup;
  salesForm: FormGroup;
  selectedFiles: File[] = [];
  isEditing = false;
  showForm = false;
  showSalesModal = false;
  products: Product[] = [];
  associates: Associate[] = [];
  salesTypes = ['Cash', 'Installment'];
  filteredProducts: Product[] = [];
  filteredAssociates: Associate[] = [];
  totalPrice: number = 0;
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  constructor(private fb: FormBuilder) {
    this.initForm();
    this.salesForm = this.fb.group({
      products: [[], [Validators.required, Validators.minLength(1)]],
      salesPrice: [{ value: 0, disabled: true }],
      associate: [null, Validators.required],
      downPayment: [0, [Validators.required, Validators.min(0)]],
      downPaymentCommission: [0, [Validators.required, Validators.min(0)]],
      salesType: ['Cash', Validators.required],
      discount: [0, [Validators.required, Validators.min(0)]],
      installmentSize: [{ value: 1, disabled: true }, [Validators.required, Validators.min(1)]],
      installmentDate: [{ value: '', disabled: true }, Validators.required],
      installmentAmount: [{ value: 0, disabled: true }]
    });

    // Enable/disable installment fields based on sales type
    this.salesForm.get('salesType')?.valueChanges.subscribe(value => {
      const installmentControls = ['installmentSize', 'installmentDate', 'installmentAmount'];
      if (value === 'Installment') {
        installmentControls.forEach(control => this.salesForm.get(control)?.enable());
      } else {
        installmentControls.forEach(control => this.salesForm.get(control)?.disable());
      }
    });

    // Calculate installment amount when relevant fields change
    this.salesForm.valueChanges.subscribe(() => {
      this.calculateInstallmentAmount();
    });
  }

  ngOnInit() {
    this.showForm = true;
    // Mock data - replace with actual API calls
    this.customers = [
      {
        id: 1,
        name: 'John Doe',
        phone: '01712345678',
        address: 'Dhaka, Bangladesh',
        nidNumber: '1234567890',
        attachments: []
      }
    ];

    this.products = [
      { id: 1, name: 'Product 1', price: 1000 },
      { id: 2, name: 'Product 2', price: 2000 },
      { id: 3, name: 'Product 3', price: 3000 }
    ];

    this.associates = [
      { id: 1, name: 'Associate 1' },
      { id: 2, name: 'Associate 2' },
      { id: 3, name: 'Associate 3' }
    ];

    this.filteredProducts = [...this.products];
    this.filteredAssociates = [...this.associates];
  }

  private initForm() {
    this.customerForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
      address: ['', Validators.required],
      nidNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,17}$')]],
      attachments: [null]
    });
  }

  openForm(): void {
    this.showForm = true;
    this.customerForm.reset();
    this.selectedFiles = [];
  }

  closeForm(): void {
    this.showForm = false;
    this.customerForm.reset();
    this.selectedFiles = [];
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.customerForm.patchValue({ attachments: this.selectedFiles });
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.customerForm.patchValue({ attachments: this.selectedFiles });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      console.log('Form Data:', this.customerForm.value);
      this.closeForm();
    }
  }

  getFileIcon(file: File): string {
    if (file.type.includes('pdf')) return 'fa-file-pdf';
    if (file.type.includes('image')) return 'fa-file-image';
    return 'fa-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Sales Modal Methods
  onProductSelect(selectedProducts: Product[]) {
    if (selectedProducts && selectedProducts.length > 0) {
      this.totalPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0);
      this.salesForm.patchValue({
        salesPrice: this.totalPrice
      });
    } else {
      this.totalPrice = 0;
      this.salesForm.patchValue({
        salesPrice: 0
      });
    }
    this.calculateInstallmentAmount();
  }

  onProductSearch(term: string) {
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  onAssociateSearch(term: string) {
    this.filteredAssociates = this.associates.filter(associate =>
      associate.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  calculateInstallmentAmount() {
    const formValues = this.salesForm.getRawValue();
    if (formValues.salesType === 'Installment' && this.totalPrice > 0) {
      const remainingAmount = this.totalPrice - formValues.downPayment - formValues.discount;
      const installmentAmount = remainingAmount / formValues.installmentSize;
      this.salesForm.patchValue({
        installmentAmount: Math.round(installmentAmount * 100) / 100
      }, { emitEvent: false });
    }
  }

  onSalesSubmit() {
    if (this.salesForm.valid) {
      const salesData = {
        ...this.salesForm.getRawValue(),
        customer: this.customerForm.value
      };
      console.log('Sales Data:', salesData);
      this.closeSalesModal();
    }
  }

  openSalesModal() {
    this.showSalesModal = true;
  }

  closeSalesModal() {
    this.showSalesModal = false;
    this.salesForm.reset({
      salesType: 'Cash',
      downPayment: 0,
      downPaymentCommission: 0,
      discount: 0,
      installmentSize: 1
    });
  }
}
