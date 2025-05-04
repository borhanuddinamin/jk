import { DOCUMENT, CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, Renderer2, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import {
  AvatarComponent,
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormCheckLabelDirective,
  GutterDirective,
  ProgressBarDirective,
  ProgressComponent,
  ProgressBarComponent,
  RowComponent,
  TableDirective,
  TextColorDirective,
  FormControlDirective,
  BadgeComponent,
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ModalBodyComponent,
  ModalFooterComponent,
  ButtonCloseDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { DashboardChartsData, IChartProps } from './dashboard-charts-data';

interface IUser {
  name: string;
  state: string;
  registered: string;
  country: string;
  usage: number;
  period: string;
  payment: string;
  activity: string;
  avatar: string;
  status: string;
  color: string;
}

interface IProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  supplier: string;
  status: string;
}

interface IInstallmentPerson {
  id: string;
  name: string;
  product: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  nextDueDate: string;
  status: 'Regular' | 'Substandard' | 'Doubtful' | 'Bad';
  isDefaulter: boolean;
  paidInstallments: number;
  totalInstallments: number;
  dueInstallments: number;
  lastPaymentDate: string;
  daysSinceLastPayment: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    CardBodyComponent,
    CardFooterComponent,
    CardHeaderComponent,
    ColComponent,
    RowComponent,
    ChartjsComponent,
    IconDirective,
    WidgetsBrandComponent,
    WidgetsDropdownComponent,
    ButtonDirective,
    ButtonGroupComponent,
    FormCheckLabelDirective,
    GutterDirective,
    ProgressComponent,
    ProgressBarComponent,
    TableDirective,
    AvatarComponent,
    TextColorDirective,
    FormControlDirective,
    ReactiveFormsModule,
    FormsModule,
    BadgeComponent,
    DecimalPipe,
    DatePipe,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonCloseDirective
  ]
})
export class DashboardComponent implements OnInit {
  #chartsData = inject(DashboardChartsData);
  #document = inject(DOCUMENT);
  #renderer = inject(Renderer2);
  #destroyRef = inject(DestroyRef);
  
  // Add installment overview properties
  public currentMonthPaidInstallments: number = 28;
  public currentMonthDueInstallments: number = 14;
  public installmentCompletionRate: number = 66.7; // percentage
  public totalInstallmentAmount: number = 245000;
  public paidInstallmentAmount: number = 168000;
  public dueInstallmentAmount: number = 77000;
  
  // Existing properties
  public totalMonthlySales: number = 745000;
  public totalYearlySales: number = 8450000;
  public netProfit: number = 325000;
  public totalCommission: number = 95000;
  public totalCustomers: number = 248;
  public totalMonthlyInstallments: number = 42;
  public totalSupplierSales: number = 450000;
  public totalCommissionProducts: number = 35;
  
  public searchQuery: string = '';
  public filteredProducts: IProduct[] = [];
  public userRole: 'admin' | 'staff' | 'supplier' | 'employee' = 'admin';
  public products: IProduct[] = [];

  // Installment persons data
  public installmentPersons: IInstallmentPerson[] = [
    { 
      id: '1', 
      name: 'John Doe', 
      product: 'Laptop Pro X1', 
      totalAmount: 85000, 
      paidAmount: 45000, 
      remainingAmount: 40000, 
      nextDueDate: '2023-08-15', 
      status: 'Regular', 
      isDefaulter: false,
      paidInstallments: 4,
      totalInstallments: 12,
      dueInstallments: 8,
      lastPaymentDate: '2023-07-15',
      daysSinceLastPayment: 15
    },
    // ... other installment persons
  ];

  // Pagination properties
  public currentPage: number = 1;
  public itemsPerPage: number = 5;
  public totalItems: number = 0;

