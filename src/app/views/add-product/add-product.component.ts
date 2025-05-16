
import { Component, OnInit, AfterViewInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { of } from 'rxjs';
import { debounceTime, startWith, catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

// API endpoints
const APIs = {
  Product: {
    GetAll: '/Product/GetAll',
    Create: '/Product/Create',
    Update: '/Product/Update',
    Delete: '/Product/Delete',
    GetCategory: '/Product/GetCategory',
    CreateCategory: '/Product/CreateCategory',
    DeleteCategory: '/Product/DeleteCategory'
  },
  Associate: {
    GetExeAssociate: '/Associate/GetAssociate'
  }
};

// Category interface
interface Category {
  name: string;
  type: string;
  code: string;
  id: number;
  isActive: boolean;
  status: string | null;
  createBy: string | null;
  createDate: string;
  updateBy: string | null;
  updateDate: string | null;
}

// Executive Associate interface
interface ExecutiveAssociate {
  name: string;
  id: number;
  associateType: number;
  primaryNumber: string;
  vendorName: string;
}

// Product interface
interface Product {
  id: number;
  nameEnglish: string;
  nameBangla: string;
  entryDate: string;
  costPrice: number;
  salePrice: number;
  installmentPrice: number;
  minimumDownPayment: number;
  quantity: number;
  description: string;
  status: boolean | number;
  category: {
    id: number;
    name: string;
  };
  executiveAssociate: {
    id: number;
    name: string;
  };
  imageUrl?: string;
  productDetails?: {
    id: number;
    code: string;
  }[];
  // For backward compatibility with existing code
  productCode?: string;
  categoryId?: number;
  categoryName?: string;
  executiveAssociateId?: number;
  executiveAssociateName?: string;
}

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule
  ]
})
export class AddProductComponent implements OnInit, AfterViewInit, OnDestroy {
  // Add Math utility for template usage
  Math = Math;
  
  // Product data
  products: Product[] = [];
  productForm: FormGroup;
  isEditing = false;
  showForm = false;
  
  // Category data
  categories: Category[] = [];
  categoryNames: string[] = [];
  showCategoryModal = false;
  newCategory = '';
  isCategoryLoading = false;
  
  // Executive Associate data
  executiveAssociates: ExecutiveAssociate[] = [];
  executiveAssociateSearch: string = '';
  searchTimeout: any;
  executiveAssociateControl = new FormControl('');
  filteredSuppliers: ExecutiveAssociate[] = [];
  
  // Image handling
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  showCamera = false;
  videoStream: MediaStream | null = null;
  videoElement: HTMLVideoElement | null = null;
  
  // Product code generation
  searchQuery = '';
  showProductPreview = false;
  generatedProductCodes: string[] = [];
  
  // Loading state
  isLoading = false;
  
  // Pagination
  searchTerm = '';
  // Make sure these properties are initialized
  pageNumber: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  hasPreviousPage: boolean = false;
  hasNextPage: boolean = false;
  
  // Table configuration
  displayedColumns: string[] = [
    'sl',
    'nameEnglish', 
    'nameBangla', 
    'productCode', 
    'categoryName', 
    'executiveAssociateName', 
    'costPrice', 
    'installmentPrice', 
    'minimumDownPayment', 
    'status', 
    'quantity', 
    'actions'
  ];
  dataSource = new MatTableDataSource<Product>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  
  constructor(private fb: FormBuilder) {
     this.productForm = this.fb.group({});
    this.initializeForm();
  }
  
  // Add this property for tracking search state
  isSearchingExecutive = false;
  
