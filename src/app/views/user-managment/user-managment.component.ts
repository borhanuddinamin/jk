import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
  role: string[];
  department: string;
  joinDate: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  primaryPhoneNumber?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-managment.component.html',
  styleUrls: ['./user-managment.component.scss']
})
export class UserManagmentComponent implements OnInit {
  users: User[] = [];
  userForm: FormGroup;
  isEditing = false;
  showForm = false;
  showRoleModal = false;
  selectedUser: User | null = null;
  searchQuery = new Subject<string>();
  filteredUsers: User[] = [];
  password = '';

  roles = [
    'Admin',
    'Manager',
    'Supervisor',
    'Accountant',
    'Sales',
    'Inventory Manager',
    'Customer Service'
  ];

  departments = [
    'Administration',
    'Sales',
    'Accounts',
    'Inventory',
    'Customer Support',
    'IT'
  ];

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required]],
      role: [[], [Validators.required, Validators.minLength(1)]],
      status: ['active'],
      lastLogin: [''],
      primaryPhoneNumber: ['']
    });
  }

  ngOnInit() {
    // Mock data
    this.users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: ['Admin', 'Manager'],
        department: 'Administration',
        joinDate: '2024-01-01',
        status: 'active',
        lastLogin: '2024-03-15 10:30 AM',
        primaryPhoneNumber: '123-456-7890'
      }
    ];

    this.searchQuery.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) || 
        user.email.toLowerCase().includes(query.toLowerCase())
      );
    });
  }

  addUser() {
    this.showForm = true;
    this.isEditing = false;
    this.userForm.reset({ status: 'active', role: [] });
  }

  editUser(user: User) {
    this.showForm = true;
    this.isEditing = true;
    this.userForm.patchValue(user);
  }

  manageRoles(user: User) {
    this.selectedUser = user;
    this.showRoleModal = true;
  }

  toggleRole(role: string) {
    if (!this.selectedUser) return;
    
    const currentRoles = [...this.selectedUser.role];
    const index = currentRoles.indexOf(role);
    
    if (index === -1) {
      currentRoles.push(role);
    } else {
      currentRoles.splice(index, 1);
    }
    
    this.selectedUser.role = currentRoles;
  }

  saveRoles() {
    if (!this.selectedUser) return;
    
    const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
    if (index !== -1) {
      this.users[index] = { ...this.selectedUser };
    }
    
    this.closeRoleModal();
  }

  closeRoleModal() {
    this.showRoleModal = false;
    this.selectedUser = null;
  }

  toggleStatus(user: User) {
    user.status = user.status === 'active' ? 'inactive' : 'active';
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(user => user.id !== id);
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      if (this.isEditing) {
        const index = this.users.findIndex(user => user.id === this.userForm.value.id);
        this.users[index] = this.userForm.value;
      } else {
        const newId = Math.max(...this.users.map(user => user.id), 0) + 1;
        this.users.push({ ...this.userForm.value, id: newId });
      }
      this.showForm = false;
      this.userForm.reset();
    }
  }

  cancelForm() {
    this.showForm = false;
    this.userForm.reset();
  }

  hasRole(user: User, role: string): boolean {
    return user.role.includes(role);
  }

  onSearch(query: string) {
    this.searchQuery.next(query);
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.userForm.patchValue(user);
    this.filteredUsers = [];
  }

  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    this.password = Array.from({ length: 12 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  savePassword() {
    if (this.selectedUser) {
      // Here you would typically make an API call to save the password
      console.log(`Password saved for user ${this.selectedUser.name}: ${this.password}`);
      this.password = '';
    }
  }
}
