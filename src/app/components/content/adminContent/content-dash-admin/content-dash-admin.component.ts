import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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

export interface PeriodicElement {
  PROJECT: string;
  TOTAL: number;
  MERGED_TO_TEST: number;
  RESOLVED: number;
  TO_DO: number;
  ACTION: string;
  projectId: number;
  isExpanded: boolean;
  details?: any;
  activityChart?: ApexCharts;
}

@Component({
  selector: 'app-content-dash-admin',
  standalone: true,
  imports: [
    CommonModule,
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
  dashboardData?: DashboardData;
  displayedColumns: string[] = ['PROJECT', 'TOTAL', 'MERGED_TO_TEST', 'RESOLVED', 'TO_DO', 'ACTION'];
  dataSource: PeriodicElement[] = [];
  private lineChart?: ApexCharts;
  private donutChart?: ApexCharts;
  isLoading = false;
  error: string | null = null;

  get completionRateClass(): string {
    const rate = this.dashboardData?.projectPerformance?.completionRate;
    return rate ? (rate > 0 ? 'text-green-500' : 'text-red-500') : '';
  }

  getToDoCount(): number {
    return this.dashboardData?.teamPerformance?.overallStats?.find(stat => stat.status === 'TO_DO')?.count || 0;
  }
  // Helper methods for the template
  getMergedToTestCount(): number {
    return this.dashboardData?.teamPerformance?.overallStats?.find(stat => stat.status === 'MERGED_TO_TEST')?.count || 0;
  }
  getInProgressCount(): number {
    return this.dashboardData?.teamPerformance?.overallStats?.find(stat => stat.status === 'IN_PROGRESS')?.count || 0;
  }
  getResolvedCount(): number {
    return this.dashboardData?.teamPerformance?.overallStats?.find(stat => stat.status === 'RESOLVED')?.count || 0;
  }

  getAverageResolutionTime(status: string): number {
    return this.dashboardData?.teamPerformance?.overallStats?.find(stat => stat.status === status)?.avgResolutionTime || 0;
  }

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
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

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.dashboardService.getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.updateTableData();
          setTimeout(() => {
            this.initLineChart();
            this.initDonutChart();
          }, 100);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.error = 'Failed to load dashboard data. Please try again later.';
          this.isLoading = false;
        }
      });
  }

  private updateTableData(): void {
    if (!this.dashboardData) return;

    const getStatusCountForProject = (projectId: number, status: string) => {
      return this.dashboardData?.teamPerformance?.overallStats?.find(stat => stat.status === status)?.count || 0;
    };

    this.dataSource = this.dashboardData.projectHealth.projectHealthStats.map(project => ({
      PROJECT: `Project ${project.projectId}`,
      TOTAL: project.errorCount,
      MERGED_TO_TEST: getStatusCountForProject(project.projectId, 'MERGED_TO_TEST'),
      RESOLVED: getStatusCountForProject(project.projectId, 'RESOLVED'),
      TO_DO: getStatusCountForProject(project.projectId, 'TO_DO'),
      ACTION: project.projectId.toString(),
      projectId: project.projectId,
      isExpanded: false
    }));
  }

  private initLineChart(): void {
    if (!this.dashboardData) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Process activity trends data
    const activityTrends = this.dashboardData.projectHealth.activityTrends;
    const dates = activityTrends.map(trend => new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const activityCounts = activityTrends.map(trend => trend.count);

    // Process error trends data
    const errorTrends = this.dashboardData.qualityMetrics.errorTrends;
    const errorCounts = errorTrends.map(trend => trend.count);

    const chartOptions = {
      series: [
        {
          name: 'Project Activity',
          data: activityCounts,
          type: 'area',
        },
        {
          name: 'Error Count',
          data: errorCounts,
          type: 'line',
        },
      ],
      chart: {
        height: 320,
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

    if (this.lineChart) {
      this.lineChart.destroy();
    }

    this.lineChart = new ApexCharts(document.querySelector('#chartOne'), chartOptions);
    this.lineChart.render();
  }

  private initDonutChart(): void {
    if (!this.dashboardData) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Process error distribution data
    const errorTypes = this.dashboardData.qualityMetrics.errorsByType;
    const labels = errorTypes.map(error => error.type);
    const series = errorTypes.map(error => error.count);

    const donutOptions = {
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
                  return val
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
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
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
          radius: 12,
        }
      }
    };

    if (this.donutChart) {
      this.donutChart.destroy();
    }

    this.donutChart = new ApexCharts(document.querySelector('#donutChart'), donutOptions);
    this.donutChart.render();
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  exportData(): void {
    // Implementation for data export
    console.log('Exporting dashboard data...');
  }

  filterByProject(projectId: string): void {
    // Implementation for project filtering
    console.log('Filtering by project:', projectId);
  }

  filterByTimeRange(range: string): void {
    // Implementation for time range filtering
    console.log('Filtering by time range:', range);
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