import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BudgetService } from '../../services/budget.service';
import { FirebaseService } from '../../services/firebase.service';
import { Subscription } from 'rxjs';

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
  type: 'income' | 'expense';
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  isSubmitting: boolean = false;
  errorMessage: string = '';

  newTransaction: Partial<Transaction> = {
    amount: undefined,
    description: '',
    category: '',
    date: '',
    type: 'expense'
  };

  private currentUserId: string | null = null;
  private transactionsSub: Subscription | null = null;

  constructor(
    private budgetService: BudgetService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.firebaseService.currentUser$.subscribe(user => {
      if (user && user.uid) {
        this.currentUserId = user.uid;
        this.loadTransactions(user.uid);
      } else {
        this.currentUserId = null;
        this.transactions = [];
        if (this.transactionsSub) {
          this.transactionsSub.unsubscribe();
          this.transactionsSub = null;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.transactionsSub) {
      this.transactionsSub.unsubscribe();
      this.transactionsSub = null;
    }
  }

  loadTransactions(userId: string) {
    if (this.transactionsSub) {
      this.transactionsSub.unsubscribe();
    }
    this.transactionsSub = this.budgetService.getTransactions(userId).subscribe({
      next: (data) => {
        this.transactions = data || [];
      },
      error: () => {
        this.errorMessage = 'Failed to load transactions.';
      }
    });
  }

  addTransaction() {
    if (!this.currentUserId) {
      this.errorMessage = 'Please log in to add transactions.';
      return;
    }

    if (!this.newTransaction.amount || !this.newTransaction.description || !this.newTransaction.category || !this.newTransaction.date || !this.newTransaction.type) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const tx: Transaction = {
      userId: this.currentUserId,
      amount: Number(this.newTransaction.amount),
      description: String(this.newTransaction.description),
      category: String(this.newTransaction.category),
      date: new Date(this.newTransaction.date as string),
      type: this.newTransaction.type as 'income' | 'expense'
    };

    this.budgetService.addTransaction(tx).subscribe({
      next: () => {
        this.newTransaction = { amount: undefined, description: '', category: '', date: '', type: 'expense' };
        this.isSubmitting = false;
        // No need to reload explicitly; subscription will reflect new state
      },
      error: (error: any) => {
        this.errorMessage = error?.message || 'Failed to add transaction.';
        this.isSubmitting = false;
      }
    });
  }
}