  public mainChart: IChartProps = { type: 'line' };
  public salesChart: IChartProps = { type: 'bar' };
  public commissionChart: IChartProps = { type: 'bar' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  #mainChartRefEffect = effect(() => {
    if (this.mainChartRef()) {
      this.setChartStyles();
    }
  });
  public chart: Array<IChartProps> = [];
  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month')
  });

  // Product quantity data by category
  public productQuantityByCategory = [
    { category: 'Electronics', quantity: 137 },
    { category: 'Furniture', quantity: 45 },
    { category: 'Appliances', quantity: 78 },
    { category: 'Accessories', quantity: 92 },
    { category: 'Office Supplies', quantity: 63 }
  ];

  // Top selling products by quantity
  public topSellingProducts = [
    { name: 'Smartphone S22', quantity: 45, revenue: 2025000 },
    { name: 'Laptop Pro X1', quantity: 23, revenue: 1955000 },
    { name: 'LED TV 55"', quantity: 18, revenue: 1170000 },
    { name: 'Air Conditioner', quantity: 15, revenue: 525000 },
    { name: 'Office Desk', quantity: 12, revenue: 144000 }
  ];

  // Add these properties to the DashboardComponent class
  public regularInstallments: number = 18;
  public substandardInstallments: number = 5;
  public doubtfulInstallments: number = 4; 
  public badInstallments: number = 1;

  // Add these properties for supplier dashboard
  public supplierInstallmentCollection: number = 280000;
  public supplierPrinciple: number = 380000;
  public supplierProfit: number = 70000;

  // Add these properties for the employee dashboard search
  public employeeSearchQuery: string = '';
  public filteredInstallmentPersons: IInstallmentPerson[] = [];

  // Modal control properties
  public installmentModalVisible: boolean = false;
  public selectedInstallmentPerson: IInstallmentPerson | null = null;

  ngOnInit(): void {
    this.initCharts();
    this.updateChartOnColorModeChange();
    this.filteredProducts = [...this.products];
    this.initSalesChart();
    this.initCommissionChart();
    this.totalItems = this.installmentPersons.length;
    this.calculateInstallmentStatusCounts();
    this.updateInstallmentStatuses();
    this.filteredInstallmentPersons = [...this.installmentPersons];
  }

  // Pagination methods
  public get paginatedInstallmentPersons(): IInstallmentPerson[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredInstallmentPersons.slice(startIndex, endIndex);
  }

  public changePage(page: number): void {
    this.currentPage = page;
  }

  public previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  public nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  public get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Get defaulters
  public get defaulters(): IInstallmentPerson[] {
    return this.installmentPersons.filter(person => person.isDefaulter);
  }

  initCharts(): void {
    this.mainChart = this.#chartsData.mainChart;
  }

  initSalesChart(): void {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = [42000, 38000, 45000, 50000, 49000, 60000, 70000, 91000, 80000, 75000, 60000, 85000];
    const quantityData = [23, 18, 25, 30, 28, 35, 42, 55, 48, 45, 38, 50];
    
    this.salesChart.data = {
      labels: labels,
      datasets: [
        {
          label: 'Sales Value (৳)',
          backgroundColor: '#4dbd74',
          data: salesData,
          yAxisID: 'y'
        },
        {
          label: 'Quantity Sold',
          backgroundColor: '#20a8d8',
          data: quantityData,
          yAxisID: 'y1'
        }
      ]
    };
    
    this.salesChart.options = {
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Sales Value (৳)'
          },
          ticks: {
            callback: function(value) {
              return '৳' + value.toLocaleString();
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantity Sold'
          },
          // Grid lines are configured to not overlap with the left y-axis
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };
  }

  initCommissionChart(): void {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const commissionData = [5000, 4500, 6000, 7500, 8000, 9500, 10000, 12000, 11000, 9000, 8500, 10500];
    
    this.commissionChart.data = {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Commission',
          backgroundColor: '#20a8d8',
          data: commissionData
        }
      ]
    };
    
    this.commissionChart.options = {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '৳' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  setTrafficPeriod(value: string): void {
    this.trafficRadioGroup.setValue({ trafficRadio: value });
    this.#chartsData.initMainChart(value);
    this.initCharts();
  }

  handleChartRef($chartRef: any) {
    if ($chartRef) {
      this.mainChartRef.set($chartRef);
    }
  }

  updateChartOnColorModeChange() {
    const unListen = this.#renderer.listen(this.#document.documentElement, 'ColorSchemeChange', () => {
      this.setChartStyles();
    });

    this.#destroyRef.onDestroy(() => {
      unListen();
    });
  }

  setChartStyles() {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const options: ChartOptions = { ...this.mainChart.options };
        const scales = this.#chartsData.getScales();
        this.mainChartRef().options.scales = { ...options.scales, ...scales };
        this.mainChartRef().update();
      });
    }
  }

  searchProducts() {
    if (!this.searchQuery.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }
    
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredProducts = this.products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.category.toLowerCase().includes(query) ||
      product.supplier.toLowerCase().includes(query)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredProducts = [...this.products];
  }

  // Helper methods for template calculations
  getTotalQuantity(items: any[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalProductSales(products: IProduct[]): number {
    return products.reduce((sum, product) => sum + product.sales, 0);
  }

  // Method to switch between roles (for demo purposes)
  switchRole(role: 'admin' | 'staff' | 'supplier' | 'employee') {
    this.userRole = role;
  }

  // Add methods to calculate these values
  public calculateInstallmentStatusCounts(): void {
    // Reset counts
    this.regularInstallments = 0;
    this.substandardInstallments = 0;
    this.doubtfulInstallments = 0;
    this.badInstallments = 0;
    
    // Count by status
    this.installmentPersons.forEach(person => {
      switch(person.status) {
        case 'Regular':
          this.regularInstallments++;
          break;
        case 'Substandard':
          this.substandardInstallments++;
          break;
        case 'Doubtful':
          this.doubtfulInstallments++;
          break;
        case 'Bad':
          this.badInstallments++;
          break;
      }
    });
  }

  // Add this method to classify installments based on days since last payment
  public classifyInstallmentStatus(daysSinceLastPayment: number): 'Regular' | 'Substandard' | 'Doubtful' | 'Bad' {
    if (daysSinceLastPayment <= 0) {
      return 'Regular';
    } else if (daysSinceLastPayment <= 30) {
      return 'Substandard';
    } else if (daysSinceLastPayment <= 60) {
      return 'Doubtful';
    } else {
      return 'Bad';
    }
  }

  // Update this method to update the status of all installment persons
  public updateInstallmentStatuses(): void {
    this.installmentPersons.forEach(person => {
      person.status = this.classifyInstallmentStatus(person.daysSinceLastPayment);
      person.isDefaulter = person.status !== 'Regular';
    });
    
    this.calculateInstallmentStatusCounts();
  }

  // Method to filter installment persons based on search query
  public searchInstallments(): void {
    if (!this.employeeSearchQuery.trim()) {
      this.filteredInstallmentPersons = [...this.installmentPersons];
      this.totalItems = this.filteredInstallmentPersons.length;
      this.currentPage = 1;
      return;
    }
    
    const query = this.employeeSearchQuery.toLowerCase().trim();
    this.filteredInstallmentPersons = this.installmentPersons.filter(person => 
      person.name.toLowerCase().includes(query) || 
      person.product.toLowerCase().includes(query) ||
      person.status.toLowerCase().includes(query) ||
      `VNB${person.id}`.includes(query) || // Search by voucher number
      person.totalAmount.toString().includes(query) || 
      person.paidAmount.toString().includes(query)
    );
    
    this.totalItems = this.filteredInstallmentPersons.length;
    this.currentPage = 1; // Reset to first page when searching
  }

  // Method to clear the search
  public clearInstallmentSearch(): void {
    this.employeeSearchQuery = '';
    this.filteredInstallmentPersons = [...this.installmentPersons];
    this.totalItems = this.filteredInstallmentPersons.length;
    this.currentPage = 1;
  }

  // Modal control methods
  public openInstallmentModal(person: IInstallmentPerson): void {
    this.selectedInstallmentPerson = person;
    this.installmentModalVisible = true;
  }

  public closeInstallmentModal(): void {
    this.installmentModalVisible = false;
  }

  public handleModalChange(visible: boolean): void {
    this.installmentModalVisible = visible;
  }

  // Helper method for the modal to display previous payment date
  public getPreviousPaymentDate(lastPaymentDate: string): Date {
    const date = new Date(lastPaymentDate);
    date.setMonth(date.getMonth() - 1); // Assuming monthly installments
    return date;
  }
}
