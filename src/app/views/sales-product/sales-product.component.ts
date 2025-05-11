import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProgressComponent, ProgressBarComponent } from '@coreui/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Associate {
  id: number;
  name: string;
  associateType?: number;
  primaryNumber?: string;
  vendorName?: string;
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
  templateUrl: './sales-product.component.html',
  styleUrls: ['./sales-product.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    NgSelectModule, 
    ProgressComponent, 
    ProgressBarComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SalesProductComponent implements OnInit {
  // Add this property to control form visibility
  showForm: boolean = true;
  private toastr = inject(ToastrService);

  // Data table properties
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['sl', 'invoiceNumber', 'customerName', 'salesType', 'totalAmount', 'downPayment', 'date', 'status', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Pagination properties
  pageSize: number = 10;
  pageNumber: number = 1;
  totalItems: number = 0;
  isLoading: boolean = false;
  Math = Math; // To use Math in the template
  searchTerm: string = '';
  
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
  
  commissionDistribution: CommissionDistribution = {
    sales: 0,
    executive: 0,
    finance: 0,
    director: 0
  };

  installmentPlan: InstallmentItem[] = [];
  
  // Associate search properties
  associateSearchControl = new FormControl();
  isSearchingAssociate = false;
  selectedAssociate: Associate | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
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
      contactphone: ['', [Validators.pattern('^01[0-9]{9}$')]],
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
    // this.filteredAssociates = [...this.associates];
    this.filteredCustomers = [...this.customers];
    this.calculateTotals();
    
    // Setup associate search
   
  }

  setupAssociateSearch() {
    this.associateSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (typeof value === 'string' && value.trim()) {
            this.isSearchingAssociate = true;
            return this.searchAssociates(value.trim());
          } else {
            return of([]);
          }
        }),
        catchError(() => {
          this.isSearchingAssociate = false;
          return of([]);
        })
      )
      .subscribe(associates => {
        this.filteredAssociates =[];
        this.filteredAssociates = associates;
        this.isSearchingAssociate = false;
      });
  }

  searchAssociates(searchTerm: string) {
    // Default associate type is 2
    return this.http.get<Associate[]>(`${environment.apiUrl}/Associate/GetAssociate`, {
      params: {
        str: searchTerm,
        associate: '2'
      }
    }).pipe(
      catchError(error => {
        console.error('Error searching associates:', error);
        return of([]);
      })
    );
  }

  displayAssociateFn(associate: Associate): string {
    return associate ? associate.name : '';
  }

  onAssociateSearchChange(event: Event) {
    // const value = (event.target as HTMLInputElement).value;
    // if (!value || value.trim() === '') {
    //   this.filteredAssociates = [];
    // }

     this.setupAssociateSearch();
  }

  onAssociateSelected(event: MatAutocompleteSelectedEvent) {
    this.selectedAssociate = event.option.value;
    this.salesForm.patchValue({
      associate: this.selectedAssociate?.id
    });
    
    // Recalculate associate shares if needed
    this.calculateAssociateShares();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loadSales();
  }
  
  loadSales(page: number = 1, pageSize: number = 10, searchTerm: string = '') {
    this.isLoading = true;
    
    // Mock data for demonstration - replace with actual API call
    setTimeout(() => {
      const mockSales = [
        {
          id: 1,
          invoiceNumber: 'INV-001',
          date: new Date(),
          customer: { id: 1, name: 'John Doe' },
          salesType: 'Cash',
          totalAmount: 5000,
          downPayment: 5000,
          status: 'Completed'
        },
        {
          id: 2,
          invoiceNumber: 'INV-002',
          date: new Date(),
          customer: { id: 2, name: 'Jane Smith' },
          salesType: 'Installment',
          totalAmount: 10000,
          downPayment: 3000,
          status: 'Pending'
        },
        {
          id: 3,
          invoiceNumber: 'INV-003',
          date: new Date(Date.now() - 86400000 * 5), // 5 days ago
          customer: { id: 3, name: 'Robert Johnson' },
          salesType: 'Installment',
          totalAmount: 15000,
          downPayment: 5000,
          status: 'Pending'
        },
        {
          id: 4,
          invoiceNumber: 'INV-004',
          date: new Date(Date.now() - 86400000 * 10), // 10 days ago
          customer: { id: 1, name: 'John Doe' },
          salesType: 'Cash',
          totalAmount: 3000,
          downPayment: 3000,
          status: 'Completed'
        },
        {
          id: 5,
          invoiceNumber: 'INV-005',
          date: new Date(Date.now() - 86400000 * 15), // 15 days ago
          customer: { id: 4, name: 'Sarah Williams' },
          salesType: 'Installment',
          totalAmount: 20000,
          downPayment: 5000,
          status: 'Cancelled'
        }
      ];
      
      this.dataSource.data = mockSales;
      this.totalItems = mockSales.length;
      this.isLoading = false;
    }, 500);
  }
  
  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageIndex + 1;
    this.loadSales(this.pageNumber, this.pageSize, this.searchTerm);
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.searchTerm;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  viewSale(sale: any) {
    console.log('View sale', sale);
    // Implement view functionality
  }
  
  editSale(sale: any) {
    console.log('Edit sale', sale);
    this.showForm = true;
    // Implement edit functionality
  }
  
  deleteSale(id: number) {
    if (confirm('Are you sure you want to delete this sale?')) {
      console.log('Delete sale', id);
      // Implement delete functionality
    }
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

  // onAssociateSearch(term: string) {
  //   this.filteredAssociates = this.associates.filter(associate =>
  //     associate.name.toLowerCase().includes(term.toLowerCase())
  //   );
  // }

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
    
    if (type.includes('pdf')) return 'fas fa-file-pdf';
    if (type.includes('image')) return 'fas fa-file-image';
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word';
    if (type.includes('excel') || type.includes('sheet')) return 'fas fa-file-excel';
    
    return 'fas fa-file';
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
    if (this.selectedAssociate && this.selectedAssociate.id === id) {
      return this.selectedAssociate.name;
    }
    const associate = this.associates.find(a => a.id === id);
    return associate ? associate.name : 'Not selected';
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const fileList = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...fileList];
    }
  }

  saveCustomer() {
    if (this.customerForm.valid) {
      this.isSubmitting = true;
      
      const customerForm = new FormData();
      customerForm.append('nameEnglish', this.customerForm.get("name")?.value);
      customerForm.append('PrimaryNumber', this.customerForm.get("phone")?.value);
      customerForm.append('ContactNumber', this.customerForm.get("contactphone")?.value);
      customerForm.append('Nid', this.customerForm.get("nidNumber")?.value);
      customerForm.append('Address', this.customerForm.get("address")?.value);
      
      // Add documents/attachments to the form data
      if (this.selectedFiles && this.selectedFiles.length > 0) {
        for (let i = 0; i < this.selectedFiles.length; i++) {
          customerForm.append('documents', this.selectedFiles[i], this.selectedFiles[i].name);
        }
      }

      // Make API call to save customer
      const headers = this.getAuthHeaders();
      
      this.http.post(`${environment.apiUrl}/Associate/CustomerCreate`, customerForm, { headers })
        .pipe(
          catchError(error => {
            console.error('Error creating customer', error);
            this.toastr.error('Failed to create customer. Please try again.', 'Error');
            this.isSubmitting = false;
            return of(null);
          })
        )
        .subscribe({
          next: (response: any) => {
            if (response) {
              // Add the new customer to the customers array
              const newCustomer: Customer = {
                id: response.id,
                name: this.customerForm.get("name")?.value,
                phone: this.customerForm.get("phone")?.value,
                address: this.customerForm.get("address")?.value,
                nidNumber: this.customerForm.get("nidNumber")?.value,
                attachments: this.selectedFiles
              };
              
              this.customers.push(newCustomer);
              this.selectedCustomer = newCustomer;
              
              // Show success message
              this.toastr.success('Customer created successfully', 'Success');
              
              // Close the modal and reset form
              this.closeCustomerModal();
            }
            this.isSubmitting = false;
          }
        });
    }
  }

  /**
   * Cancels the current form and shows the sales data table
   */
  cancelForm(): void {
    // Reset the form to its initial state
    this.salesForm.reset();
    this.installmentPlan = [];
    this.selectedCustomer = null;
    
    // Hide the form and show the data table
    this.showForm = false;
    
    // Reset any other state variables as needed
    this.totals = {
      downPayment: 0,
      salesPrice: 0,
      downPaymentCommission: 0,
      discount: 0
    };
    this.associateShares = {
      sales: 0,
      executive: 0,
      finance: 0,
      director: 0
    };
  }
  
  /**
   * Shows the form for creating a new sale
   */
  addSale(): void {
    this.showForm = true;
    // Initialize the form with default values if needed
    this.salesForm.patchValue({
      salesType: 'Cash',
      downPayment: 0,
      downPaymentCommission: 0,
      discount: 0
    });
  }
}
