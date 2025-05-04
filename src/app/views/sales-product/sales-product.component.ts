import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProgressComponent, ProgressBarComponent } from '@coreui/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Associate {
  id: number;
  name: string;
}

interface Customer {
  id?: number;
  name: string;
  phone: string;
  address: string;
  nidNumber: string;
  attachments: File[];
}

interface AssociateShares {
  sales: number;
  executive: number;
  finance: number;
  director: number;
}

interface ProductTotals {
  salesPrice: number;
  downPayment: number;
  downPaymentCommission: number;
  discount: number;
  [key: string]: number; // Allow string indexing for dynamic property access
}

interface CommissionDistribution {
  sales: number;
  executive: number;
  finance: number;
  director: number;
  [key: string]: number; // Add index signature to allow string indexing
}

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  salesPrice?: number;
  downPayment?: number;
  downPaymentCommission?: number;
  discount?: number;
  [key: string]: any; // Allow string indexing for dynamic property access
}

interface InstallmentItem {
  number: number;
  date: Date;
  amount: number;
}

@Component({
  selector: 'app-sales-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, ProgressComponent, ProgressBarComponent],
  templateUrl: './sales-product.component.html',
  styleUrl: './sales-product.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SalesProductComponent implements OnInit {
  salesForm: FormGroup;
  customerForm: FormGroup;
  products: Product[] = [];
  associates: Associate[] = [];
  salesTypes = ['Cash', 'Installment'];
  filteredProducts: Product[] = [];
  filteredAssociates: Associate[] = [];
  totalPrice: number = 0;
  showCustomerModal = false;
  selectedFiles: File[] = [];
  showCustomerSearchModal = false;
  selectedCustomer: Customer | null = null;
  searchTerm = '';
  filteredCustomers: Customer[] = [];
  customers: Customer[] = [];
  isSubmitting = false;
  associateShares: AssociateShares = {
    sales: 0,
    executive: 0,
    finance: 0,
    director: 0
  };
  selectedProducts: SelectedProduct[] = [];
  totals: ProductTotals = {
    salesPrice: 0,
    downPayment: 0,
    downPaymentCommission: 0,
    discount: 0
  };
  
  // Add the commissionDistribution property inside the class
  commissionDistribution: CommissionDistribution = {
    sales: 0,
    executive: 0,
    finance: 0,
    director: 0
  };

  installmentPlan: InstallmentItem[] = [];

  constructor(private fb: FormBuilder) {
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

    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern('^01[0-9]{9}$')]],
      nidNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,17}$')]],
      address: ['', Validators.required],
      attachments: [[]]
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
    // Mock data - replace with actual API calls
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

    this.customers = [
      {
        id: 1,
        name: 'John Doe',
        phone: '01712345678',
        address: 'House 123, Road 45, Gulshan 2, Dhaka',
        nidNumber: '1234567890123',
        attachments: []
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '01812345678',
        address: 'Apartment 4B, Block C, Banani, Dhaka',
        nidNumber: '9876543210987',
        attachments: []
      }
    ];
    this.filteredCustomers = [...this.customers];
    this.calculateTotals();
  }

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
      
      // Always regenerate the installment plan after recalculating the amount
      this.generateInstallmentPlan();
    }
  }

  onSubmit() {
    if (this.salesForm.valid) {
      console.log(this.salesForm.getRawValue());
      // Handle form submission
    }
  }

  openCustomerModal() {
    this.showCustomerModal = true;
    this.customerForm.reset();
    this.selectedFiles = [];
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.customerForm.reset();
    this.selectedFiles = [];
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const fileList = input.files;
      const newFiles = Array.from(fileList).filter(file => file instanceof File) as File[];
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      this.customerForm.patchValue({
        attachments: this.selectedFiles
      });
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.customerForm.patchValue({
      attachments: this.selectedFiles
    });
  }

  triggerFileInput() {
    document.getElementById('fileInput')?.click();
  }

  onCustomerSubmit() {
    if (this.customerForm.valid) {
      this.isSubmitting = true;
      
      try {
        const newCustomer: Customer = {
          ...this.customerForm.value,
          id: this.customers.length + 1,
          attachments: this.selectedFiles
        };
        
        this.customers.push(newCustomer);
        this.selectedCustomer = newCustomer;
        this.closeCustomerModal();
        
        // Reset form and selected files
        this.customerForm.reset();
        this.selectedFiles = [];
      } catch (error) {
        console.error('Error submitting customer:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  openCustomerSearchModal() {
    this.showCustomerSearchModal = true;
    this.searchTerm = '';
    this.filteredCustomers = [...this.customers];
  }

  closeCustomerSearchModal() {
    this.showCustomerSearchModal = false;
  }

  onCustomerSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filteredCustomers = this.customers.filter(customer =>
      customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      customer.phone.includes(this.searchTerm)
    );
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.closeCustomerSearchModal();
  }

  clearCustomer() {
    this.selectedCustomer = null;
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredCustomers = [];
  }

  getFileIcon(file: File): string {
    const type = file.type.toLowerCase();
    if (type.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (type.includes('image')) {
      return 'fa-file-image';
    }
    return 'fa-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onCustomerSelect(customer: Customer | null) {
    this.selectedCustomer = customer;
    if (customer) {
      console.log('Selected customer:', customer);
      // Additional logic for when a customer is selected
    }
  }

  getAssociateName(id: number): string {
    const associate = this.associates.find(a => a.id === id);
    return associate ? associate.name : '';
  }

  calculateAssociateShares() {
    const downPayment = this.totals.downPayment || 0;
    
    if (downPayment > 0) {
      const totalShares = 5;
      const salesShare = (downPayment * 2) / totalShares;
      const otherShare = downPayment / totalShares;
      
      const calculatedTotal = salesShare + (otherShare * 3);
      const roundingDifference = downPayment - calculatedTotal;
      
      this.associateShares = {
        sales: salesShare + roundingDifference,
        executive: otherShare,
        finance: otherShare,
        director: otherShare
      };
    } else {
      this.associateShares = {
        sales: 0,
        executive: 0,
        finance: 0,
        director: 0
      };
    }
  }

  addProduct(product: any) {
    const existingProduct = this.selectedProducts.find(p => p.id === product.id);
    
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      this.selectedProducts.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        salesPrice: product.price,
        downPayment: 0,
        downPaymentCommission: 0,
        discount: 0
      });
    }
    
    this.calculateTotals();
  }
  
  removeProduct(index: number) {
    this.selectedProducts.splice(index, 1);
    this.calculateTotals();
  }
  
  updateProductField(product: SelectedProduct, field: string, event: any) {
    const value = parseFloat(event.target.value) || 0;
    product[field] = value;
    this.calculateTotals();
    
    if (field === 'downPayment') {
      this.calculateAssociateShares();
    }
  }
  
  calculateTotals() {
    this.totals = {
      salesPrice: this.selectedProducts.reduce((sum, product) => sum + (product.salesPrice || 0), 0),
      downPayment: this.selectedProducts.reduce((sum, product) => sum + (product.downPayment || 0), 0),
      downPaymentCommission: this.selectedProducts.reduce((sum, product) => sum + (product.downPaymentCommission || 0), 0),
      discount: this.selectedProducts.reduce((sum, product) => sum + (product.discount || 0), 0)
    };
  }
  
  updateTotalField(field: string, event: any) {
    const value = parseFloat(event.target.value) || 0;
    this.totals[field] = value;
    
    if (field === 'downPayment') {
      this.calculateAssociateShares();
    }
  }

  // Move the calculateCommissionDistribution method inside the class
  calculateCommissionDistribution() {
    const downPayment = this.salesForm.get('downPayment')?.value || 0;
    const commissionPercentage = this.salesForm.get('downPaymentCommission')?.value || 0;
    
    // Calculate total commission amount
    const totalCommission = downPayment * (commissionPercentage / 100);
    
    // Distribute in 2:1:1:1 ratio (total of 5 parts)
    this.commissionDistribution = {
      sales: Math.round((totalCommission * 2/5) * 100) / 100, // 40%
      executive: Math.round((totalCommission * 1/5) * 100) / 100, // 20%
      finance: Math.round((totalCommission * 1/5) * 100) / 100, // 20%
      director: Math.round((totalCommission * 1/5) * 100) / 100 // 20%
    };
  }

  generateInstallmentPlan() {
    const installmentSize = this.salesForm.get('installmentSize')?.value || 0;
    const startDate = this.salesForm.get('installmentDate')?.value || null;
    const amount = this.salesForm.get('installmentAmount')?.value || 0;
    
    // Clear existing plan
    this.installmentPlan = [];
    
    // Only require installmentSize and startDate to be valid
    if (installmentSize > 0 && startDate) {
      const startDateObj = new Date(startDate);
      
      // Calculate a default amount if not set
      const actualAmount = amount > 0 ? amount : 
        (this.totalPrice - (this.salesForm.get('downPayment')?.value || 0)) / installmentSize;
      
      // Generate installment rows
      for (let i = 1; i <= installmentSize; i++) {
        const installmentDate = new Date(startDateObj);
        // Add i-1 months to the start date
        installmentDate.setMonth(startDateObj.getMonth() + (i - 1));
        
        this.installmentPlan.push({
          number: i,
          date: installmentDate,
          amount: actualAmount
        });
      }
      
      // Force recalculation of the installment amount if it's still 0
      if (amount === 0) {
        this.calculateInstallmentAmount();
      }
    }
  }

  calculateTotalInstallmentAmount(): number {
    return this.installmentPlan.reduce((total, item) => total + item.amount, 0);
  }
}
