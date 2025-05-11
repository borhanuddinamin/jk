import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ViewChild } from '@angular/core';

interface AccountNode {
  accountCode: string;
  accountName: string;
  level: number;
  accountType: string;
}

interface AccountSearchResponse {
  totalCount: number;
  data: AccountNode[];
}

// Add these imports to the existing imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';

// Update the imports array in the @Component decorator
@Component({
  selector: 'app-voucher-entry',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    RouterModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule
  ],
  templateUrl: './voucher-entry.component.html',
  styleUrl: './voucher-entry.component.scss'
})
export class VoucherEntryComponent implements OnInit {
  voucherForm: FormGroup;
  expenseAccounts: AccountNode[] = [];
  cashBankAccounts: AccountNode[] = [];
  selectedFile: File | null = null;
  isLoading = false;
  isSearchingAccount = false;
  isLoadingVoucherNumber = false;
  
  // Added properties
  showDebitDropdown = false;
  showCreditDropdown = false;
  filteredDebitAccounts: AccountNode[] = [];
  filteredCreditAccounts: AccountNode[] = [];
  accountsByType: { [key: string]: AccountNode[] } = {};
  
  accountTypes = [
    { id: 1, name: 'Asset' },
    { id: 2, name: 'Liability' },
    { id: 3, name: 'Equity' },
    { id: 4, name: 'Revenue' },
    { id: 5, name: 'Expense' }
  ];

  debitAccountControl = new FormControl();
  
  // Math utility for template usage
  Math = Math;
  
  // Data table properties
  displayedColumns: string[] = ['sl', 'voucherNumber', 'voucherType', 'voucherDate', 'accountName', 'debitAmount', 'creditAmount', 'narration', 'actions'];
  dataSource: any[] = [];
  
