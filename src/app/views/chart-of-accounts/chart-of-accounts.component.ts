import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

// Update the AccountNode interface to match the actual API response
interface AccountNode {
  accountCode: string;
  accountName: string;
  level: number;
  accountType?: string; // Make this optional since it's not in the API response
  children?: AccountNode[]; // Make this optional since it's not in the API response
  isExpanded?: boolean;
  parentAccountCode?: string;
}

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './chart-of-accounts.component.html',
  styleUrl: './chart-of-accounts.component.scss'
})
export class ChartOfAccountsComponent implements OnInit {
  accounts: AccountNode[] = [];
  isLoading = false;
  selectedAccount: AccountNode | null = null;
  showForm = false;
  formMode: 'create' | 'update' = 'create';
  searchTerm: string = '';
  
  // Form fields
  newAccount = {
    accountCode: '',
    accountName: '',
    parentAccountCode: '',
    level: 1,
    isRoot: false
  };
  
  accountTypes = [
    { id: 1, name: 'Asset' },
    { id: 2, name: 'Liability' },
    { id: 3, name: 'Equity' },
    { id: 4, name: 'Revenue' },
    { id: 5, name: 'Expense' }
  ];

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    let params = new HttpParams();
    
    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }
    
    this.http.get<any>(`${environment.apiUrl}/ChartedOfAccount/GetChofAccountsList`, { 
      headers: this.getAuthHeaders(),
      params: params
    })
    .subscribe({
      next: (response) => {
        // Transform the flat list into a hierarchical structure
        if (response && Array.isArray(response.data)) {
          this.accounts = this.buildAccountTree(response.data);
        } else {
          this.accounts = this.buildAccountTree(response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading accounts', error);
        this.toastr.error('Failed to load chart of accounts', 'Error');
        this.isLoading = false;
      }
    });
  }

  // Add this method to transform flat data into a tree structure
  buildAccountTree(accounts: any[]): AccountNode[] {
    // First, initialize all nodes with empty children arrays
    const accountsMap: { [key: string]: AccountNode } = {};
    
    accounts.forEach(account => {
      accountsMap[account.accountCode] = {
        ...account,
        children: [],
        isExpanded: false,
        // If accountType is missing, derive it from the account code
        accountType: account.accountType || this.deriveAccountTypeFromCode(account.accountCode)
      };
    });
    
    // Create the tree structure
    const rootAccounts: AccountNode[] = [];
    
    accounts.forEach(account => {
      const node = accountsMap[account.accountCode];
      
      // If it's a root account (level 1) or has no parent, add to root array
      if (account.level === 1 || !account.parentAccountCode || account.parentAccountCode === '0') {
        rootAccounts.push(node);
      } else {
        // Otherwise, add as a child to its parent
        const parent = accountsMap[account.parentAccountCode];
        if (parent) {
          parent.children?.push(node);
        } else {
          // If parent not found, add to root
          rootAccounts.push(node);
        }
      }
    });
    
    return rootAccounts;
  }

  // Helper method to derive account type from account code
  deriveAccountTypeFromCode(code: string): string {
    const firstDigit = code.charAt(0);
    switch (firstDigit) {
      case '1': return 'Asset';
      case '2': return 'Liability';
      case '3': return 'Equity';
      case '4': return 'Revenue';
      case '5': return 'Expense';
      default: return 'Unknown';
    }
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    

  }

  toggleNode(node: AccountNode): void {
    node.isExpanded = !node.isExpanded;
  }

  selectAccount(account: AccountNode): void {
    this.selectedAccount = account;
    this.showForm = false;
  }

  // Add this method to generate account codes based on parent account and hierarchy
  // Replace the client-side code generation with API call
  generateAccountCode(parentCode: string, level: number): Promise<string> {
    // Call the API to generate the account code
    let params = new HttpParams();
    if (parentCode) {
      params = params.set('parentCode', parentCode);
    }
    
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${environment.apiUrl}/ChartedOfAccount/GenerateAccountCode`, {
        headers: this.getAuthHeaders(),
        params: params
      })
      .subscribe({
        next: (response) => {
          resolve(response.accountCode);
        },
        error: (error) => {
          console.error('Error generating account code', error);
          reject('');
        }
      });
    });
  }
  
  // Update showCreateForm to use the API for code generation
  async showCreateForm(parentAccount: AccountNode | null = null): Promise<void> {
    this.formMode = 'create';
    this.showForm = true;
    this.newAccount = {
      accountCode: '',
      accountName: '',
      parentAccountCode: parentAccount ? parentAccount.accountCode : '',
      level: parentAccount ? parentAccount.level + 1 : 1,
      // coATypeId: parentAccount ? this.getCoATypeIdFromName(parentAccount.accountType) : 1,
      isRoot: parentAccount ? false : true
    };
    
    try {
      // Generate a preview of the account code using the API
      this.newAccount.accountCode = await this.generateAccountCode(
        this.newAccount.parentAccountCode,
        this.newAccount.level
      );
    } catch (error) {
      console.error('Failed to generate account code', error);
      this.toastr.error('Failed to generate account code', 'Error');
    }
  }

  findAccountByCode(code: string): AccountNode | null {
    // Helper function to find an account by its code
    const findInNodes = (nodes: AccountNode[]): AccountNode | null => {
      for (const node of nodes) {
        if (node.accountCode === code) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInNodes(this.accounts);
  }


  getCoATypeIdFromName(typeName: string): number {
    const type = this.accountTypes.find(t => t.name === typeName);
    return type ? type.id : 1;
  }

  getCoATypeNameFromId(typeId: number): string {
    const type = this.accountTypes.find(t => t.id === typeId);
    return type ? type.name : 'Asset';
  }

  showUpdateForm(): void {
    if (!this.selectedAccount) return;
    
    this.formMode = 'update';
    this.showForm = true;
    this.newAccount = {
      accountCode: this.selectedAccount.accountCode,
      accountName: this.selectedAccount.accountName,
      parentAccountCode: this.selectedAccount.parentAccountCode || '',
      level: this.selectedAccount.level,
      // coATypeId: this.getCoATypeIdFromName(this.selectedAccount.accountType),
      isRoot: this.selectedAccount.level === 1
    };
  }

  cancelForm(): void {
    this.showForm = false;
  }

  createAccount(): void {
   
    this.http.post(`${environment.apiUrl}/ChartedOfAccount/CreateChartOfAccount`, this.newAccount, { 
      headers: this.getAuthHeaders() 
    })
    .subscribe({
      next: () => {
        this.toastr.success('Account created successfully', 'Success');
        this.loadAccounts();
        this.showForm = false;
      },
      error: (error) => {
        console.error('Error creating account', error);
        this.toastr.error('Failed to create account', 'Error');
      }
    });
  }

  // Add this method to your component class
  findAccountNameByCode(code: string): string {
    const account = this.findAccountByCode(code);
    return account ? account.accountName : code;
  }
  
  // Add this method to get the appropriate icon for each node type
  getNodeIcon(node: AccountNode): string {
    if (!node.accountType) return 'fa-folder';
    
    switch (node.accountType.toLowerCase()) {
      case 'asset':
        return 'fa-building';
      case 'liability':
        return 'fa-hand-holding-usd';
      case 'equity':
        return 'fa-balance-scale';
      case 'revenue':
        return 'fa-chart-line';
      case 'expense':
        return 'fa-shopping-cart';
      default:
        return 'fa-folder';
    }
  }
  
  // Add this method to handle form submission
  submitForm(): void {
    if (this.formMode === 'create') {
      this.createAccount();
    } else {
      this.updateAccount();
    }
  }
  
  // Add this method to update an account
  updateAccount(): void {
    // Implement update logic here
    this.http.put(`${environment.apiUrl}/ChartedOfAccount/UpdateChartOfAccount`, this.newAccount, { 
      headers: this.getAuthHeaders() 
    })
    .subscribe({
      next: () => {
        this.toastr.success('Account updated successfully', 'Success');
        this.loadAccounts();
        this.showForm = false;
      },
      error: (error) => {
        console.error('Error updating account', error);
        this.toastr.error('Failed to update account', 'Error');
      }
    });
  }
  
  // Add this method to delete an account
  deleteAccount(): void {
    if (!this.selectedAccount) return;
    
    if (confirm(`Are you sure you want to delete account "${this.selectedAccount.accountName}"?`)) {
      this.http.delete(`${environment.apiUrl}/ChartedOfAccount/DeleteChartOfAccount/${this.selectedAccount.accountCode}`, { 
        headers: this.getAuthHeaders() 
      })
      .subscribe({
        next: () => {
          this.toastr.success('Account deleted successfully', 'Success');
          this.selectedAccount = null;
          this.loadAccounts();
        },
        error: (error) => {
          console.error('Error deleting account', error);
          this.toastr.error('Failed to delete account', 'Error');
        }
      });
    }
  }
  
  // Add this method to search accounts
  searchAccounts(): void {
    this.loadAccounts();
  }

  // Recursive function to render tree nodes in the template
  getNodeIndentation(level: number): string {
    return `${level * 20}px`;
  }

  // getNodeIcon(node: AccountNode): string {
  //   if (!node.children || node.children.length === 0) {
  //     return 'fa-file-alt';
  //   }
  //   return node.isExpanded ? 'fa-folder-open' : 'fa-folder';
  // }
  
  // Add this method to your component class
  // Update the getAccountTypeName method to handle missing accountType
  getAccountTypeName(accountType: any): string {
    if (!accountType) {
      return 'Unknown';
    }
    
    if (typeof accountType === 'object' && accountType !== null) {
      // If accountType is an object, try to extract the name property
      return accountType.name || accountType.typeName || JSON.stringify(accountType);
    }
    // If it's already a string, return it directly
    return accountType;
  }
}