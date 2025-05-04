import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpHelper } from '../../services/httpHelper';
import { environment } from '../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService  } from 'ngx-toastr';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

// Define API endpoints
const APIs = {
  Associate: {
    GetAll: '/Associate/GetAll',
    Create: '/Associate/Create',
    Update: '/Associate/Update',
    Delete: '/Associate/Delete',
    GetById: '/Associate/Get'
  }
};

// Updated Associate interface with only the fields you need
export interface Associate {
  id: number;
  nameEnglish: string;
  nameBengali: string;
  primaryNumber: string;
  contactNumber?: string;
  nid: string;
  address: string;
  trackingId?: number;
  isActive?: boolean;
  guarantors: {
    id: number;
    name: string;
    relation: string;
    nid: string;
    address: string;
    primaryPhone: string;
  }[];
}

@Component({
  selector: 'app-associate-management',
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
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.scss']
})
export class EmployeeManagementComponent implements OnInit {
  associates: Associate[] = [];
  associateForm: FormGroup;
  isEditing = false;
  showForm = false;
  selectedFiles: File[] = [];
  isLoading = false;
  errorMessage = '';
  private toastr = inject(ToastrService);

  constructor(private fb: FormBuilder, private httpHelper: HttpHelper, private http: HttpClient
  ) {
    this.associateForm = this.fb.group({
      id: [null],
      nameEnglish: [''],
      nameBengali: [''],
      phone1: [''],
      phone2: [''],
      nidNumber: [''],
      address: [''],
      guarantorName: [''],
      guarantorRelation: [''],
      guarantorAddress: [''],
      guarantorPhone: [''],
      guarantorNidNumber: ['']
    });
  }

  ngOnInit() {
    //this.toastr.warning('Please fill in all required fields', 'Form Validation');

    this.loadAssociates();
    
    // Test if toastr is working
    // setTimeout(() => {
    //   this.toastr.info('Component initialized', 'Info');
    // }, 1000);
  }

  // Add pagination properties to the component class
  // Add pagination properties
  pageNumber = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  // // Add this method to your component class
  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
  //   // Filter the associates array based on the search term
  //   this.associates = this.allAssociates.filter(associate => 
  //     associate.nameEnglish.toLowerCase().includes(filterValue) ||
  //     associate.nameBengali.toLowerCase().includes(filterValue) ||
  //     associate.primaryNumber.toLowerCase().includes(filterValue) ||
  //     associate.nid.toLowerCase().includes(filterValue) ||
  //     associate.address.toLowerCase().includes(filterValue) ||
  //     (associate.guarantors && associate.guarantors.length > 0 && 
  //      associate.guarantors[0].name.toLowerCase().includes(filterValue))
  //   );
    
  //   // If you're using server-side filtering, you would call loadAssociates with the filter
  //   // this.loadAssociates(this.pageNumber, this.pageSize, filterValue);
  // }
  
  // You'll need to store the original list of associates
  allAssociates: Associate[] = [];
  
  // // Update your loadAssociates method to store the original list
  // loadAssociates(pageNumber: number = 1, pageSize: number = 10) {
  //   this.isLoading = true;
  //   const _url = `${environment.apiUrl}${APIs.Associate.GetAll}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
  //   this.httpHelper
  //     .httpGet<any>(_url, {
  //       headers: this.httpHelper.getDefaultAuthHeaders()
  //     })
  //     .pipe(
  //       map((res) => res),
  //       catchError((err) => {
  //         console.error('Error loading associates', err);
  //         this.errorMessage = 'Failed to load associates. Please try again.';
  //         this.toastr.error('Failed to load associates', 'Error');
  //         return of({ items: [], totalItems: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
  //       })
  //     )
  //     .subscribe({
  //       next: (data) => {
  //         // Update the associates array with the items from the response
  //         this.associates = data.items;
          
  //         // Update pagination properties
  //         this.totalItems = data.totalItems;
  //         this.pageNumber = data.pageNumber;
  //         this.pageSize = data.pageSize;
  //         this.totalPages = data.totalPages;
  //         this.hasPreviousPage = data.hasPreviousPage;
  //         this.hasNextPage = data.hasNextPage;
          
  //         this.isLoading = false;
  //         this.toastr.success('Associates loaded successfully', 'Success');
  //       },
  //       error: (error) => {
  //         console.error('Error loading associates', error);
  //         this.errorMessage = 'Failed to load associates. Please try again.';
  //         this.toastr.error('Failed to load associates', 'Error');
  //         this.isLoading = false;
  //       }
  //     });
  // }

