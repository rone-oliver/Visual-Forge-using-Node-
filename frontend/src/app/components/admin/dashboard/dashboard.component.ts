import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { DashboardResponseDto, DashboardService } from '../../../services/admin/dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  imports: [BaseChartDirective, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  dashboardData: DashboardResponseDto | null = null;
  public userDoughnutChartData!: ChartData<'doughnut'>;
  public userDoughnutChartOptions: ChartConfiguration['options'];
  public quotationBarChartData!: ChartData<'bar'>;
  public quotationBarChartOptions: ChartConfiguration['options'];

  constructor(private dashboardService: DashboardService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe(data => {
      this.dashboardData = data;
      this.setupCharts();
    });
  }

  setupCharts(): void {
    if (!this.dashboardData) return;

    const adminPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--admin-color-primary').trim();
    const adminSecondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--admin-color-secondary').trim();

    // Doughnut chart for users and editors
    this.userDoughnutChartData = {
      labels: ['Users', 'Editors'],
      datasets: [
        {
          data: [this.dashboardData.totalUsers - this.dashboardData.totalEditors, this.dashboardData.totalEditors],
          backgroundColor: [adminPrimaryColor, adminSecondaryColor],
          hoverBackgroundColor: [adminPrimaryColor, adminSecondaryColor],
          borderColor: 'transparent'
        }
      ]
    };
    this.userDoughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }

    // Bar chart for quotations
    const quotationLabels = Object.keys(this.dashboardData.quotationsByStatus);
    const quotationData = Object.values(this.dashboardData.quotationsByStatus);

    this.quotationBarChartData = {
      labels: quotationLabels,
      datasets: [
        {
          data: quotationData,
          label: 'Quotations',
          backgroundColor: adminPrimaryColor,
          borderColor: 'transparent'
        }
      ]
    };

    this.quotationBarChartOptions = {
      responsive: true,
      scales: {
        x: {},
        y: {
          min: 0
        }
      },
      plugins: {
        legend: {
          display: false,
        }
      }
    };
  }

  calculatePercentage(value: number, total: number): string {
    if (total === 0) {
      return '0.00';
    }
    return ((value / total) * 100).toFixed(2);
  }

  getProgressBarWidth(value: number, total: number): number {
    if (total === 0) {
      return 0;
    }
    return (value / total) * 100;
  }
}
