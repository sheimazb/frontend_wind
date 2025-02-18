import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import ApexCharts from 'apexcharts'; 
import {MatTableModule} from '@angular/material/table';
import {diAngularOriginal,diSpringOriginal} from '@ng-icons/devicon/original';
import { NgIcon, provideIcons } from '@ng-icons/core';
export interface PeriodicElement {
  PROJECT: string;
  TOTAL: number;
  ACCEPTED: number;
  FILTRED: number;
  INVALID: number;
  ACTION:string;

}

const ELEMENT_DATA: PeriodicElement[] = [
  { PROJECT: 'PFE Project', TOTAL: 5,ACCEPTED:0, FILTRED: 0,INVALID:0,ACTION:'2'},
  { PROJECT: 'Daycure', TOTAL: 5,ACCEPTED:0, FILTRED: 0,INVALID:0,ACTION:'2'},
  { PROJECT: 'WindERP', TOTAL: 5,ACCEPTED:0, FILTRED: 0,INVALID:0,ACTION:'2'},

 
 
];

@Component({
  selector: 'app-content-dash-admin',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, MatTableModule,NgIcon ],
  templateUrl: './content-dash-admin.component.html',
  styleUrl: './content-dash-admin.component.css',
  viewProviders: [provideIcons({ diAngularOriginal,diSpringOriginal })]
})
export class ContentDashAdminComponent implements OnInit {

  ngOnInit(): void {
    this.initChart();
  }

  initChart(): void {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const chartOneOptions = {
      series: [
        {
          name: 'Product One',
          data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45],
        },
        {
          name: 'Product Two',
          data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51],
        },
      ],
      legend: {
        show: false,
        position: 'top',
        horizontalAlign: 'left',
      },
      colors: ['#3C50E0', '#80CAEE'],
      chart: {
        fontFamily: 'Satoshi, sans-serif',
        height: 335,
        type: 'area',
        dropShadow: {
          enabled: true,
          color: '#623CEA14',
          top: 10,
          blur: 4,
          left: 0,
          opacity: 0.1,
        },
        toolbar: {
          show: false,
        },
       
      },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            chart: {
              height: 300,
            },
          },
        },
        {
          breakpoint: 1366,
          options: {
            chart: {
              height: 350,
            },
          },
        },
      ],
      stroke: {
        width: [2, 2],
        curve: 'straight',
      },
      markers: {
        size: 4,
        colors: '#fff',
        strokeColors: ['#3056D3', '#80CAEE'],
        strokeWidth: 3,
        strokeOpacity: 0.9,
        strokeDashArray: 0,
        fillOpacity: 1,
        discrete: [],
        hover: {
          size: undefined,
          sizeOffset: 5,
        },
      },
      labels: {
        show: false,
        position: 'top',
      },
      grid: {
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        type: 'category',
        categories: [
          'Sep',
          'Oct',
          'Nov',
          'Dec',
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
        ],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: isDarkMode ? '#ffffff' : '#3056D3'
          }
        }
      },
      yaxis: {
        title: {
          style: {
            fontSize: '0px',
          },
        },
        min: 0,
        max: 100,
        labels: {
          style: {
            colors: isDarkMode ? '#ffffff' : '#3056D3'
          }
        }
      },
    };
  
    const chartSelector = document.querySelector('#chartOne');
    if (chartSelector) {
      const chartOne = new ApexCharts(chartSelector, chartOneOptions);
      chartOne.render();
    }
  }
        
  displayedColumns: string[] = ['PROJECT', 'TOTAL', 'ACCEPTED', 'FILTRED', 'INVALID', 'ACTION'];
  dataSource = ELEMENT_DATA;
  
  
}
