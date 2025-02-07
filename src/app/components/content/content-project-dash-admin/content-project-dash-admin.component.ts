import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import ApexCharts from 'apexcharts'; 
import { Router, RouterModule } from '@angular/router';
import {MatTooltipModule} from '@angular/material/tooltip';
@Component({
  selector: 'app-content-project-dash-admin',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  templateUrl: './content-project-dash-admin.component.html',
  styleUrls: ['./content-project-dash-admin.component.css']
})
export class ContentProjectDashAdminComponent implements OnInit, AfterViewInit {
  constructor(private router: Router) {}

  @ViewChild('chartTwoContainer', { static: false }) chartContainer!: ElementRef;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initChart();
  }
  initChart(): void {
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
      colors: ["#7D4FFE", "#DA919F"],
      chart: {
        type: "bar",
        height: 335,
        stacked: true,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        foreColor: '#64748B', // Couleur de texte par défaut pour le graphique
      },
      responsive: [
        {
          breakpoint: 1536,
          options: {
            plotOptions: {
              bar: {
                borderRadius: 0,
                columnWidth: "25%",
              },
            },
          },
        },
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 0,
          columnWidth: "25%",
          borderRadiusApplication: "end",
          borderRadiusWhenStacked: "last",
        },
      },
      dataLabels: {
        enabled: false,
        style: {
          colors: ['#64748B'] // Couleur du texte des étiquettes de données
        }
      },
      xaxis: {
        categories: ["M", "T", "W", "T", "F", "S", "S"],
        labels: {
          style: {
            colors: '#64748B' // Couleur du texte de l'axe X
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#64748B' // Couleur du texte de l'axe Y
          }
        }
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontFamily: "Satoshi",
        fontWeight: 500,
        fontSize: "14px",
        labels: {
          colors: '#64748B' // Couleur du texte de la légende
        },
        markers: {
          radius: 99,
        },
      },
      fill: {
        opacity: 1,
      },
    };
  
    if (this.chartContainer) {
      const chart = new ApexCharts(this.chartContainer.nativeElement, chartOptions);
      chart.render();
    }
  }   
  // Project Settings route
  onProjectSettingsClick() {
    this.router.navigate(['/dashboard/project-settings']);
  }
  onAddProjectClick() {
    this.router.navigate(['/dashboard/add-project']);
  }
}