  // Add pagination navigation methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadAssociates(page, this.pageSize);
    }
  }

  previousPage() {
    if (this.hasPreviousPage) {
      this.loadAssociates(this.pageNumber - 1, this.pageSize);
    }
  }

  nextPage() {
    if (this.hasNextPage) {
      this.loadAssociates(this.pageNumber + 1, this.pageSize);
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.loadAssociates(1, size); // Reset to first page when changing page size
  }

  addAssociate() {
    this.showForm = true;
    this.isEditing = false;
    this.associateForm.reset();
    this.selectedFiles = [];
  }

  editAssociate(associate: Associate) {
    this.showForm = true;
    this.isEditing = true;
    this.associateForm.patchValue({
      id: associate.id,
      nameEnglish: associate.nameEnglish,
      nameBengali: associate.nameBengali,
      phone1: associate.primaryNumber,
      phone2: associate.contactNumber || '',
      nidNumber: associate.nid,
      address: associate.address,
      guarantorName: associate.guarantors?.[0]?.name || '',
      guarantorRelation: associate.guarantors?.[0]?.relation || '',
      guarantorAddress: associate.guarantors?.[0]?.address || '',
      guarantorPhone: associate.guarantors?.[0]?.primaryPhone || '',
      guarantorNidNumber: associate.guarantors?.[0]?.nid || ''
    });
    this.selectedFiles = [];
  }

  onSubmit() {
    // Form validation before submission - don't set isLoading until after validation
    const formControls = this.associateForm.controls;
    let hasErrors = false;
    
    // Check which fields are empty and show toastr messages
    if (!formControls['nameEnglish'].value) {
      this.toastr.error('Name in English is required', 'Form Error');
      hasErrors = true;
    }
    
    if (!formControls['phone1'].value) {
      this.toastr.error('Primary phone number is required', 'Form Error');
      hasErrors = true;
    }
    
    if (!formControls['nidNumber'].value) {
      this.toastr.error('NID number is required', 'Form Error');
      hasErrors = true;
    }
    
    if (!formControls['address'].value) {
      this.toastr.error('Address is required', 'Form Error');
      hasErrors = true;
    }
    
    // Check guarantor fields
    if (!formControls['guarantorName'].value) {
      this.toastr.error('Guarantor name is required', 'Form Error');
      hasErrors = true;
    }

    if (!formControls['guarantorRelation'].value) {
      this.toastr.error('Guarantor Relation is required', 'Form Error');
      hasErrors = true;
    }

    if (!formControls['guarantorPhone'].value) {
      this.toastr.error('Guarantor phone is required', 'Form Error');
      hasErrors = true;
    }
    
    // If there are errors, stop form submission
    if (hasErrors) {
      this.toastr.warning('Please fill in all required fields', 'Form Validation');
      return; // Return early without setting isLoading
    }
    
    // Only set isLoading to true if validation passes
    this.isLoading = true;
    
    const formData = this.associateForm.value;
    
    // Map form fields to API format - Fix: remove .value as formData already contains values
    const apiData = {
      Id: formData.id ?? 0,
      nameEnglish: formData.nameEnglish,
      nameBengali: formData.nameBengali,
      PrimaryNumber: formData.phone1,
      ContactNumber: formData.phone2,
      Nid: formData.nidNumber,
      Address: formData.address,
      guarantor: {
        name: formData.guarantorName,
        relation: formData.guarantorRelation,
        address: formData.guarantorAddress,
        Primaryphone: formData.guarantorPhone,
        nidNumber: formData.guarantorNidNumber
      }
    };
    
    if (this.isEditing) {
      const id = formData.id;
      const _url = environment.apiUrl + APIs.Associate.Update + '/' + id;
      

      const formDataObj = new FormData();
      
      // Add basic fields
      formDataObj.append('Id', id);
      formDataObj.append('nameEnglish', this.associateForm.get('nameEnglish')?.value);
      formDataObj.append('nameBengali', this.associateForm.get('nameBengali')?.value);
      formDataObj.append('PrimaryNumber', apiData.PrimaryNumber);
      formDataObj.append('ContactNumber', apiData.ContactNumber || '');
      formDataObj.append('Nid', apiData.Nid);
      formDataObj.append('Address', apiData.Address);
      
      // Add guarantor fields - Fix: Change how we append guarantor data
      formDataObj.append('Guarantor.Name', apiData.guarantor.name);
      formDataObj.append('Guarantor.Relation', apiData.guarantor.relation);
      formDataObj.append('Guarantor.Address', apiData.guarantor.address);
      formDataObj.append('Guarantor.Primaryphone', apiData.guarantor.Primaryphone);
      formDataObj.append('Guarantor.ContactNumber', apiData.guarantor.Primaryphone);
      formDataObj.append('Guarantor.NidNumber', apiData.guarantor.nidNumber);

      this.selectedFiles.forEach(file => {
        formDataObj.append('documents', file, file.name); // 'documents' should match your DTO property name
       
       });

       const token = localStorage.getItem('accessToken');
       const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      this.http.post(_url, formDataObj, { headers })
      .subscribe({


      // this.httpHelper
      //   .httpPost<any>(_url, formDataObj, true, {
      //     headers: this.httpHelper.getDefaultAuthHeaders()
      //   })
      //   .pipe(
        //   catchError((err) => {
        //     console.error('Error updating associate', err);
        //     this.errorMessage = 'Failed to update associate. Please try again.';
        //     this.toastr.error('Failed to update associate', 'Error');
        //     return of(null);
        //   })
        // )
        // .subscribe({
          next: () => {
            this.loadAssociates(); // Refresh the list
            this.showForm = false;
            this.isLoading = false;
            this.toastr.success('Associate updated successfully', 'Success');
          },
          error: (error) => {
            console.error('Error updating associate', error);
            this.errorMessage = 'Failed to update associate. Please try again.';
            this.toastr.error('Failed to update associate', 'Error');
            this.isLoading = false;
          }
        });
    } else {
      // Create new associate
      const _url = environment.apiUrl + APIs.Associate.Create;
      
      // Create FormData object for multipart/form-data request
      const formDataObj = new FormData();
      
      // Add basic fields
      formDataObj.append('nameEnglish', this.associateForm.get('nameEnglish')?.value);
      formDataObj.append('nameBengali', this.associateForm.get('nameBengali')?.value);
      formDataObj.append('PrimaryNumber', apiData.PrimaryNumber);
      formDataObj.append('ContactNumber', apiData.ContactNumber || '');
      formDataObj.append('Nid', apiData.Nid);
      formDataObj.append('Address', apiData.Address);
      
      // Add guarantor fields - Fix: Change how we append guarantor data
      formDataObj.append('Guarantor.Name', apiData.guarantor.name);
      formDataObj.append('Guarantor.Relation', apiData.guarantor.relation);
      formDataObj.append('Guarantor.Address', apiData.guarantor.address);
      formDataObj.append('Guarantor.Primaryphone', apiData.guarantor.Primaryphone);
      formDataObj.append('Guarantor.ContactNumber', apiData.guarantor.Primaryphone);
      formDataObj.append('Guarantor.NidNumber', apiData.guarantor.nidNumber);
      
      // Get token for authorization
      const token = localStorage.getItem('accessToken');
      
      // // Log the FormData for debugging
      // console.log('Sending FormData with these entries:');
      // formDataObj.forEach((value, key) => {
      //   console.log(key, value);
      // });

// Append selected files
this.selectedFiles.forEach(file => {
  formDataObj.append('documents', file, file.name); // 'documents' should match your DTO property name
 
 });
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      })

      this.http.post('https://localhost:7046/api/Associate/Create', formDataObj, { headers })
      .subscribe({
        next: (res) => {
          console.log('Submitted', res);
          this.toastr.success('Associate created successfully', 'Success');
          this.loadAssociates();
          this.showForm = false;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error', err);
          this.toastr.error('Failed to create associate', 'Error');
          this.isLoading = false;
        }
      });


      // this.httpHelper
      //   .httpPost<any>(_url, formDataObj, false, {
      //     headers: this.httpHelper.getDefaultAuthHeaders()
      //   })
      //   .pipe(
      //     catchError((err) => {
      //       console.error('Error creating associate', err);
      //       this.errorMessage = `Failed to create associate: ${err.error?.title || err.message || 'Unknown error'}`;
      //       this.isLoading = false;
      //       return of(null);
      //     })
      //   )
      //   .subscribe({
      //     next: () => {
      //       this.loadAssociates(); // Refresh the list
      //       this.showForm = false;
      //       this.isLoading = false;
      //       this.errorMessage = '';
      //     },
      //     error: (error) => {
      //       console.error('Error creating associate', error);
      //       this.errorMessage = 'Failed to create associate. Please try again.';
      //       this.isLoading = false;
      //     }
      //   });
    }
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...files];
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  cancelForm() {
    this.showForm = false;
    this.isEditing = false;
    this.associateForm.reset();
    this.selectedFiles = [];
    this.errorMessage = '';
  }

  deleteAssociate(id: number) {
    if (confirm('Are you sure you want to delete this associate?')) {
      this.isLoading = true;
      const _url = environment.apiUrl + APIs.Associate.Delete + '/' + id;

      this.httpHelper
        .httpPost<any>(_url, null, false, {
          headers: this.httpHelper.getDefaultAuthHeaders()
        })
        .pipe(
          catchError((err) => {
            console.error('Error deleting associate', err);
            this.errorMessage = 'Failed to delete associate. Please try again.';
            this.toastr.error('Failed to delete associate', 'Error');
            return of(null);
          })
        )
        .subscribe({
          next: () => {
            this.associates = this.associates.filter(a => a.id !== id);
            this.isLoading = false;
            this.errorMessage = '';
            this.toastr.success('Associate deleted successfully', 'Success');
          },
          error: (error) => {
            console.error('Error deleting associate', error);
            this.errorMessage = 'Failed to delete associate. Please try again.';
            this.toastr.error('Failed to delete associate', 'Error');
            this.isLoading = false;
          }
        });
    }
  }

  // Helper method to generate pagination array
  getPaginationArray(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // If we have fewer pages than maxPagesToShow, show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of the middle section
      let startPage = Math.max(2, this.pageNumber - 1);
      let endPage = Math.min(this.totalPages - 1, this.pageNumber + 1);
      
      // Adjust if we're near the beginning
      if (this.pageNumber <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (this.pageNumber >= this.totalPages - 2) {
        startPage = this.totalPages - 3;
      }
      
      // Add ellipsis if needed before middle section
      if (startPage > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle section
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed after middle section
      if (endPage < this.totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Always show last page
      pages.push(this.totalPages);
    }
    
    return pages;
  }
  

// Add properties for mat-table
dataSource = new MatTableDataSource<any>([]);
displayedColumns: string[] = ['serialNumber', 'nameEnglish', 'nameBengali', 'primaryNumber', 'nid', 'address', 'guarantor', 'actions'];

@ViewChild(MatSort) sort!: MatSort;

ngAfterViewInit() {
  if (this.sort) {
    this.dataSource.sort = this.sort;
  }
}

// // Update loadAssociates to set the dataSource
// loadAssociates(pageNumber: number = 1, pageSize: number = 10) {
//   this.isLoading = true;
//   const _url = `${environment.apiUrl}${APIs.Associate.GetAll}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
//   console.log(_url);
//   this.httpHelper
//     .httpGet<any>(_url, {
//       headers: this.httpHelper.getDefaultAuthHeaders()
//     })
//     .pipe(
//       map((res) => res),
//       catchError((err) => {
//         console.error('Error loading associates', err);
//         this.errorMessage = 'Failed to load associates. Please try again.';
//         this.toastr.error('Failed to load associates', 'Error');
//         return of({ items: [], totalItems: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
//       })
//     )
//     .subscribe({
//       next: (data) => {
//         // Update the associates array with the items from the response
//         this.associates = data.items;
        
//         // Update pagination properties
//         this.totalItems = data.totalItems;
//         this.pageNumber = data.pageNumber;
//         this.pageSize = data.pageSize;
//         this.totalPages = data.totalPages;
//         this.hasPreviousPage = data.hasPreviousPage;
//         this.hasNextPage = data.hasNextPage;
        
//         this.isLoading = false;
//         this.toastr.success('Associates loaded successfully', 'Success');
//       },
//       error: (error) => {
//         console.error('Error loading associates', error);
//         this.errorMessage = 'Failed to load associates. Please try again.';
//         this.toastr.error('Failed to load associates', 'Error');
//         this.isLoading = false;
//       }
//     });
// }

// Add search function
// Add a searchTerm property to your component
searchTerm: string = '';

// Update the applyFilter method to use the API with search term
applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  this.searchTerm = filterValue;
  
  // Call loadAssociates with the current page, size, and new search term
  this.loadAssociates(this.pageNumber, this.pageSize, this.searchTerm);
}

// Update loadAssociates to include searchTerm parameter
loadAssociates(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = '') {
  this.isLoading = true;
  const _url = `${environment.apiUrl}${APIs.Associate.GetAll}?pageNumber=${pageNumber}&pageSize=${pageSize}${searchTerm ? `&searchTerm=${searchTerm}` : ''}`;
  console.log(_url);
  
  this.httpHelper
    .httpGet<any>(_url, {
      headers: this.httpHelper.getDefaultAuthHeaders()
    })
    .pipe(
      map((res) => res),
      catchError((err) => {
        console.error('Error loading associates', err);
        this.errorMessage = 'Failed to load associates. Please try again.';
        this.toastr.error('Failed to load associates', 'Error');
        return of({ items: [], totalItems: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
      })
    )
    .subscribe({
      next: (data) => {
        // Update the associates array with the items from the response
        this.associates = data.items;
        this.dataSource.data = this.associates;
        
        // Update pagination properties
        this.totalItems = data.totalItems;
        this.pageNumber = data.pageNumber;
        this.pageSize = data.pageSize;
        this.totalPages = data.totalPages;
        this.hasPreviousPage = data.hasPreviousPage;
        this.hasNextPage = data.hasNextPage;
        
        this.isLoading = false;
        //this.toastr.success('Associates loaded successfully', 'Success');
      },
      error: (error) => {
        console.error('Error loading associates', error);
        this.errorMessage = 'Failed to load associates. Please try again.';
        this.toastr.error('Failed to load associates', 'Error');
        this.isLoading = false;
      }
    });
}
}



