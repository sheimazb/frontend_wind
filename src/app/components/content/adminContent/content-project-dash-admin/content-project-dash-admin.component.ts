import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectService } from '../../../../services/project.service';
import { Project } from '../../../../models/project.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ApexCharts from 'apexcharts';
import { StatsService } from '../../../../services/stats.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectTypePipe } from './project-type.pipe';

@Component({
  selector: 'app-content-project-dash-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatFormFieldModule,
    MatTooltipModule,
    ProjectTypePipe
  ],
  templateUrl: './content-project-dash-admin.component.html',
  styleUrls: ['./content-project-dash-admin.component.css'],
  styles: [`
    h3 {
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1.2 !important;
    }
  `]
})
export class ContentProjectDashAdminComponent implements OnInit, AfterViewInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading = true;
  errorMessage = '';
  searchQuery = '';
  tagSearchQuery = '';
  charts: { [key: string]: ApexCharts } = {};
  projectErrorStats: { [key: number]: any[] } = {};
  projectTotalErrors: { [key: number]: number } = {};
  selectedDateRange: string = '7days';
  viewMode: 'grid' | 'list' = 'list'; // Default to list view

  @ViewChildren('chartContainer') chartContainers!: QueryList<ElementRef>;

  dateRangeOptions = [
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 10 days', value: '10days' },
    { label: 'Last 12 days', value: '12days' },
    { label: 'Last 20 days', value: '20days' }
  ];

  currentPackageId: number | null = null;
  isViewingPackage: boolean = false;
  microservicesInPackage: Project[] = [];
  currentPackage: Project | null = null;
  loadingMicroservices: boolean = false;
  selectedMicroservice: Project | null = null;
  projectTypeFilter: 'all' | 'package' | 'monolithic' = 'all';

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private statsService: StatsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const savedViewMode = localStorage.getItem('projectViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    } 
    this.loadProjects();
  }

  ngAfterViewInit(): void {
   
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
        this.isLoading = false;
        
        this.projects.forEach(project => {
          if (project.id) {
            this.loadProjectErrorStats(project.id);
            this.loadTotalErrorsForProject(project.id);
          }
        });
        
        setTimeout(() => {
          this.initializeCharts();
          this.cdr.detectChanges();
        }, 500);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.errorMessage = 'Failed to load projects. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  onSearchProjects(event: any): void {
    this.searchQuery = event.target.value;
    this.applyFilters();
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  private applyFilters() {
    this.filteredProjects = [...this.projects];
    if (this.searchQuery.trim()) {
      this.filteredProjects = this.filteredProjects.filter(project =>
        project.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  initializeCharts(): void {
    // First, destroy existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};

    // Only proceed if we're in grid view
    if (this.viewMode !== 'grid') {
      return;
    }

    // Wait for the next tick to ensure DOM is updated
    setTimeout(() => {
      this.filteredProjects.forEach(project => {
        if (!project.id) return;
        
        const chartId = `chart-${project.id}`;
        const chartElement = document.getElementById(chartId);
        
        if (chartElement) {
          this.createErrorChart(project.id, chartElement);
        }
      });
    }, 100);
  }

  loadProjectErrorStats(projectId: number): void {
    const dateRange = this.getSelectedDateRange();
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];
    
    console.log(`Loading error stats for project ${projectId}`);
    console.log(`Date range: ${startStr} to ${endStr}`);
    
    // Show loading indicator for this specific chart
    const chartElement = document.getElementById(`chart-${projectId}`);
    if (chartElement) {
      chartElement.innerHTML = '<div class="flex items-center justify-center h-full w-full"><div class="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div></div>';
    }
    
    this.projectErrorStats[projectId] = [];
    
    this.statsService.getErrorsByDayForProject(projectId, startStr, endStr).subscribe({
      next: data => {
        console.log(`Received error stats for project ${projectId}:`, data);
        this.projectErrorStats[projectId] = data || [];
        
        // Update chart if it exists
        if (this.charts[projectId]) {
          this.updateErrorChart(projectId);
        } else {
          // Try to create chart if it doesn't exist yet
          setTimeout(() => {
            const chartElement = document.getElementById(`chart-${projectId}`);
            if (chartElement && this.viewMode === 'grid') {
              this.createErrorChart(projectId, chartElement);
            }
          }, 100);
        }
      },
      error: err => {
        console.error(`Failed to load error stats for project ${projectId}:`, err);
        this.projectErrorStats[projectId] = [];
        // Show a user-friendly toast notification
        this.toastr.warning('Statistics service is currently unavailable. Charts may not display correctly.');
        
        // Still create/update the chart to show empty state
        setTimeout(() => {
          const chartElement = document.getElementById(`chart-${projectId}`);
          if (chartElement && this.viewMode === 'grid') {
            if (this.charts[projectId]) {
              this.updateErrorChart(projectId);
            } else {
              this.createErrorChart(projectId, chartElement);
            }
          }
        }, 100);
      }
    });
  }

  updateErrorChart(projectId: number): void {
    const chart = this.charts[projectId];
    if (!chart) {
      console.warn(`No chart instance found for project ${projectId}`);
      return;
    }
    
    try {
      const dateRange = this.getDateRangeForProject(projectId);
      const errorStats = this.projectErrorStats[projectId] || [];
      const errorData = this.prepareChartData(errorStats, dateRange, 'count');
      
      // Check if we have any non-zero data
      const hasData = errorData.some(value => value > 0);
      
      chart.updateSeries([
        {
          name: "Errors",
          data: errorData
        }
      ]);
      
      chart.updateOptions({
        xaxis: {
          categories: dateRange.map(date => {
            const d = new Date(date);
            return dateRange.length > 10 
              ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          })
        },
        noData: {
          text: hasData ? undefined : 'No error data available',
          align: 'center',
          verticalAlign: 'middle',
          offsetX: 0,
          offsetY: 0,
          style: {
            color: '#6B7280',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif'
          }
        }
      });
    } catch (error) {
      console.error(`Error updating chart for project ${projectId}:`, error);
    }
  }

  createErrorChart(projectId: number, chartElement: HTMLElement): void {
    // Get the date range and error stats
    const dateRange = this.getDateRangeForProject(projectId);
    const errorStats = this.projectErrorStats[projectId] || [];
    const errorData = this.prepareChartData(errorStats, dateRange, 'count');
    
    // Check if we have any non-zero data
    const hasData = errorData.some(value => value > 0);
    
    const chartOptions = {
      series: [
        {
          name: "Errors",
          data: errorData,
        }
      ],
      chart: {
        type: "line",
        height: 250,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        background: 'transparent',
        foreColor: '#6B7280',
        fontFamily: 'Inter, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
        parentHeightOffset: 0
      },
      colors: ["#DC2626"], // Red color for errors
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: "#DC2626",
              opacity: 0.2
            },
            {
              offset: 100,
              color: "#DC2626",
              opacity: 0
            }
          ]
        }
      },
      markers: {
        size: 4,
        colors: ["#DC2626"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        }
      },
      xaxis: {
        categories: dateRange.map(date => {
          const d = new Date(date);
          return dateRange.length > 10 
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        }),
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '11px',
            fontWeight: 500,
          },
          rotate: dateRange.length > 10 ? -45 : 0,
          offsetY: dateRange.length > 10 ? 5 : 0,
        }
      },
      yaxis: {
        show: true,
        min: 0,
        forceNiceScale: true,
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
            fontWeight: 500,
          },
          formatter: function (value: number) {
            return Math.floor(value).toString();
          },
        },
      },
      grid: {
        show: true,
        borderColor: 'rgba(107, 114, 128, 0.1)',
        strokeDashArray: 4,
        position: 'back',
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 10
        },
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        y: {
          formatter: function(value: number) {
            return value.toFixed(0);
          }
        },
        marker: {
          show: true,
        }
      },
      noData: {
        text: hasData ? undefined : 'No error data available',
        align: 'center',
        verticalAlign: 'middle',
        offsetX: 0,
        offsetY: 0,
        style: {
          color: '#6B7280',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif'
        }
      }
    };

    try {
      const chart = new ApexCharts(chartElement, chartOptions);
      this.charts[projectId] = chart;
      chart.render();
    } catch (error) {
      console.error(`Error creating chart for project ${projectId}:`, error);
    }
  }

  onDateRangeChange(range: string): void {
    console.log(`Date range changed to: ${range}`);
    this.selectedDateRange = range;
    
    // Clear existing stats
    this.projectErrorStats = {};
    
    // Destroy existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
    
    // Show loading state
    this.isLoading = true;
    
    // Reload stats for all visible projects with new date range
    this.filteredProjects.forEach(project => {
      if (project.id) {
        this.loadProjectErrorStats(project.id);
      }
    });
    
    // Hide loading state after a delay
    setTimeout(() => {
      this.isLoading = false;
      
      // Make sure we're in grid view to initialize charts
      if (this.viewMode === 'grid') {
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      }
      
      this.cdr.detectChanges();
    }, 1000);
  }

  getSelectedDateRange(): { start: Date, end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // Set to end of day
    let start = new Date();
    start.setHours(0, 0, 0, 0); // Set to start of day

    switch (this.selectedDateRange) {
      case '7days':
        start.setDate(end.getDate() - 6); // 7 days including today
        break;
      case '10days':
        start.setDate(end.getDate() - 9); // 10 days including today
        break;
      case '12days':
        start.setDate(end.getDate() - 11); // 12 days including today
        break;
      case '20days':
        start.setDate(end.getDate() - 19); // 20 days including today
        break;
      default:
        // Default to 7 days if no valid option is selected
        start.setDate(end.getDate() - 6);
        break;
    }

    return { start, end };
  }

  getDateRangeForProject(projectId: number): string[] {
    const { start, end } = this.getSelectedDateRange();
    const dateRange: string[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateRange;
  }

  prepareChartData(stats: any[], dateRange: string[], field: string): number[] {
    // Initialize array with zeros for each date in range
    const data = new Array(dateRange.length).fill(0);
    
    if (!stats || stats.length === 0) {
      console.log('No stats data available, returning zeros');
      return data;
    }
    
    console.log('Preparing chart data with stats:', stats);
    console.log('For date range:', dateRange);
    
    // Create a map for quick lookup of stats by date
    const statsMap = new Map();
    stats.forEach(stat => {
      if (stat && stat.day) {
        statsMap.set(stat.day, stat[field] || 0);
        console.log(`Mapped ${stat.day} to value ${stat[field] || 0}`);
      }
    });
    
    // Map data points to corresponding dates
    dateRange.forEach((date, index) => {
      // Format the date to match the stats format (YYYY-MM-DD)
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      if (statsMap.has(formattedDate)) {
        data[index] = statsMap.get(formattedDate);
        console.log(`Date ${formattedDate} has value ${data[index]}`);
      } else {
        console.log(`No data for date ${formattedDate}, using 0`);
      }
    });
    
    console.log('Final data array:', data);
    return data;
  }

  getDateRangeLabel(): string {
    const { start, end } = this.getSelectedDateRange();
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Format dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  hasLogo(project: Project): boolean {
    return Boolean(
      project && 
      project.logo && 
      (
        (typeof project.logo === 'string' && project.logo.trim() !== '') || 
        project.logo instanceof File
      )
    );
  }

  getLogoUrl(project: Project): string {
    if (!this.hasLogo(project)) {
      return '';
    }
    if (typeof project.logo === 'string') {
      if (project.logo.startsWith('http://') || project.logo.startsWith('https://')) {
        return project.logo;
      }
      return `http://localhost:8222${project.logo}`;
    }
    return '';
  }

  onProjectSettingsClick(projectId: number) {
    this.router.navigate(['/dashboard/project-settings', projectId]);
  }

  onAddProjectClick() {
    this.router.navigate(['/dashboard/add-project']);
  }

  onProjectDetailsClick(projectId: number) {
    this.router.navigate(['/dashboard/project-details/' + projectId]);
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem('projectViewMode', this.viewMode);
    if (this.viewMode === 'grid') {
      setTimeout(() => {
        this.initializeCharts();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  openPackage(packageProject: Project): void {
    this.loadingMicroservices = true;
    this.currentPackageId = packageProject.getId();
    this.currentPackage = packageProject;
    this.isViewingPackage = true;
    this.selectedMicroservice = null; 
    this.projectService.getMicroservicesInPackage(packageProject.getId()).subscribe({
      next: (microservices) => {
        this.microservicesInPackage = microservices;
        this.loadingMicroservices = false;
        
        // Load stats for each microservice
        microservices.forEach(microservice => {
          if (microservice.id) {
            this.loadProjectErrorStats(microservice.id);
            this.loadTotalErrorsForProject(microservice.id);
          }
        });
        
        // Initialize charts for microservices if in grid view
        if (this.viewMode === 'grid') {
          setTimeout(() => {
            this.initializeMicroserviceCharts();
          }, 500);
        }
      },
      error: (error) => {
        console.error('Error loading microservices:', error);
        this.toastr.error('Failed to load microservices in this package');
        this.loadingMicroservices = false;
      }
    });
  }

  selectMicroservice(microservice: Project): void {
    this.selectedMicroservice = microservice;
  }

  backToMicroservicesList(): void {
    this.selectedMicroservice = null;
  }

  backToProjects(): void {
    this.isViewingPackage = false;
    this.currentPackageId = null;
    this.currentPackage = null;
    this.microservicesInPackage = [];
    this.selectedMicroservice = null;
  }

  isPackage(project: Project): boolean {
    return project.projectType === 'MICROSERVICES_PACKAGE';
  }

  isMicroservice(project: Project): boolean {
    return project.projectType === 'MICROSERVICES';
  }

  onAddMicroserviceClick() {
    if (this.currentPackageId) {
      this.router.navigate(['/dashboard/add-project'], { 
        queryParams: { 
          mode: 'microservice', 
          packageId: this.currentPackageId,
          step: '3'  
        } 
      });
    } else {
      this.toastr.error('Package ID not found. Please try again.');
    }
  }

  loadTotalErrorsForProject(projectId: number): void {
    this.statsService.getTotalErrorsForProject(projectId).subscribe({
      next: (totalErrors) => {
        console.log(`Received total errors for project ${projectId}:`, totalErrors);
        this.projectTotalErrors[projectId] = totalErrors;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Failed to load total errors for project ${projectId}:`, err);
        this.projectTotalErrors[projectId] = 0;
        // Only show the toast once to avoid spamming the user with notifications
        if (!this.hasShownServiceUnavailableToast) {
          this.toastr.warning('Error statistics service is currently unavailable.');
          this.hasShownServiceUnavailableToast = true;
        }
      }
    });
  }

  // Add this property to track if we've shown the toast
  private hasShownServiceUnavailableToast = false;

  // Add this new method to initialize charts for microservices
  initializeMicroserviceCharts(): void {
    // Only proceed if we're in grid view and viewing a package
    if (this.viewMode !== 'grid' || !this.isViewingPackage) {
      return;
    }

    // Wait for the next tick to ensure DOM is updated
    setTimeout(() => {
      this.microservicesInPackage.forEach(microservice => {
        if (!microservice.id) return;
        
        const chartId = `microservice-chart-${microservice.id}`;
        const chartElement = document.getElementById(chartId);
        
        if (chartElement) {
          this.createErrorChart(microservice.id, chartElement);
        }
      });
    }, 100);
  }

  // Update this method to handle project type filter changes
  onProjectTypeFilterChange(filter: 'all' | 'package' | 'monolithic'): void {
    this.projectTypeFilter = filter;
    
    // Re-initialize charts after filter change with a small delay to allow DOM to update
    if (this.viewMode === 'grid') {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  // Helper method to get the maximum error count for a project
  getMaxErrorCount(projectId: number | undefined): number {
    if (!projectId || !this.projectErrorStats[projectId] || this.projectErrorStats[projectId].length === 0) {
      return 1; // Return 1 to avoid division by zero
    }
    
    return Math.max(...this.projectErrorStats[projectId].map(stat => stat.count || 0), 1);
  }
}
