import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import ApexCharts from 'apexcharts';
import { MatTableModule } from '@angular/material/table';
import { diAngularOriginal, diSpringOriginal } from '@ng-icons/devicon/original';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { DashboardService } from '../../../../services/dashboard.service';
import { DashboardData, ProjectHealthStat } from '../../../../models/dashboard.model';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Project as ProjectModel } from '../../../../models/project.model';

// Updated interface to match the API response
export interface ProjectStats {
  activityByDay: { day: string; count: number }[];
  errorsByDay: { day: string; type: string; count: number }[];
  timeBasedStatistics: { totalErrors: number };
  criticalErrors: number;
  totalErrors: number;
  errorsByType: { count: number; type: string }[];
}

export interface PeriodicElement {
  PROJECT: string;
  TOTAL: number;
  CRITICAL: number;
  ACTION: string;
  projectId: number;
  isExpanded: boolean;
  details?: any;
  activityChart?: ApexCharts;
}

export type TimeRange = 'day' | 'month' | 'year' | 'all';

@Component({
  selector: 'app-content-dash-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    NgIcon
  ],
  templateUrl: './content-dash-admin.component.html',
  styleUrl: './content-dash-admin.component.css',
  viewProviders: [provideIcons({ diAngularOriginal, diSpringOriginal })]
})
export class ContentDashAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  projects: ProjectModel[] = [];
  selectedProjectId: number | null = null;
  projectStats: ProjectStats | null = null;
  displayedColumns: string[] = ['PROJECT', 'TOTAL', 'CRITICAL', 'ACTION'];
  dataSource: PeriodicElement[] = [];
  private lineChart?: ApexCharts;
  private donutChart?: ApexCharts;
  isLoading = false;
  error: string | null = null;
  
  // Time range filter
  selectedTimeRange: TimeRange = 'all';
  timeRangeOptions: {value: TimeRange, label: string}[] = [
    { value: 'day', label: 'Daily' },
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
    { value: 'all', label: 'All Time' }
  ];

  constructor(private dashboardService: DashboardService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.lineChart) {
      this.lineChart.destroy();
    }
    if (this.donutChart) {
      this.donutChart.destroy();
    }
    
    // Clean up project activity charts
    this.dataSource.forEach(element => {
      if (element.activityChart) {
        element.activityChart.destroy();
      }
    });
  }

  private loadProjects(): void {
    this.isLoading = true;
    this.error = null;
    // Example: fetch all projects for admin (adjust endpoint as needed)
    this.http.get<ProjectModel[]>('http://localhost:8222/api/v1/projects').subscribe({
      next: (projects) => {
        this.projects = projects;
        if (projects.length > 0) {
          this.selectedProjectId = projects[0].id ?? null;
          this.loadProjectStats(this.selectedProjectId ?? 0);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load projects.';
        this.isLoading = false;
      }
    });
  }

  onProjectChange(event: Event): void {
    if (this.selectedProjectId !== null) {
      this.loadProjectStats(this.selectedProjectId);
    }
  }

  onTimeRangeChange(timeRange: TimeRange): void {
    this.selectedTimeRange = timeRange;
    this.initLineChart();
  }

  private loadProjectStats(projectId: number): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<ProjectStats>(`http://localhost:8222/api/v1/statistics/logs/project/${projectId}/details`).subscribe({
      next: (stats) => {
        this.projectStats = stats;
        this.updateTableData();
        setTimeout(() => {
          this.initLineChart();
          this.initDonutChart();
        }, 100);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load project statistics.';
        this.isLoading = false;
      }
    });
  }

  private updateTableData(): void {
    if (!this.projectStats) return;
    // Map projectStats to dataSource based on the new API structure
    this.dataSource = [{
      PROJECT: `Project ${this.selectedProjectId}`,
      TOTAL: this.projectStats.totalErrors,
      CRITICAL: this.projectStats.criticalErrors,
      ACTION: this.selectedProjectId?.toString() || '',
      projectId: this.selectedProjectId || 0,
      isExpanded: false
    }];
  }

  private initLineChart(): void {
    if (!this.projectStats) return;
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Get the data with time filtering applied
    const { dates, activityCounts, errorCounts } = this.getFilteredTimeData();
    
    const chartOptions = {
      series: [
        { name: 'Activity', data: activityCounts, type: 'area' },
        { name: 'Errors', data: errorCounts, type: 'line' }
      ],
      chart: { height: 320, type: 'line', fontFamily: 'Inter, sans-serif', toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, easing: 'easeinout', speed: 800, animateGradually: { enabled: true, delay: 150 }, dynamicAnimation: { enabled: true, speed: 350 } } },
      colors: ['#3B82F6', '#EF4444'],
      fill: { type: ['gradient', 'solid'], gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, gradientToColors: ['#1D4ED8', '#DC2626'], inverseColors: false, opacityFrom: 0.7, opacityTo: 0.1 } },
      stroke: { width: [2, 3], curve: 'smooth', lineCap: 'round' },
      grid: { show: true, borderColor: isDarkMode ? '#374151' : '#E5E7EB', strokeDashArray: 4, padding: { left: 10, right: 10 } },
      xaxis: { 
        categories: dates, 
        labels: { 
          style: { colors: isDarkMode ? '#9CA3AF' : '#6B7280', fontFamily: 'Inter, sans-serif' },
          formatter: (value: string) => {
            return value;
          }
        }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false } 
      },
      yaxis: { labels: { style: { colors: isDarkMode ? '#9CA3AF' : '#6B7280', fontFamily: 'Inter, sans-serif' } } },
      legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: isDarkMode ? '#E5E7EB' : '#374151' } },
      tooltip: { theme: isDarkMode ? 'dark' : 'light', x: { show: true } }
    };
    if (this.lineChart) this.lineChart.destroy();
    this.lineChart = new ApexCharts(document.querySelector('#chartOne'), chartOptions);
    this.lineChart.render();
  }

  private getFilteredTimeData() {
    if (!this.projectStats) {
      return { dates: [], activityCounts: [], errorCounts: [] };
    }
    
    // If we want to show all data without filtering
    if (this.selectedTimeRange === 'all') {
      const activity = [...(this.projectStats.activityByDay || [])];
      const errors = [...(this.projectStats.errorsByDay || [])];
      
      // Sort by date ascending
      activity.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
      errors.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
      
      const dates = activity.map(a => new Date(a.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const activityCounts = activity.map(a => a.count);
      const errorCounts = errors.map(e => e.count);
      
      return { dates, activityCounts, errorCounts };
    }
    
    // Otherwise, generate the complete time range with specific periods
    return this.generateTimeRangeData();
  }
  
  private generateTimeRangeData() {
    const now = new Date();
    const dates: string[] = [];
    const activityMap: Record<string, number> = {};
    const errorMap: Record<string, number> = {};
    
    // Create data maps for quick lookup
    if (this.projectStats?.activityByDay) {
      this.projectStats.activityByDay.forEach(item => {
        const date = new Date(item.day);
        const key = this.getDateKey(date);
        activityMap[key] = (activityMap[key] || 0) + item.count;
      });
    }
    
    if (this.projectStats?.errorsByDay) {
      this.projectStats.errorsByDay.forEach(item => {
        const date = new Date(item.day);
        const key = this.getDateKey(date);
        errorMap[key] = (errorMap[key] || 0) + item.count;
      });
    }
    
    // Generate date ranges based on selected time unit
    if (this.selectedTimeRange === 'day') {
      // Show last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    } 
    else if (this.selectedTimeRange === 'month') {
      // Show last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
    } 
    else if (this.selectedTimeRange === 'year') {
      // Show 5 years before and 5 years after current year
      const currentYear = now.getFullYear();
      for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        dates.push(year.toString());
      }
    }
    
    // Map data to the generated dates
    const activityCounts: number[] = [];
    const errorCounts: number[] = [];
    
    dates.forEach(dateLabel => {
      let key = '';
      
      if (this.selectedTimeRange === 'day') {
        // Parse the date from "Jun 4" format
        const parts = dateLabel.split(' ');
        const month = this.getMonthNumber(parts[0]);
        const day = parseInt(parts[1]);
        const year = now.getFullYear(); // Assume current year
        key = `${year}-${month}-${day.toString().padStart(2, '0')}`;
      } 
      else if (this.selectedTimeRange === 'month') {
        // Parse the date from "Jun 2023" format
        const parts = dateLabel.split(' ');
        const month = this.getMonthNumber(parts[0]);
        const year = parseInt(parts[1]);
        key = `${year}-${month}`;
      } 
      else if (this.selectedTimeRange === 'year') {
        // Year is already in the correct format
        key = dateLabel;
      }
      
      activityCounts.push(activityMap[key] || 0);
      errorCounts.push(errorMap[key] || 0);
    });
    
    return { dates, activityCounts, errorCounts };
  }
  
  private getDateKey(date: Date): string {
    if (this.selectedTimeRange === 'day') {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } 
    else if (this.selectedTimeRange === 'month') {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } 
    else if (this.selectedTimeRange === 'year') {
      return date.getFullYear().toString();
    }
    return '';
  }
  
  private getMonthNumber(monthAbbr: string): string {
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return months[monthAbbr] || '01';
  }

  private initDonutChart(): void {
    if (!this.projectStats) return;
    const isDarkMode = document.documentElement.classList.contains('dark');
    const errorTypes = this.projectStats.errorsByType || [];
    const labels = errorTypes.map((e) => e.type);
    const series = errorTypes.map((e) => e.count);
    const donutOptions: any = {
      series: series,
      chart: {
        type: 'donut',
        height: 320,
        fontFamily: 'Inter, sans-serif',
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
      },
      labels: labels,
      colors: ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                color: isDarkMode ? '#E5E7EB' : '#374151',
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '24px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                color: isDarkMode ? '#FFFFFF' : '#111827',
                offsetY: 10,
                formatter: function (val: string) {
                  return val;
                }
              },
              total: {
                show: true,
                showAlways: false,
                label: 'Total Errors',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                formatter: function (w: any) {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                }
              }
            }
          }
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '12px',
        fontWeight: 500,
        labels: {
          colors: isDarkMode ? '#E5E7EB' : '#374151'
        },
        markers: {
          width: 12,
          height: 12,
          strokeWidth: 0,
          strokeColor: '#fff',
          fillColors: undefined,
          radius: 12
        }
      }
    };
    if (this.donutChart) this.donutChart.destroy();
    this.donutChart = new ApexCharts(document.querySelector('#donutChart'), donutOptions);
    this.donutChart.render();
  }

  refreshData(): void {
    this.loadProjectStats(this.selectedProjectId || 0);
  }

  exportData(): void {
    // Implementation for data export
    console.log('Exporting dashboard data...');
  }

  toggleProjectDetails(element: PeriodicElement): void {
    element.isExpanded = !element.isExpanded;
    
    if (element.isExpanded && !element.details) {
      this.dashboardService.getProjectDetails(element.projectId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (details) => {
            element.details = details;
            setTimeout(() => {
              this.initActivityChart(element);
            }, 100);
          },
          error: (error) => {
            console.error('Error loading project details:', error);
            element.isExpanded = false;
          }
        });
    }
  }

  private initActivityChart(element: PeriodicElement): void {
    if (!element.details || !element.details.activityByDay) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const dates = element.details.activityByDay.map((activity: any) => 
      new Date(activity.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const activityData = element.details.activityByDay.map((activity: any) => activity.count);
    const errorData = element.details.errorsByDay.map((error: any) => error.count);

    const chartOptions = {
      series: [
        {
          name: 'Activity',
          data: activityData,
          type: 'area',
        },
        {
          name: 'Errors',
          data: errorData,
          type: 'line',
        }
      ],
      chart: {
        height: 250,
        type: 'line',
        fontFamily: 'Inter, sans-serif',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
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
      },
      colors: ['#3B82F6', '#EF4444'],
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: ['#1D4ED8', '#DC2626'],
          inverseColors: false,
          opacityFrom: 0.7,
          opacityTo: 0.1,
        }
      },
      stroke: {
        width: [2, 3],
        curve: 'smooth',
        lineCap: 'round'
      },
      grid: {
        show: true,
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
        strokeDashArray: 4,
        padding: {
          left: 10,
          right: 10
        }
      },
      xaxis: {
        categories: dates,
        labels: {
          style: {
            colors: isDarkMode ? '#9CA3AF' : '#6B7280',
            fontFamily: 'Inter, sans-serif'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: isDarkMode ? '#9CA3AF' : '#6B7280',
            fontFamily: 'Inter, sans-serif'
          }
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: isDarkMode ? '#E5E7EB' : '#374151'
        }
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        x: {
          show: true
        }
      }
    };

    if (element.activityChart) {
      element.activityChart.destroy();
    }

    const chartElement = document.querySelector(`#activity-chart-${element.projectId}`);
    if (chartElement) {
      element.activityChart = new ApexCharts(chartElement, chartOptions);
      element.activityChart.render();
    }
  }
}