  // Pagination properties
  pageSize = 10;
  pageNumber = 1;
  totalItems = 0;
  hasPreviousPage = false;
  hasNextPage = false;
  searchTerm = '';
  showForm = true;
  isEditing = false;
  currentVoucherId: number | null = null;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Form initialization
    this.voucherForm = this.fb.group({
      voucherType: ['Payment', Validators.required],
      voucherNumber: [{ value: 'Auto-generated', disabled: true }],
      voucherDate: [new Date().toISOString().split('T')[0], Validators.required],
      headType: ['', Validators.required],
      debitAccount: ['', Validators.required],
      creditamount: [''],
      debitAmount: [''],
      narration: ['']
    });
  }

  ngOnInit(): void {
    this.loadVouchers();
    
    // Setup autocomplete for account search
    this.debitAccountControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.isSearchingAccount = true;
      }),
      switchMap(value => {
        if (typeof value === 'string' && value.trim()) {
          return this.searchAccounts(value).pipe(
            catchError(() => {
              this.toastr.error('Failed to search accounts', 'Error');
              return of([]);
            })
          );
        } else {
          return of([]);
        }
      })
    ).subscribe(accounts => {
      this.filteredDebitAccounts = accounts;
      this.isSearchingAccount = false;
    });
  }
  
  onVoucherTypeChange(event: Event): void {
    // Get the selected voucher type
    const voucherType = (event.target as HTMLSelectElement).value;
    
    // Generate voucher number based on type
    this.generateVoucherNumber(voucherType);
  }
  
  generateVoucherNumber(voucherType: string): void {
    this.isLoadingVoucherNumber = true;
    
    this.http.get<any>(`${environment.apiUrl}/Voucher/GenerateVoucherNumber?voucherType=${voucherType}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        this.voucherForm.get('voucherNumber')?.setValue(response.voucherNumber);
        this.isLoadingVoucherNumber = false;
      },
      error: (error) => {
        console.error('Error generating voucher number', error);
        this.toastr.error('Failed to generate voucher number', 'Error');
        this.isLoadingVoucherNumber = false;
      }
    });
  }
  
  onSearchInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (typeof value === 'string') {
      // The valueChanges observable will handle the search
    }
  }
  
  // Methods for account search
  searchAccounts(searchTerm: string): Observable<AccountNode[]> {
    const typeId = parseInt(this.voucherForm.get('headType')?.value);
    
    if (!typeId) {
      return of([]);
    }
    
    // First try to search by account code
    if (/^\d+$/.test(searchTerm)) {
      return this.http.get<any>(`${environment.apiUrl}/ChartedOfAccount/GetChofAccounts?search=${searchTerm}&headType=${typeId}`, {
        headers: this.getAuthHeaders()
      }).pipe(
        switchMap(account => {
          if (account) {
            // Create an AccountNode from the API response
            const accountNode: AccountNode = {
              accountCode: account.accountCode,
              accountName: account.accountName,
              level: account.level,
              accountType: account.accountType.name
            };
            return of([accountNode]);
          } else {
            // If not found by exact code, fall back to filtering existing accounts
            return of(this.filterAccountsBySearchTerm(searchTerm, typeId.toString()));
          }
        }),
        catchError(() => {
          // If API call fails, fall back to filtering existing accounts
          return of(this.filterAccountsBySearchTerm(searchTerm, typeId.toString()));
        })
      );
    } else {
      // For non-numeric search terms, filter existing accounts
      return of(this.filterAccountsBySearchTerm(searchTerm, typeId.toString()));
    }
  }
  
  filterAccountsBySearchTerm(searchTerm: string, typeId: string): AccountNode[] {
    searchTerm = searchTerm.toLowerCase();
    return this.accountsByType[typeId]?.filter(account => 
      account.accountCode.toLowerCase().includes(searchTerm) || 
      account.accountName.toLowerCase().includes(searchTerm)
    ) || [];
  }
  
  onAccountSearchFocus(): void {
    const typeId = this.voucherForm.get('headType')?.value;
    if (typeId && this.accountsByType[typeId]) {
      // Show more items initially when focused
      this.filteredDebitAccounts = this.accountsByType[typeId].slice(0, 20);
      
      // If there's already a search term, filter by it
      const searchTerm = this.debitAccountControl.value;
      if (typeof searchTerm === 'string' && searchTerm.trim()) {
        this.filterAccountsBySearchTerm(searchTerm, typeId);
      }
    } else {
      // If no head type is selected, show a message to select head type first
      this.filteredDebitAccounts = [];
      this.toastr.info('Please select a Head Type first', 'Info');
    }
  }
  
  displayAccountFn(account: AccountNode): string {
    return account ? `${account.accountCode} - ${account.accountName}` : '';
  }
  
  // Update the existing method to work with the new autocomplete
  onheadTypeChange(event: Event): void {
    const typeId = (event.target as HTMLSelectElement).value;
    if (typeId && this.accountsByType[typeId]) {
      this.filteredDebitAccounts = this.accountsByType[typeId].slice(0, 10);
      this.voucherForm.get('debitAccount')?.setValue('');
      this.debitAccountControl.setValue('');
    } else {
      this.filteredDebitAccounts = [];
    }
  }
  
  // Update to handle selection from autocomplete
  selectDebitAccount(account: AccountNode): void {
    this.voucherForm.get('debitAccount')?.setValue(account.accountCode);
    this.debitAccountControl.setValue(account);
  }
  
  onCreditHeadTypeChange(event: Event): void {
    const typeId = (event.target as HTMLSelectElement).value;
    this.filteredCreditAccounts = this.accountsByType[typeId] || [];
    this.voucherForm.get('creditAccount')?.setValue('');
    this.voucherForm.get('creditAccountSearch')?.setValue('');
  }
  
  filterDebitAccounts(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    const typeId = this.voucherForm.get('headType')?.value;
    
    if (!typeId) return;
    
    this.filteredDebitAccounts = this.accountsByType[typeId].filter(account => 
      account.accountCode.toLowerCase().includes(searchTerm) || 
      account.accountName.toLowerCase().includes(searchTerm)
    );
  }
  
  filterCreditAccounts(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    const typeId = this.voucherForm.get('creditHeadType')?.value;
    
    if (!typeId) return;
    
    this.filteredCreditAccounts = this.accountsByType[typeId].filter(account => 
      account.accountCode.toLowerCase().includes(searchTerm) || 
      account.accountName.toLowerCase().includes(searchTerm)
    );
  }
  
  onAccountSelected(event: any): void {
    const selectedAccount = event.option.value;
    if (selectedAccount) {
      // Update both the form control and the form group
      this.debitAccountControl.setValue(selectedAccount, { emitEvent: false });
      this.voucherForm.get('debitAccount')?.setValue(selectedAccount.accountCode);
    }
  }
  
  selectCreditAccount(account: AccountNode): void {
    this.voucherForm.get('creditAccount')?.setValue(account.accountCode);
    this.voucherForm.get('creditAccountSearch')?.setValue(account.accountCode + ' - ' + account.accountName);
    this.showCreditDropdown = false;
  }
  
  getAccountName(accountCode: string): string {
    // Find account name from all account types
    for (const typeId in this.accountsByType) {
      const account = this.accountsByType[typeId].find(a => a.accountCode === accountCode);
      if (account) {
        return account.accountCode + ' - ' + account.accountName;
      }
    }
    return accountCode;
  }
  
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    if (!(event.target as HTMLElement).closest('.search-select')) {
      this.showDebitDropdown = false;
      this.showCreditDropdown = false;
    }
  }
  
  getCoATypeIdFromName(typeName: string): number {
    const type = this.accountTypes.find(t => t.name === typeName);
    return type ? type.id : 1;
  }

  filterAccountsByType(accounts: AccountNode[], typeId: string): AccountNode[] {
    return accounts.filter(account => 
      account.accountType === typeId && account.level >= 4
    );
  }

  filterCashBankAccounts(accounts: AccountNode[]): AccountNode[] {
    return accounts.filter(account => 
      (account.accountName.includes('Cash') || 
       account.accountName.includes('Bank')) && 
      account.level >= 4
    );
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  resetForm(): void {
    this.voucherForm.reset({
      voucherType: 'Payment',
      voucherNumber: 'Auto-generated',
      voucherDate: new Date().toISOString().split('T')[0]
    });
    this.selectedFile = null;
  }

  // Add methods for data table
  // Add this method to handle Material Paginator events
  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageIndex + 1;
    this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
  }
  
  // Update the loadVouchers method to work with MatTableDataSource
  loadVouchers(page: number = 1, pageSize: number = 10, searchTerm: string = ''): void {
    this.isLoading = true;
    
    this.http.get<any>(`${environment.apiUrl}/Voucher/GetAll?pageNumber=${page}&pageSize=${pageSize}&searchTerm=${searchTerm}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalItems = response.totalCount;
        this.pageNumber = page;
        this.pageSize = pageSize;
        this.hasNextPage = page * pageSize < response.totalCount;
        this.hasPreviousPage = page > 1;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vouchers', error);
        this.toastr.error('Failed to load vouchers', 'Error');
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    this.pageNumber = 1;
    this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.pageNumber++;
      this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
    }
  }

  goToPage(page: number): void {
    this.pageNumber = page;
    this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.pageNumber = 1;
    this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
  }

  getPaginationArray(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (this.pageNumber <= 3) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }
    
    if (this.pageNumber >= totalPages - 2) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, -1, this.pageNumber - 1, this.pageNumber, this.pageNumber + 1, -1, totalPages];
  }

  addVoucher(): void {
    this.isEditing = false;
    this.currentVoucherId = null;
    this.resetForm();
    this.showForm = true;
  }

  editVoucher(voucher: any): void {
    this.isEditing = true;
    this.currentVoucherId = voucher.id;
    this.showForm = true;
    
    // Populate form with voucher data
    this.voucherForm.patchValue({
      voucherType: voucher.voucherType,
      voucherNumber: voucher.voucherNumber,
      voucherDate: voucher.voucherDate,
      narration: voucher.narration,
      debitAccount: voucher.accountCode,
      debitAmount: voucher.debitAmount,
      creditamount: voucher.creditAmount
    });
    
    // Set the debit account control value
    const accountNode: AccountNode = {
      accountCode: voucher.accountCode,
      accountName: voucher.accountName,
      level: 4, // Default level
      accountType: '' // Will be populated when needed
    };
    this.debitAccountControl.setValue(accountNode);
  }

  deleteVoucher(id: number): void {
    if (confirm('Are you sure you want to delete this voucher?')) {
      this.http.delete(`${environment.apiUrl}/Voucher/Delete/${id}`, {
        headers: this.getAuthHeaders()
      }).subscribe({
        next: () => {
          this.toastr.success('Voucher deleted successfully', 'Success');
          this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm);
        },
        error: (error) => {
          console.error('Error deleting voucher', error);
          this.toastr.error('Failed to delete voucher', 'Error');
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  // Update saveVoucher method to close form after save
  saveVoucher(): void {
    if (this.voucherForm.invalid) {
      Object.keys(this.voucherForm.controls).forEach(key => {
        const control = this.voucherForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = new FormData();
    
    // Add basic voucher properties
    formData.append('VoucherType', this.voucherForm.get('voucherType')?.value);
    formData.append('VoucherDate', this.voucherForm.get('voucherDate')?.value);
    formData.append('Narration', this.voucherForm.get('narration')?.value || '');
    formData.append('AccountCode', this.voucherForm.get('debitAccount')?.value || '');
    formData.append('CreditAmount', this.voucherForm.get('creditamount')?.value || '');
    formData.append('DebitAmount', this.voucherForm.get('debitAmount')?.value || '');
    formData.append('VoucherNumber', this.voucherForm.get('voucherNumber')?.value || '');

    // Create voucher details as a JSON string and append it
    const voucherDetail = {
      AccountCode: this.voucherForm.get('debitAccount')?.value,
      DebitAmount: this.voucherForm.get('debitAmount')?.value || 0,
      CreditAmount: this.voucherForm.get('creditamount')?.value || 0
    };
    
    // Append as array index notation for proper binding
    formData.append('VoucherDetails[0].AccountCode', voucherDetail.AccountCode);
    formData.append('VoucherDetails[0].DebitAmount', voucherDetail.DebitAmount.toString());
    formData.append('VoucherDetails[0].CreditAmount', voucherDetail.CreditAmount.toString());

    if (this.selectedFile) {
      formData.append('documents', this.selectedFile, this.selectedFile.name);
    }
    
    // If editing, add the ID
    if (this.isEditing && this.currentVoucherId) {
      formData.append('Id', this.currentVoucherId.toString());
    }
    
    this.isLoading = true;
    
    // Create custom headers for FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    });
    
    const url = this.isEditing 
      ? `${environment.apiUrl}/Voucher/Update` 
      : `${environment.apiUrl}/Voucher/Create`;
    
    this.http.post(url, formData, {
        headers: headers
      })
      .subscribe({
        next: (response) => {
          this.toastr.success(
            this.isEditing ? 'Voucher updated successfully' : 'Voucher created successfully', 
            'Success'
          );
          this.isLoading = false;
          this.showForm = false; // Close the form
          this.loadVouchers(this.pageNumber, this.pageSize, this.searchTerm); // Reload the data
        },
        error: (error) => {
          console.error('Error saving voucher', error);
          this.toastr.error('Failed to save voucher', 'Error');
          this.isLoading = false;
        }
      });
  }
}