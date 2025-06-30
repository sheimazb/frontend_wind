import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';

@Component({
  selector: 'app-pricing-component',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './pricing-component.component.html',
  styleUrl: './pricing-component.component.css'
})
export class PricingComponentComponent implements OnInit {
  
  ngOnInit() {
    // Dynamically load the Spline viewer script
    this.loadSplineScript();
  }

  private loadSplineScript() {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.10.2/build/spline-viewer.js';
    document.head.appendChild(script);
  }
}