  ngOnInit() {
    // this.onExecutiveAssociateSearchChange(); // Add this line
    // this.setupAutocomplete();
    this.loadInitialData();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  ngOnDestroy() {
    this.cleanupResources();
  }
  
  // Initialization methods
  private initializeForm() {
    this.productForm = this.fb.group({
      id: [null],
      nameEnglish: ['', Validators.required],
      nameBangla: [''],
      productCode: ['', Validators.required],
      entryDate: [new Date().toISOString().split('T')[0], Validators.required],
      costPrice: [0],
      salePrice: [0],
      installmentPrice: [0],
      minimumDownPayment: [0],
      quantity: [1, [Validators.required, Validators.min(1)]],
      categoryId: ['', Validators.required],
      executiveAssociateId: [''],
      status: [true],
      description: ['']
    });
    
    // Add listener for product code changes
    this.productForm.get('productCode')?.valueChanges.subscribe(value => {
      if (value) {
        const quantity = this.productForm.get('quantity')?.value || 1;
        if (quantity > 0) {
          this.showProductPreview = true;
          this.generateCodesFromProductCode(value, quantity);
        }
      }
    });
  }
  
  private setupAutocomplete() {
    this.executiveAssociateControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300)
      )
      .subscribe((value: string | ExecutiveAssociate | null) => {
        if (typeof value === 'string') {
          const searchTerm = value.trim();
          this.loadExecutiveAssociates(searchTerm);
        } else if (value && typeof value === 'object') {
          this.productForm.patchValue({ 
            executiveAssociateId: value.id 
          });
        }
      });
  }
  
  private loadInitialData() {
    this.loadCategories();
    this.loadExecutiveAssociates();
    this.loadProducts();
  }
  
  private cleanupResources() {
    if (this.videoStream) {
      this.stopCamera();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
  
  // Data loading methods
  loadCategories() {
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    
    this.http.get<Category[]>(`${environment.apiUrl}${APIs.Product.GetCategory}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error loading categories', error);
          this.toastr.error('Failed to load categories', 'Error');
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.categoryNames = data.map(cat => cat.name);
          this.isLoading = false;
        }
      });
  }
  
  loadExecutiveAssociates(searchTerm: string = '') {
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    
    const url = searchTerm && searchTerm.length > 1
      ? `${environment.apiUrl}${APIs.Associate.GetExeAssociate}?str=${searchTerm}`
      : `${environment.apiUrl}${APIs.Associate.GetExeAssociate}`;
    
    this.http.get<ExecutiveAssociate[]>(url, { headers })
      .pipe(
        catchError(error => {
          console.error('Error loading executive associates', error);
          this.toastr.error('Failed to load executive associates', 'Error');
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          if (searchTerm && searchTerm.length > 1) {
            this.filteredSuppliers = data;
          } else {
            this.executiveAssociates = data;
            this.filteredSuppliers = [...data];
          }
          this.isLoading = false;
        }
      });
  }
  
  loadProducts(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = '') {
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    
    // Build URL with query parameters
    let url = `${environment.apiUrl}${APIs.Product.GetAll}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm && searchTerm.trim() !== '') {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }
    
    this.http.get<any>(url, { headers })
      .subscribe({
        next: (response) => {
          // Handle response data
          if (response.items && Array.isArray(response.items)) {
            this.products = response.items.map((item: any) => {
              // Map API response to our Product interface
              return {
                ...item,
                // Add backward compatibility fields
                productCode: item.productDetails && item.productDetails.length > 0 ? 
                  item.productDetails[0].code : null,
                categoryId: item.category?.id,
                categoryName: item.category?.name,
                executiveAssociateId: item.executiveAssociate?.id,
                executiveAssociateName: item.executiveAssociate?.name
              };
            });
            
            this.dataSource.data = this.products;
            this.totalItems = response.totalItems;
            this.pageNumber = response.pageNumber;
            this.pageSize = response.pageSize;
            this.totalPages = response.totalPages;
            this.hasPreviousPage = response.hasPreviousPage;
            this.hasNextPage = response.hasNextPage;
          } else {
            // Fallback if API returns just an array
            this.products = Array.isArray(response) ? response : [];
            this.dataSource.data = this.products;
            this.totalItems = this.products.length;
          }
          
          // Calculate pagination values
          this.updatePaginationState();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading products', error);
          this.toastr.error('Failed to load products', 'Error');
          this.isLoading = false;
        }
      });
  }
  
  // Helper methods
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
  
  private updatePaginationState() {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.hasPreviousPage = this.pageNumber > 1;
    this.hasNextPage = this.pageNumber < this.totalPages;
  }
  
  // Display function for autocomplete
  displayExecutiveAssociateFn = (supplier: ExecutiveAssociate | null): string => {
    return supplier && supplier.name ? supplier.name : '';
  }
  
  // Pagination methods
  previousPage() {
    if (this.hasPreviousPage) {
      this.pageNumber--;
      this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
    }
  }
  
  nextPage() {
    if (this.hasNextPage) {
      this.pageNumber++;
      this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
    }
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageNumber = page;
      this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.pageNumber = 1; // Reset to first page when changing page size
    this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
  }
  
  // Ensure this method is correctly implemented
  getPaginationArray(): number[] {
    const paginationArray: number[] = [];
    
    if (!this.totalItems || this.totalItems === 0) {
      return paginationArray; // Return empty array if no items
    }
    
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (this.totalPages <= 7) {
      // If 7 or fewer pages, show all page numbers
      for (let i = 1; i <= this.totalPages; i++) {
        paginationArray.push(i);
      }
    } else {
      // Always include first page
      paginationArray.push(1);
      
      // Add ellipsis if current page is > 3
      if (this.pageNumber > 3) {
        paginationArray.push(-1); // -1 represents ellipsis
      }
      
      // Add pages around current page
      const startPage = Math.max(2, this.pageNumber - 1);
      const endPage = Math.min(this.totalPages - 1, this.pageNumber + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        paginationArray.push(i);
      }
      
      // Add ellipsis if current page is < totalPages - 2
      if (this.pageNumber < this.totalPages - 2) {
        paginationArray.push(-1); // -1 represents ellipsis
      }
      
      // Always include last page if there are multiple pages
      if (this.totalPages > 1) {
        paginationArray.push(this.totalPages);
      }
    }
    
    return paginationArray;
  }
  
  // Search and filter methods
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;
    
    // Reset to first page when filtering
    this.pageNumber = 1;
    
    // Call loadProducts with the current page, size, and new search term
    this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
  }
  
  searchExecutiveAssociates(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.executiveAssociateSearch = searchTerm;
    
    // Clear any existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set a timeout to avoid making too many API calls while typing
    this.searchTimeout = setTimeout(() => {
      this.loadExecutiveAssociates(searchTerm);
    }, 300);
  }
  
  filterSuppliers(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm) {
      this.filteredSuppliers = this.executiveAssociates.filter(
        supplier => supplier.name.toLowerCase().includes(searchTerm) || 
                   supplier.vendorName.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredSuppliers = [...this.executiveAssociates];
    }
  }
  
  // Product CRUD operations
  addProduct() {
    this.isEditing = false;
    this.showForm = true;
    this.productForm.reset({
      entryDate: new Date().toISOString().split('T')[0],
      costPrice: 0,
      salePrice: 0,
      installmentPrice: 0,
      minimumDownPayment: 0,
      quantity: 1,
      status: true
    });
    this.imagePreview = null;
    this.selectedImage = null;
    this.executiveAssociateSearch = '';
    this.showProductPreview = false;
  }
  
  editProduct(product: Product) {
    this.isEditing = true;
    this.showForm = true;
    
    // Reset form and prepare for editing
    this.resetForm();
    
    // Map the product data to the form
    this.productForm.patchValue({
      id: product.id,
      nameEnglish: product.nameEnglish,
      nameBangla: product.nameBangla,
      entryDate: new Date(product.entryDate).toISOString().split('T')[0],
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      installmentPrice: product.installmentPrice,
      minimumDownPayment: product.minimumDownPayment,
      quantity: product.quantity,
      categoryId: product.category?.id || product.categoryId,
      executiveAssociateId: product.executiveAssociate?.id || product.executiveAssociateId,
      status: product.status === 1 ? true : product.status === 0 ? false : product.status,
      description: product.description
    });
    
    // Set the executive associate search field
    const associate = this.executiveAssociates.find(a => a.id === (product.executiveAssociate?.id || product.executiveAssociateId));
    if (associate) {
      this.executiveAssociateSearch = associate.name;
    } else if (product.executiveAssociate?.name || product.executiveAssociateName) {
      this.executiveAssociateSearch = product.executiveAssociate?.name || product.executiveAssociateName || '';
    }
    
    // Handle product codes
    if (product.productDetails && product.productDetails.length > 0) {
      // Extract the base product code from the first code
      const firstCode = product.productDetails[0].code;
      this.productForm.get('productCode')?.setValue(firstCode);
      
      // Generate all product codes for preview
      this.generatedProductCodes = product.productDetails.map(detail => detail.code);
      this.showProductPreview = true;
    } else if (product.productCode) {
      this.productForm.get('productCode')?.setValue(product.productCode);
      // If there's only one product code, still show it in the preview
      this.generatedProductCodes = [product.productCode];
      this.showProductPreview = true;
    }
    
    // If there's an image URL, set the preview
    if (product.imageUrl) {
      this.imagePreview = product.imageUrl;
    }
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.isLoading = true;
      const headers = this.getAuthHeaders();
      
      this.http.post(`${environment.apiUrl}${APIs.Product.Delete}/${id}`, {}, { headers })
        .subscribe({
          next: () => {
            this.toastr.success('Product deleted successfully', 'Success');
            this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error deleting product', error);
            this.toastr.error('Failed to delete product', 'Error');
            this.isLoading = false;
          }
        });
    }
  }
  
  cancelForm() {
    this.showForm = false;
    this.productForm.reset();
    this.imagePreview = null;
    this.selectedImage = null;
  }
  
  onSubmit() {
    if (this.productForm.invalid) {
      this.toastr.error('Please fill all required fields', 'Error');
      return;
    }
    
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    const formData = this.prepareFormData();
    
    const url = this.isEditing 
      ? `${environment.apiUrl}${APIs.Product.Update}`
      : `${environment.apiUrl}${APIs.Product.Create}`;
    
    this.http.post(url, formData, { headers })
      .subscribe({
        next: () => {
          this.toastr.success(
            `Product ${this.isEditing ? 'updated' : 'added'} successfully`, 
            'Success'
          );
          this.showForm = false;
          this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm);
          this.resetForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error ${this.isEditing ? 'updating' : 'adding'} product`, error);
          this.toastr.error(`Failed to ${this.isEditing ? 'update' : 'add'} product`, 'Error');
          this.isLoading = false;
        }
      });
  }
  
  private prepareFormData(): FormData {
    const formData = new FormData();
    const productData = this.productForm.value;
    
    // Append all form fields to FormData
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    
    // Append image if selected
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }
    
    // Make sure product codes are generated if quantity > 1
    const quantity = this.productForm.get('quantity')?.value || 1;
    const productCode = this.productForm.get('productCode')?.value;
    
    // If quantity > 1 and we don't have generated codes yet, generate them now
    if (quantity > 1 && (!this.generatedProductCodes || this.generatedProductCodes.length === 0) && productCode) {
      this.generateCodesFromProductCode(productCode, quantity);
    }
    
    // Append generated product codes if available
    if (this.generatedProductCodes && this.generatedProductCodes.length > 0) {
      this.generatedProductCodes.forEach(code => {
        formData.append('ProductCode', code);
      });
    }
    
    return formData;
  }
  
  private resetForm() {
    this.productForm.reset();
    this.imagePreview = null;
    this.selectedImage = null;
    this.generatedProductCodes = [];
  }
  
  // Category management
  openCategoryModal() {
    this.showCategoryModal = true;
    this.newCategory = '';
  }
  
  closeCategoryModal() {
    this.showCategoryModal = false;
  }
  
  addCategory() {
    if (!this.newCategory.trim()) return;
    
    this.isCategoryLoading = true;
    const headers = this.getAuthHeaders();
    
    const categoryData = {
      name: this.newCategory.trim(),
      type: 'Product',
      code: this.newCategory.substring(0, 3).toUpperCase()
    };
    
    this.http.post(`${environment.apiUrl}${APIs.Product.CreateCategory}`, categoryData, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Category added successfully', 'Success');
          this.loadCategories();
          this.newCategory = '';
          this.isCategoryLoading = false;
        },
        error: (error) => {
          console.error('Error adding category', error);
          this.toastr.error('Failed to add category', 'Error');
          this.isCategoryLoading = false;
        }
      });
  }
  
  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      const headers = this.getAuthHeaders();
      
      this.http.post(`${environment.apiUrl}${APIs.Product.DeleteCategory}/${id}`, {}, { headers })
        .subscribe({
          next: () => {
            this.toastr.success('Category deleted successfully', 'Success');
            this.loadCategories();
          },
          error: (error) => {
            console.error('Error deleting category', error);
            this.toastr.error('Failed to delete category', 'Error');
          }
        });
    }
  }
  
  // Image handling
  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }
  
  startCamera() {
    this.showCamera = true;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.videoStream = stream;
        this.videoElement = document.getElementById('camera-feed') as HTMLVideoElement;
        if (this.videoElement) {
          this.videoElement.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Error accessing camera:', err);
        this.showCamera = false;
      });
  }
  
  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    this.showCamera = false;
  }
  
  captureImage() {
    if (this.videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        this.imagePreview = canvas.toDataURL('image/png');
        
        // Convert data URL to Blob and then to File
        fetch(this.imagePreview)
          .then(res => res.blob())
          .then(blob => {
            this.selectedImage = new File([blob], 'camera-capture.png', { type: 'image/png' });
            this.stopCamera();
          });
      }
    }
  }
  
  // Product code generation
  onSearch(query: string) {
    this.searchQuery = query.toLowerCase();
    this.dataSource.filter = this.searchQuery;
  }
  
  onQuantityChange(event: Event) {
    const quantity = +(event.target as HTMLInputElement).value;
    const baseCode = this.productForm.get('productCode')?.value;
    
    if (quantity > 0 && baseCode) {
      this.showProductPreview = true;
      this.generateCodesFromProductCode(baseCode, quantity);
    } else if (quantity <= 0) {
      this.toastr.warning('Quantity must be greater than 0', 'Warning');
      this.productForm.get('quantity')?.setValue(1);
    } else {
      // If we have quantity but no code, hide preview until code is entered
      this.showProductPreview = false;
      this.generatedProductCodes = [];
    }
  }
  
  generateProductCode() {
    const productName = this.productForm.get('nameEnglish')?.value;
    const quantity = this.productForm.get('quantity')?.value || 1;
    
    if (!productName) {
      this.toastr.warning('Please enter a product name first', 'Warning');
      return;
    }
    
    // Extract up to 6 characters from product name (remove spaces)
    const nameSegment = productName.replace(/\s+/g, '').substring(0, 6);
    
    // Generate a random 2-digit number for the middle part
    const randomNum = Math.floor(Math.random() * 90) + 10; // 10-99
    
    // Create the base code
    const baseCode = `JK${nameSegment}${randomNum}`;
    this.productForm.get('productCode')?.setValue(baseCode);
    
    // Generate product codes for preview
    this.showProductPreview = true;
    this.generatedProductCodes = Array.from({ length: quantity }, (_, i) => {
      const codeNumber = randomNum * 10 + i;
      return `JK${nameSegment}${codeNumber}`;
    });
  }
  
  generateCodesFromProductCode(baseCode: string, quantity: number) {
    if (!baseCode || baseCode.trim() === '') {
      this.generatedProductCodes = [];
      return;
    }
    
    // Check if it's our auto-generated format
    const match = baseCode.match(/^JK(.{1,6})(\d{2})$/);
    
    if (match) {
      // It's our format, generate sequential codes
      const nameSegment = match[1];
      const randomNum = parseInt(match[2]);
      
      this.generatedProductCodes = Array.from({ length: quantity }, (_, i) => {
        const codeNumber = randomNum * 10 + i;
        return `JK${nameSegment}${codeNumber}`;
      });
    } else {
      // It's a custom code, try to increment the last digits
      const customCodeBase = baseCode.replace(/\d+$/, '');
      const customCodeMatch = baseCode.match(/\d+$/);
      
      if (customCodeMatch) {
        // If there are trailing digits, increment them
        const customCodeNumber = parseInt(customCodeMatch[0]);
        
        this.generatedProductCodes = Array.from({ length: quantity }, (_, i) => {
          return `${customCodeBase}${(customCodeNumber + i).toString().padStart(customCodeMatch[0].length, '0')}`;
        });
      } else {
        // If there are no trailing digits, append numbers
        this.generatedProductCodes = Array.from({ length: quantity }, (_, i) => {
          return `${baseCode}${i + 1}`;
        });
      }
    }
  }
  
  // Executive Associate selection
  selectSupplier(supplier: ExecutiveAssociate): void {
    this.productForm.patchValue({
      executiveAssociateId: supplier.id
    });
    this.executiveAssociateSearch = supplier.name;
  }

  onExecutiveAssociateSearchChange() {
  this.executiveAssociateControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => {
      this.isSearchingExecutive = true;
    }),
    switchMap(value => {
      if (typeof value === 'string' && value.trim()) {
        // Use the existing API endpoint for searching executive associates
        const headers = this.getAuthHeaders();
        const url = `${environment.apiUrl}${APIs.Associate.GetExeAssociate}?str=${value.trim()}&associate=1`;
        
        return this.http.get<ExecutiveAssociate[]>(url, { headers }).pipe(
          catchError(error => {
            console.error('Error searching executive associates', error);
            this.toastr.error('Failed to search executive associates', 'Error');
            return of([]);
          }),
          tap(() => {
            this.isSearchingExecutive = false;
          })
        );
      } else {
        this.isSearchingExecutive = false;
        return of([]);
      }
    })
  ).subscribe(suppliers => {
    this.filteredSuppliers = suppliers;
  });
}
}
