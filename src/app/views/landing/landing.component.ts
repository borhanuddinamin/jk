import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  badge?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  currentSlide = 0;
  totalSlides = 3;
  slideInterval: any;
  autoSlideInterval = 5000; // 5 seconds

  // Featured products data
  featuredProducts: Product[] = [
    {
      id: 1,
      name: 'Smart Rice Cooker Pro',
      category: 'Kitchen Appliances',
      price: 4999,
      oldPrice: 5999,
      image: 'assets/images/product-rice-cooker.jpg',
      rating: 5,
      reviewCount: 124,
      badge: 'Sale'
    },
    {
      id: 2,
      name: '55" 4K Smart TV',
      category: 'Electronics',
      price: 59999,
      oldPrice: 69999,
      image: 'assets/images/product-tv.jpg',
      rating: 4,
      reviewCount: 86,
      badge: '15% Off'
    },
    {
      id: 3,
      name: 'Wooden Dining Table Set',
      category: 'Furniture',
      price: 35999,
      image: 'assets/images/product-dining-table.jpg',
      rating: 5,
      reviewCount: 52
    },
    {
      id: 4,
      name: 'Side-by-Side Refrigerator',
      category: 'Kitchen Appliances',
      price: 89999,
      oldPrice: 99999,
      image: 'assets/images/product-refrigerator.jpg',
      rating: 4,
      reviewCount: 38,
      badge: 'New'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenu() {
    this.isMobileMenuOpen = false;
  }

  // Slider methods
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.resetAutoSlide();
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.resetAutoSlide();
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.resetAutoSlide();
  }

  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoSlideInterval);
  }

  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  resetAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  // Product methods
  navigateToCategory(category: string) {
    this.router.navigate(['/products'], { queryParams: { category: category } });
  }

  addToCart(product: Product) {
    console.log('Added to cart:', product);
    // Implement cart functionality
  }

  addToWishlist(product: Product) {
    console.log('Added to wishlist:', product);
    // Implement wishlist functionality
  }

  quickView(product: Product) {
    console.log('Quick view:', product);
    // Implement quick view functionality
  }

  // Story slider variables and methods
    currentStorySlide = 0;
    storySlideCount = 3;
  
    prevStorySlide() {
      this.currentStorySlide = (this.currentStorySlide - 1 + this.storySlideCount) % this.storySlideCount;
    }
  
    nextStorySlide() {
      this.currentStorySlide = (this.currentStorySlide + 1) % this.storySlideCount;
    }
  
    goToStorySlide(index: number) {
      this.currentStorySlide = index;
    }
}