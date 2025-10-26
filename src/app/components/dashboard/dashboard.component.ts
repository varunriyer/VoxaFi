import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BudgetService, Transaction } from '../../services/budget.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  totalIncome: number = 0;
  totalExpense: number = 0;
  recentTransactions: Transaction[] = [];

  constructor(
    private budgetService: BudgetService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.firebaseService.currentUser$.subscribe(user => {
      if (user) {
        this.loadDashboardData(user.uid);
      } else {
        // Reset data when not logged in
        this.totalIncome = 0;
        this.totalExpense = 0;
        this.recentTransactions = [];
      }
    });
  }

  loadDashboardData(userId: string): void {
    // Get current month and year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get monthly totals
    this.budgetService.getMonthlyTotals(userId, currentYear, currentMonth)
      .subscribe(totals => {
        this.totalIncome = totals.income;
        this.totalExpense = totals.expense;
      });

    // Get recent transactions
    this.budgetService.getTransactions(userId)
      .subscribe(transactions => {
        // Sort by date (newest first) and take the 5 most recent
        this.recentTransactions = transactions
          .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);
      });
  }
}
