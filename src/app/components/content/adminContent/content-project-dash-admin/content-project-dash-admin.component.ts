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
import { forkJoin } from 'rxjs';
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
  projectLogStats: { [key: number]: any[] } = {};
  projectActivityStats: { [key: number]: any[] } = {};
  selectedDateRange: string = '7days';

  // View mode property
  viewMode: 'grid' | 'list' = 'list'; // Default to list view

  @ViewChildren('chartContainer') chartContainers!: QueryList<ElementRef>;

  dateRangeOptions = [
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 10 days', value: '10days' },
    { label: 'Last 12 days', value: '12days' },
    { label: 'Last 20 days', value: '20days' }
  ];

  // Add these properties to the class
  currentPackageId: number | null = null;
  isViewingPackage: boolean = false;
  microservicesInPackage: Project[] = [];
  currentPackage: Project | null = null;
  loadingMicroservices: boolean = false;

  // New: Track selected microservice for details view
  selectedMicroservice: Project | null = null;

  // Add this property for project type filtering
  projectTypeFilter: 'all' | 'package' | 'monolithic' = 'all';

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private statsService: StatsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Load saved view mode preference
    const savedViewMode = localStorage.getItem('projectViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }
    
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    // Initial chart initialization will happen after projects are loaded
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
        this.isLoading = false;
        
        // Initialize charts after view has been updated
        setTimeout(() => {
          this.initializeCharts();
          this.cdr.detectChanges();
        });
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
    // Reinitialize charts after filtering
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  onSearchByTag() {
    if (this.tagSearchQuery.trim()) {
      this.projectService.searchProjectsByTag(this.tagSearchQuery.trim()).subscribe({
        next: (projects) => {
          this.filteredProjects = projects;
          // Apply text search filter if exists
          if (this.searchQuery.trim()) {
            this.filteredProjects = this.filteredProjects.filter(project =>
              project.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
              project.description.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
          }
          // Reinitialize charts after tag filtering
          setTimeout(() => {
            this.initializeCharts();
          }, 0);
        },
        error: (error) => {
          this.errorMessage = 'Failed to search projects by tag. Please try again.';
        }
      });
    } else {
      this.applyFilters();
      // Reinitialize charts after clearing tag filter
      setTimeout(() => {
        this.initializeCharts();
      }, 0);
    }
  }

  clearTagSearch() {
    this.tagSearchQuery = '';
    this.applyFilters();
    // Reinitialize charts after clearing tag search
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  private applyFilters() {
    this.filteredProjects = [...this.projects];
    
    // Apply text search filter
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
        const chartId = `chart-${project.id}`;
        const chartElement = document.getElementById(chartId);
        
        if (chartElement) {
          const chartOptions = {
            series: [
              {
                name: "Activity",
                data: [44, 55, 41, 67, 22, 43, 65],
              },
              {
                name: "Errors",
                data: [13, 23, 20, 8, 13, 27, 15],
              },
            ],
            chart: {
              type: "bar",
              height: 200,
              stacked: true,
              toolbar: {
                show: false,
              },
              zoom: {
                enabled: false,
              },
              background: 'transparent',
              foreColor: '#6B7280',
              fontFamily: 'Inter, sans-serif',
            },
            colors: ["#3B82F6", "#E1567C"], // Activity (blue), Errors (red)
            fill: {
              type: 'solid',
            },
            plotOptions: {
              bar: {
                horizontal: false,
                borderRadius: 6,
                columnWidth: "40%",
                borderRadiusApplication: "end",
                borderRadiusWhenStacked: "last",
              },
            },
            dataLabels: {
              enabled: false,
            },
            xaxis: {
              categories: ["M", "T", "W", "T", "F", "S", "S"],
              axisBorder: {
                show: false,
              },
              axisTicks: {
                show: false,
              },
              labels: {
                style: {
                  colors: '#6B7280',
                  fontSize: '12px',
                  fontWeight: 500,
                },
              },
            },
            yaxis: {
              show: true,
              max: 100,
              labels: {
                style: {
                  colors: '#6B7280',
                  fontSize: '12px',
                  fontWeight: 500,
                },
                formatter: function (value: number) {
                  return value + '%';
                },
              },
            },
            grid: {
              show: true,
              borderColor: 'rgba(107, 114, 128, 0.1)',
              strokeDashArray: 4,
              position: 'back',
              xaxis: {
                lines: {
                  show: false
                }
              },
              yaxis: {
                lines: {
                  show: true
                }
              },
              padding: {
                top: 0,
                right: 10,
                bottom: 0,
                left: 10
              },
            },
            legend: {
              position: 'top',
              horizontalAlign: 'left',
              offsetY: -8,
              labels: {
                colors: '#6B7280',
              },
              markers: {
                radius: 4,
                width: 16,
                height: 16,
              },
              itemMargin: {
                horizontal: 12
              },
            },
            tooltip: {
              theme: 'dark',
              style: {
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
              },
              y: {
                formatter: function(value: number) {
                  return value + '%';
                }
              },
              marker: {
                show: true,
              },
              custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
                return '<div class="p-2">' +
                  '<div class="flex items-center gap-2">' +
                  '<span class="w-3 h-3 rounded-full" style="background: ' + w.globals.colors[seriesIndex] + '"></span>' +
                  '<span class="font-medium">' + w.globals.seriesNames[seriesIndex] + '</span>' +
                  '</div>' +
                  '<div class="text-2xl font-bold mt-1">' + series[seriesIndex][dataPointIndex] + '%</div>' +
                  '</div>';
              }
            }
          };

          try {
            const chart = new ApexCharts(chartElement, chartOptions);
            this.charts[project.id!] = chart;
            chart.render();
          } catch (error) {
            console.error(`Error creating chart for project ${project.id}:`, error);
          }
        }
      });
    });
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
      return ''; // Return empty if no logo
    }
    
    // If logo is already a full URL, return it
    if (typeof project.logo === 'string') {
      if (project.logo.startsWith('http://') || project.logo.startsWith('https://')) {
        return project.logo;
      }
      
      // Otherwise, construct the URL to the server's static files
      return `http://localhost:8222${project.logo}`;
    }
    
    // If it's a File object, return an empty string
    // (File objects can't be displayed directly)
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

  // Update toggleViewMode to reinitialize charts when switching to grid view
  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem('projectViewMode', this.viewMode);
    
    // If switching to grid view, initialize charts after view update
    if (this.viewMode === 'grid') {
      setTimeout(() => {
        this.initializeCharts();
        this.cdr.detectChanges();
      });
    }
  }

  loadProjectStats(projectId: number): void {
    const dateRange = this.getSelectedDateRange();
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];
    
    console.log(`Loading stats for project ${projectId}`);
    console.log(`Date range: ${startStr} to ${endStr}`);
    
    // Clear existing stats for this project
    this.projectLogStats[projectId] = [];
    this.projectActivityStats[projectId] = [];
    
    // Show loading state
    this.isLoading = true;
    
    // Track completion of both requests
    let errorStatsLoaded = false;
    let activityStatsLoaded = false;
    
    // Get error stats
    this.statsService.getErrorsByDayForProject(projectId, startStr, endStr).subscribe({
      next: data => {
        console.log(`Received error stats for project ${projectId}:`, data);
        this.projectLogStats[projectId] = data || [];
        errorStatsLoaded = true;
        if (errorStatsLoaded && activityStatsLoaded) {
          this.updateChartAfterDataLoad(projectId);
        }
      },
      error: err => {
        console.error(`Failed to load error stats for project ${projectId}:`, err);
        this.projectLogStats[projectId] = [];
        errorStatsLoaded = true;
        if (errorStatsLoaded && activityStatsLoaded) {
          this.updateChartAfterDataLoad(projectId);
        }
      }
    });
    
    // Get activity stats
    this.statsService.getActivitiesByDayForProject(projectId, startStr, endStr).subscribe({
      next: data => {
        console.log(`Received activity stats for project ${projectId}:`, data);
        this.projectActivityStats[projectId] = data || [];
        activityStatsLoaded = true;
        if (errorStatsLoaded && activityStatsLoaded) {
          this.updateChartAfterDataLoad(projectId);
        }
      },
      error: err => {
        console.error(`Failed to load activity stats for project ${projectId}:`, err);
        this.projectActivityStats[projectId] = [];
        activityStatsLoaded = true;
        if (errorStatsLoaded && activityStatsLoaded) {
          this.updateChartAfterDataLoad(projectId);
        }
      }
    });
  }

  private updateChartAfterDataLoad(projectId: number): void {
    console.log(`Both stats loaded for project ${projectId}, updating chart`);
    this.isLoading = false;
    
    // Ensure we're in the Angular zone when updating the chart
    this.cdr.detectChanges();
    
    // Small delay to ensure the DOM is ready
    setTimeout(() => {
      const chartElement = document.getElementById(`chart-${projectId}`);
      if (chartElement) {
        if (this.charts[projectId]) {
          this.updateChart(projectId);
        } else {
          this.initializeChartForProject(projectId, chartElement);
        }
      }
    }, 100);
  }

  updateChart(projectId: number): void {
    console.log(`Updating chart for project ${projectId}`);
    
    const chart = this.charts[projectId];
    if (!chart) {
      console.warn(`No chart instance found for project ${projectId}, attempting to reinitialize`);
      const chartElement = document.getElementById(`chart-${projectId}`);
      if (chartElement) {
        this.initializeChartForProject(projectId, chartElement);
        return;
      } else {
        console.error(`Could not find chart element for project ${projectId}`);
        return;
      }
    }
    
    try {
      const dateRange = this.getDateRangeForProject(projectId);
      console.log('Date range for chart:', dateRange);
      
      // Get log stats
      const logStats = this.projectLogStats[projectId] || [];
      console.log(`Log stats for project ${projectId}:`, logStats);
      
      // Get activity stats
      const activityStats = this.projectActivityStats[projectId] || [];
      console.log(`Activity stats for project ${projectId}:`, activityStats);
      
      // Create series data for activities and errors
      const activityData = this.prepareChartData(activityStats, dateRange, 'count');
      const errorData = this.prepareChartData(logStats, dateRange, 'count');
      
      console.log(`Chart data for project ${projectId}:`, {
        activityData,
        errorData
      });

      // Update the series data
      chart.updateSeries([
        {
          name: "Activity",
          data: activityData
        },
        {
          name: "Errors",
          data: errorData
        }
      ]);
      
      // Update x-axis categories
      chart.updateOptions({
        xaxis: {
          originalCategories: dateRange,
          categories: dateRange.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
          })
        }
      });

      // Force a redraw
      chart.render();
      
    } catch (error) {
      console.error(`Error updating chart for project ${projectId}:`, error);
      // Try to recover by reinitializing the chart
      this.destroyChart(projectId);
      const chartElement = document.getElementById(`chart-${projectId}`);
      if (chartElement) {
        this.initializeChartForProject(projectId, chartElement);
      }
    }
  }

  private destroyChart(projectId: number): void {
    try {
      if (this.charts[projectId]) {
        this.charts[projectId].destroy();
        delete this.charts[projectId];
      }
    } catch (error) {
      console.error(`Error destroying chart for project ${projectId}:`, error);
    }
  }

  initializeChartForProject(projectId: number, chartElement: HTMLElement): void {
    console.log(`Initializing chart for project ${projectId}`);
    
    // First destroy existing chart if any
    this.destroyChart(projectId);
    
    const dateRange = this.getDateRangeForProject(projectId);
    
    // Get real data if available
    const logStats = this.projectLogStats[projectId] || [];
    const activityStats = this.projectActivityStats[projectId] || [];
    
    const activityData = this.prepareChartData(activityStats, dateRange, 'count');
    const errorData = this.prepareChartData(logStats, dateRange, 'count');
    
    const chartOptions = {
      series: [
        {
          name: "Activity",
          data: activityData,
        },
        {
          name: "Errors", 
          data: errorData,
        },
      ],
      chart: {
        type: "bar",
        height: 250,
        stacked: true,
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
          enabled: false,
        },
        parentHeightOffset: 0
      },
      colors: ["#4F46E5", "#DC2626"], // Changed colors: indigo-600 for Activity, red-600 for Errors
      fill: {
        opacity: 1 // Removed gradient, using solid colors
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 4,
          columnWidth: dateRange.length > 10 ? "85%" : "60%",
          borderRadiusApplication: "end",
          borderRadiusWhenStacked: "last",
        },
      },
      dataLabels: {
        enabled: false,
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
        },
        tooltip: {
          enabled: true,
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
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetY: -8,
        markers: {
          radius: 4,
          width: 16,
          height: 16,
        },
        itemMargin: {
          horizontal: 12
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
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
      states: {
        hover: {
          filter: {
            type: 'darken',
            value: 0.1,
          }
        },
        active: {
          filter: {
            type: 'darken',
            value: 0.1,
          }
        }
      }
    };

    try {
      console.log(`Creating new chart instance for project ${projectId}`);
      const chart = new ApexCharts(chartElement, chartOptions);
      this.charts[projectId] = chart;
      chart.render();
      
      // Re-enable animations after initial render
      setTimeout(() => {
        chart.updateOptions({
          chart: {
            animations: {
              enabled: true,
              easing: 'easeinout',
              speed: 800,
              animateGradually: {
                enabled: true,
                delay: 150
              },
              dynamicAnimation: {
                enabled: true,
                speed: 350
              }
            }
          }
        });
      }, 500);
      
    } catch (error) {
      console.error(`Error creating chart for project ${projectId}:`, error);
    }
  }

  // 6. Helper to check if we have both stats and update the chart
  checkAndUpdateChart(projectId: number): void {
    console.log(`Checking and updating chart for project ${projectId}`);
    
    if (this.projectLogStats[projectId] !== undefined && this.projectActivityStats[projectId] !== undefined) {
      console.log(`Data available for project ${projectId}, updating chart`);
      
      // If chart exists, update it
      if (this.charts[projectId]) {
        console.log(`Chart exists for project ${projectId}, updating it`);
        this.updateChart(projectId);
      }
      // If we're in grid view but chart doesn't exist yet, try to create it
      else if (this.viewMode === 'grid') {
        console.log(`Chart doesn't exist for project ${projectId}, trying to create it`);
        
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
          const chartElement = document.getElementById(`chart-${projectId}`);
          if (chartElement) {
            console.log(`Found chart element for project ${projectId}, initializing chart`);
            this.initializeChartForProject(projectId, chartElement);
          } else {
            console.warn(`Chart element not found for project ${projectId}`);
            
            // Try one more time with a longer delay
            setTimeout(() => {
              const retryChartElement = document.getElementById(`chart-${projectId}`);
              if (retryChartElement) {
                console.log(`Found chart element on retry for project ${projectId}`);
                this.initializeChartForProject(projectId, retryChartElement);
              }
            }, 500);
          }
        }, 100);
      }
      
      // Force change detection to update the UI
      this.cdr.detectChanges();
    } else {
      console.log(`Waiting for complete data for project ${projectId}`);
    }
  }

  onDateRangeChange(range: string): void {
    console.log(`Date range changed to: ${range}`);
    this.selectedDateRange = range;
    
    // Clear existing stats
    this.projectLogStats = {};
    this.projectActivityStats = {};
    
    // Show loading state
    this.isLoading = true;
    
    // Reload stats for all projects with new date range
    this.projects.forEach(project => {
      this.loadProjectStats(project.id!);
    });
    
    // Reinitialize charts after a delay to ensure data is loaded
    setTimeout(() => {
      console.log('Reinitializing charts after date range change');
      this.initializeCharts();
      this.cdr.detectChanges();
    }, 500);
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
    
    console.log(`Generating date range for project ${projectId}`);
    console.log(`Start date: ${start.toISOString()}`);
    console.log(`End date: ${end.toISOString()}`);
    
    while (currentDate <= end) {
      dateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Generated date range:`, dateRange);
    return dateRange;
  }

  prepareChartData(stats: any[], dateRange: string[], field: string): number[] {
    console.log('Preparing chart data from stats:', stats);
    console.log('Date range:', dateRange);
    
    // Initialize array with zeros for each date in range
    const data = new Array(dateRange.length).fill(0);
    
    // Create a map for quick lookup of stats by date
    const statsMap = new Map();
    stats.forEach(stat => {
      if (stat && stat.day) {
        statsMap.set(stat.day, stat[field] || 0);
      }
    });
    
    // Map data points to corresponding dates
    dateRange.forEach((date, index) => {
      // Format the date to match the stats format (YYYY-MM-DD)
      const formattedDate = new Date(date).toISOString().split('T')[0];
      console.log(`Checking data for date ${formattedDate}`);
      
      if (statsMap.has(formattedDate)) {
        data[index] = statsMap.get(formattedDate);
        console.log(`Found data for ${formattedDate}: ${data[index]}`);
      } else {
        console.log(`No data found for ${formattedDate}`);
      }
    });
    
    console.log('Final prepared data:', data);
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

  // Add this method to the class
  openPackage(packageProject: Project): void {
    this.loadingMicroservices = true;
    this.currentPackageId = packageProject.getId();
    this.currentPackage = packageProject;
    this.isViewingPackage = true;
    this.selectedMicroservice = null; // Reset selection when opening a package
    // Fetch microservices in this package
    this.projectService.getMicroservicesInPackage(packageProject.getId()).subscribe({
      next: (microservices) => {
        this.microservicesInPackage = microservices;
        this.loadingMicroservices = false;
      },
      error: (error) => {
        console.error('Error loading microservices:', error);
        this.toastr.error('Failed to load microservices in this package');
        this.loadingMicroservices = false;
      }
    });
  }

  // New: Select a microservice to view its details
  selectMicroservice(microservice: Project): void {
    this.selectedMicroservice = microservice;
  }

  // New: Go back to the microservices list in the package
  backToMicroservicesList(): void {
    this.selectedMicroservice = null;
  }

  backToProjects(): void {
    this.isViewingPackage = false;
    this.currentPackageId = null;
    this.currentPackage = null;
    this.microservicesInPackage = [];
    this.selectedMicroservice = null; // Reset selection when leaving package view
  }

  isPackage(project: Project): boolean {
    return project.projectType === 'MICROSERVICES_PACKAGE';
  }

  isMicroservice(project: Project): boolean {
    return project.projectType === 'MICROSERVICES';
  }

  // Add the method to redirect to the add-project page with the current package ID
  onAddMicroserviceClick() {
    if (this.currentPackageId) {
      // Navigate to the add-project page with the selected package ID
      this.router.navigate(['/dashboard/add-project'], { 
        queryParams: { 
          mode: 'microservice', 
          packageId: this.currentPackageId,
          step: '3'  // Go directly to the microservice creation step
        } 
      });
    } else {
      this.toastr.error('Package ID not found. Please try again.');
    }
  }
}
