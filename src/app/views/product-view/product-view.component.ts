import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  nameEnglish: string;
  nameBangla: string;
  category: Category;
  imageUrl: string;
  description: string;
  salePrice: number;
  installmentPrice: number;
  availableQuantity: number;
  productCode: string;
}

interface ProductResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.scss'
})
export class ProductViewComponent implements OnInit {
  products: Product[] = [];
  displayedProducts: Product[] = []; // Products to display (limited initially)
  selectedProduct: Product | null = null;
  quantity: number = 1;
  showProductDetails: boolean = false;
  searchTerm: string = '';
  
  // Category filtering
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  
  // Show more functionality
  showAllProducts: boolean = false;
  productsPerRow = 4; // Assuming 4 products per row based on grid layout
  initialRowsToShow = 2;
  
  // Pagination
  pageNumber: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  hasPreviousPage: boolean = false;
  hasNextPage: boolean = false;
  
  // Cart related properties
  cart: CartItem[] = [];
  showCart: boolean = false;
  
  // Loading state
  isLoading: boolean = false;
  
  constructor(
    private router: Router, 
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('productCart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }
  }

  loadCategories() {
    this.http.get<Category[]>(`${environment.apiUrl}/product/GetCategory`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories', error);
          this.toastr.error('Failed to load categories', 'Error');
        }
      });
  }

  loadProducts(page: number = 1, size: number = 10, searchTerm: string = '', categoryId: number | null = null) {
    this.isLoading = true;
    
    // Build URL with query parameters
    let url = `${environment.apiUrl}/product/GetProductviewAll?pageNumber=${page}&pageSize=${size}`;
    if (searchTerm && searchTerm.trim() !== '') {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }
    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }
    
    const headers = this.getAuthHeaders();
    
    this.http.get<ProductResponse>(url, { headers })
      .subscribe({
        next: (response) => {
          this.products = response.items;
          this.updateDisplayedProducts();
          this.totalItems = response.totalItems;
          this.pageNumber = response.pageNumber;
          this.pageSize = response.pageSize;
          this.totalPages = response.totalPages;
          this.hasPreviousPage = response.hasPreviousPage;
          this.hasNextPage = response.hasNextPage;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading products', error);
          this.toastr.error('Failed to load products', 'Error');
          this.isLoading = false;
        }
      });
  }

  updateDisplayedProducts() {
    if (this.showAllProducts) {
      this.displayedProducts = [...this.products];
    } else {
      // Show only first two rows
      const productsToShow = this.initialRowsToShow * this.productsPerRow;
      this.displayedProducts = this.products.slice(0, productsToShow);
    }
  }

  toggleShowMore() {
    this.showAllProducts = !this.showAllProducts;
    this.updateDisplayedProducts();
  }

  onCategoryChange() {
    this.pageNumber = 1; // Reset to first page when changing category
    this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm, this.selectedCategoryId);
  }

  searchProducts(): void {
    if (this.searchTerm.trim() === '' && !this.selectedCategoryId) {
      this.loadProducts();
      return;
    }
    
    this.loadProducts(1, this.pageSize, this.searchTerm, this.selectedCategoryId);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  viewProductDetails(product: Product): void {
    this.selectedProduct = product;
    this.quantity = 1;
    this.showProductDetails = true;
    // Scroll to top when product details are shown
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeProductDetails(): void {
    this.showProductDetails = false;
    this.selectedProduct = null;
  }

  getRelatedProducts(): Product[] {
    if (!this.selectedProduct) return [];
    
    // Return products in the same category, excluding the selected product
    return this.products.filter(p => 
      p.category.id === this.selectedProduct?.category.id && 
      p.id !== this.selectedProduct?.id
    ).slice(0, 4); // Limit to 4 related products
  }

  // Update pagination methods to include category filtering
  previousPage() {
    if (this.hasPreviousPage) {
      this.pageNumber--;
      this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm, this.selectedCategoryId);
    }
  }
  
  nextPage() {
    if (this.hasNextPage) {
      this.pageNumber++;
      this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm, this.selectedCategoryId);
    }
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageNumber = page;
      this.loadProducts(this.pageNumber, this.pageSize, this.searchTerm, this.selectedCategoryId);
    }
  }
  
  getPaginationArray(): number[] {
    const paginationArray: number[] = [];
    
    if (!this.totalItems || this.totalItems === 0) {
      return paginationArray;
    }
    
    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) {
        paginationArray.push(i);
      }
    } else {
      paginationArray.push(1);
      
      if (this.pageNumber > 3) {
        paginationArray.push(-1); // -1 represents ellipsis
      }
      
      const startPage = Math.max(2, this.pageNumber - 1);
      const endPage = Math.min(this.totalPages - 1, this.pageNumber + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        paginationArray.push(i);
      }
      
      if (this.pageNumber < this.totalPages - 2) {
        paginationArray.push(-1);
      }
      
      if (this.totalPages > 1) {
        paginationArray.push(this.totalPages);
      }
    }
    
    return paginationArray;
  }

  // Cart methods
  addToCart(): void {
    if (!this.selectedProduct) return;
    
    // Check if product is already in cart
    const existingItemIndex = this.cart.findIndex(item => item.product.id === this.selectedProduct?.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists in cart
      this.cart[existingItemIndex].quantity += this.quantity;
    } else {
      // Add new item to cart
      this.cart.push({
        product: this.selectedProduct,
        quantity: this.quantity
      });
    }
    
    // Save cart to localStorage
    localStorage.setItem('productCart', JSON.stringify(this.cart));
    
    // Show confirmation
    this.toastr.success('Product added to cart!', 'Success');
  }
  
  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    localStorage.setItem('productCart', JSON.stringify(this.cart));
  }
  
  updateCartItemQuantity(index: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(index);
      return;
    }
    
    if (newQuantity > this.cart[index].product.availableQuantity) {
      newQuantity = this.cart[index].product.availableQuantity;
    }
    
    this.cart[index].quantity = newQuantity;
    localStorage.setItem('productCart', JSON.stringify(this.cart));
  }
  
  clearCart(): void {
    this.cart = [];
    localStorage.removeItem('productCart');
  }
  
  getCartTotal(): number {
    return this.cart.reduce((total, item) => total + (item.product.salePrice * item.quantity), 0);
  }
  
  getCartItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }
  
  toggleCart(): void {
    this.showCart = !this.showCart;
  }
  
  proceedToOrder(): void {
    // Navigate to order page
    this.router.navigate(['/order']);
  }
  
  // Helper methods
  getStockStatus(product: Product): string {
    return product.availableQuantity > 0 ? 'In Stock' : 'Out of Stock';
  }
  
  getStockStatusClass(product: Product): string {
    return product.availableQuantity > 0 ? 'in-stock' : 'out-of-stock';
  }
  
  incrementQuantity(): void {
    if (this.selectedProduct && this.quantity < this.selectedProduct.availableQuantity) {
      this.quantity++;
    }
  }
  
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  
  getImageUrl(product: Product): string {
    if (!product.imageUrl) return 'assets/images/placeholder.jpg';
    
    // Check if the imageUrl is a relative path
    if (product.imageUrl.startsWith('Images/') || product.imageUrl.startsWith('Images\\')) {
      return `${environment.apiUrl}/${product.imageUrl.replace(/\\/g, '/')}`;
    }
    
    return product.imageUrl;
  }
}
