import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpHelper } from '../../services/httpHelper';
import { environment } from '../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

// Define API endpoints
const APIs = {
  Supplier: {
    GetAll: '/Associate/ExAssoGetAll',
    Create: '/Associate/EXAssoCreate',
    Update: '/Associate/ExAssoUpdate',
    Delete: '/Associate/ExAssoDelete',
    GetById: '/Associate/ExAssoGet'
  }
};

// Supplier interface
// Update the Supplier interface to match the API response
export interface Supplier {
  id: number;
  nameEnglish: string;
  vendorName: string;
  primaryNumber: string;
  contactNumber?: string;
  nid: string;
  address: string;
  trackingId: number;
  isActive: boolean;
}

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  supplierForm: FormGroup;
  isEditing = false;
  showForm = false;
  selectedFiles: File[] = [];
  isLoading = false;
  errorMessage = '';
  private toastr = inject(ToastrService);
  
  // Add MatTableDataSource
  dataSource = new MatTableDataSource<Supplier>([]);
  
  // Add displayedColumns for the table
  displayedColumns: string[] = ['serialNumber', 'name', 'vendorName', 'phone1', 'nidNumber', 'address', 'status', 'actions'];
  
  // Add pagination properties
  pageNumber = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;
  
  // Add search term property
  searchTerm: string = '';
  
  // Add MatSort ViewChild
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder, private httpHelper: HttpHelper, private http: HttpClient) {
    this.supplierForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      vendorName: ['', Validators.required],
      phone1: ['', Validators.required],
      phone2: [''],
      nidNumber: ['', Validators.required],
      address: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  ngOnInit() {
    this.loadSuppliers();
  }
  
  // Add ngAfterViewInit for sorting
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  // Update loadSuppliers to include pagination and search
  // Update loadSuppliers to handle the API response format
  loadSuppliers(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = '') {
    this.isLoading = true;
    const _url = `${environment.apiUrl}${APIs.Supplier.GetAll}?pageNumber=${pageNumber}&pageSize=${pageSize}${searchTerm ? `&searchTerm=${searchTerm}` : ''}`;
    
    this.httpHelper
      .httpGet<any>(_url, {
        headers: this.httpHelper.getDefaultAuthHeaders()
      })
      .pipe(
        map((res) => res),
        catchError((err) => {
          console.error('Error loading suppliers', err);
          this.errorMessage = 'Failed to load suppliers. Please try again.';
          this.toastr.error('Failed to load suppliers', 'Error');
          return of({ 
            items: [], 
            totalItems: 0, 
            pageNumber: 1, 
            pageSize: 10, 
            totalPages: 0, 
            hasPreviousPage: false, 
            hasNextPage: false 
          });
        })
      )
      .subscribe({
        next: (data) => {
          this.suppliers = data.items || [];
          this.dataSource.data = this.suppliers;
          
          // Update pagination properties
          this.totalItems = data.totalItems;
          this.pageNumber = data.pageNumber;
          this.pageSize = data.pageSize;
          this.totalPages = data.totalPages;
          this.hasPreviousPage = data.hasPreviousPage;
          this.hasNextPage = data.hasNextPage;
          
          this.isLoading = false;
          // this.toastr.success('Executive Associates loaded successfully', 'Success');
        },
        error: (error) => {
          console.error('Error loading suppliers', error);
          this.errorMessage = 'Failed to load suppliers. Please try again.';
          this.toastr.error('Failed to load suppliers', 'Error');
          this.isLoading = false;
        }
      });
  }
  
  // Add pagination navigation methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadSuppliers(page, this.pageSize, this.searchTerm);
    }
  }

  previousPage() {
    if (this.hasPreviousPage) {
      this.loadSuppliers(this.pageNumber - 1, this.pageSize, this.searchTerm);
    }
  }

  nextPage() {
    if (this.hasNextPage) {
      this.loadSuppliers(this.pageNumber + 1, this.pageSize, this.searchTerm);
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.loadSuppliers(1, size, this.searchTerm); // Reset to first page when changing page size
  }
  
  // Add filter method
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;
    this.loadSuppliers(1, this.pageSize, this.searchTerm);
  }

  addSupplier() {
    this.showForm = true;
    this.isEditing = false;
    this.supplierForm.reset({
      status: 'active' // Default value
    });
    this.selectedFiles = [];
  }

  // Update editSupplier to match the API response field names
  editSupplier(supplier: Supplier) {
    this.showForm = true;
    this.isEditing = true;
    this.supplierForm.patchValue({
      id: supplier.id,
      name: supplier.nameEnglish,
      vendorName: supplier.vendorName,
      phone1: supplier.primaryNumber,
      phone2: supplier.contactNumber || '',
      nidNumber: supplier.nid,
      address: supplier.address,
      status: supplier.isActive ? 'active' : 'inactive'
    });
    this.selectedFiles = [];
  }

  // In the onSubmit method, update the form data field names to match what the API expects
  
  onSubmit() {
    // if (this.supplierForm.invalid) {
    //   this.toastr.warning('Please fill in all required fields', 'Form Validation');
    //   return;
    // }
    const formControls = this.supplierForm.controls;
    let hasErrors = false;


    if (!formControls['name'].value) {
      this.toastr.error('Name is required', 'Form Error');
      hasErrors = true;
    }

    if (!formControls['vendorName'].value) {
      this.toastr.error('vendorName is required', 'Form Error');
      hasErrors = true;
    }
    
    if (!formControls['phone1'].value) {
      this.toastr.error('Primary Number is required', 'Form Error');
      hasErrors = true;
    }

    if (!formControls['nidNumber'].value) {
      this.toastr.error('NID Number is required', 'Form Error');
      hasErrors = true;
    }

    if (hasErrors) {
      this.toastr.warning('Please fill in all required fields', 'Form Validation');
      return; // Return early without setting isLoading
    }
    
    this.isLoading = true;
    
    const formData = this.supplierForm.value;
    const formDataObj = new FormData();
    
    // Update field names to match the API's expected property names
    formDataObj.append('nameEnglish', formData.name);
    formDataObj.append('VendorName', formData.vendorName);
    formDataObj.append('PrimaryNumber', formData.phone1);
    formDataObj.append('ContactNumber', formData.phone2 || '');
    formDataObj.append('Nid', formData.nidNumber);
    formDataObj.append('Address', formData.address);
    // Convert status string to boolean value
    const statusValue = formData.status === 'active' ? 'true' : 'false';
    formDataObj.append('Status', statusValue);
    
    // Append selected files
    this.selectedFiles.forEach(file => {
      formDataObj.append('documents', file, file.name);
    });
    
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    
    if (this.isEditing) {
      const id = formData.id;
      const _url = `${environment.apiUrl}${APIs.Supplier.Update}/${id}`;
      formDataObj.append('Id', id);

      this.http.post(_url, formDataObj, { headers })
        .subscribe({
          next: () => {
            this.loadSuppliers();
            this.showForm = false;
            this.isLoading = false;
            this.toastr.success('Executive Associate updated successfully', 'Success');
          },
          error: (error) => {
            console.error('Error updating executive associate', error);
            this.errorMessage = 'Failed to update executive associate. Please try again.';
            this.toastr.error('Failed to update executive associate', 'Error');
            this.isLoading = false;
          }
        });
    } else {
      //const _url = `${environment.apiUrl}${APIs.Supplier.Create}`;
      
      // Change this:
      //this.http.post('https://localhost:7046/api/Associate/EXAssoCreate', formDataObj, { headers })
      
      // To use the environment variable like your other API calls:
      const _url = `${environment.apiUrl}${APIs.Supplier.Create}`;
      this.http.post(_url, formDataObj, { headers })
        .subscribe({
          next: () => {
            this.loadSuppliers();
            this.showForm = false;
            this.isLoading = false;
            this.toastr.success('Executive Associate created successfully', 'Success');
          },
          error: (error) => {
            console.error('Error creating executive associate', error);
            this.errorMessage = 'Failed to create executive associate. Please try again.';
            this.toastr.error('Failed to create executive associate', 'Error');
            this.isLoading = false;
          }
        });
    }
  }

  deleteSupplier(id: number) {
    if (confirm('Are you sure you want to delete this executive associate?')) {
      this.isLoading = true;
      const _url = `${environment.apiUrl}${APIs.Supplier.Delete}/${id}`;
      
      const token = localStorage.getItem('accessToken');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
      
      this.http.post(_url, {}, { headers })
        .subscribe({
          next: () => {
            this.loadSuppliers();
            this.isLoading = false;
            this.toastr.success('Executive Associate deleted successfully', 'Success');
          },
          error: (error) => {
            console.error('Error deleting executive associate', error);
            this.errorMessage = 'Failed to delete executive associate. Please try again.';
            this.toastr.error('Failed to delete executive associate', 'Error');
            this.isLoading = false;
          }
        });
    }
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFiles.push(input.files[i]);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  cancelForm() {
    this.showForm = false;
    this.supplierForm.reset();
    this.selectedFiles = [];
  }
}



