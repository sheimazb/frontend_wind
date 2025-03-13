import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectService, Project } from '../../../../services/project.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ApexCharts from 'apexcharts';

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
    MatTooltipModule
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

  @ViewChildren('chartContainer') chartContainers!: QueryList<ElementRef>;

  constructor(
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    // Wait for projects to load before initializing charts
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
        this.isLoading = false;
        // Initialize charts after projects are loaded
        setTimeout(() => {
          this.initializeCharts();
        }, 0);
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
    // Destroy existing charts first
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};

    this.chartContainers.forEach((container, index) => {
      if (this.filteredProjects[index]) {
        const project = this.filteredProjects[index];
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
          colors: ["#E1567C", "#9F3996"],
          fill: {
            type: 'gradient',
            gradient: {
              type: "vertical",
              shadeIntensity: 0.5,
              gradientToColors: ["#F87EA1", "#C15DB5"],
              inverseColors: false,
              opacityFrom: 0.9,
              opacityTo: 0.6,
            },
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

        const chart = new ApexCharts(container.nativeElement, chartOptions);
        this.charts[project.id!] = chart;
        chart.render();
      }
    });
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
}

