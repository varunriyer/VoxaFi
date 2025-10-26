import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Observable, from, map } from 'rxjs';

export interface Transaction {
  id?: string;
  amount: number;
  description: string;
  category: string;
  date: Date | string;
  type: 'income' | 'expense';
  userId: string;
}

export interface Category {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly TRANSACTIONS_COLLECTION = 'transactions';
  private readonly CATEGORIES_COLLECTION = 'categories';

  constructor(private firebaseService: FirebaseService) {}

  // Transaction methods
  addTransaction(transaction: Transaction): Observable<string> {
    return from(this.firebaseService.addDocument(this.TRANSACTIONS_COLLECTION, {
      ...transaction,
      date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date
    }));
  }

  getTransactions(userId: string): Observable<Transaction[]> {
    return from(this.firebaseService.queryCollection(
      this.TRANSACTIONS_COLLECTION, 
      'userId', 
      '==', 
      userId
    )).pipe(
      map(transactions => transactions.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date)
      })))
    );
  }

  getTransactionsByMonth(userId: string, year: number, month: number): Observable<Transaction[]> {
    return this.getTransactions(userId).pipe(
      map(transactions => transactions.filter(transaction => {
        const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
        return date.getFullYear() === year && date.getMonth() === month;
      }))
    );
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<void> {
    if (transaction.date && transaction.date instanceof Date) {
      transaction.date = transaction.date.toISOString();
    }
    return from(this.firebaseService.updateDocument(this.TRANSACTIONS_COLLECTION, id, transaction));
  }

  deleteTransaction(id: string): Observable<void> {
    return from(this.firebaseService.deleteDocument(this.TRANSACTIONS_COLLECTION, id));
  }

  // Category methods
  addCategory(category: Category): Observable<string> {
    return from(this.firebaseService.addDocument(this.CATEGORIES_COLLECTION, category));
  }

  getCategories(userId: string): Observable<Category[]> {
    return from(this.firebaseService.queryCollection(
      this.CATEGORIES_COLLECTION, 
      'userId', 
      '==', 
      userId
    ));
  }

  updateCategory(id: string, category: Partial<Category>): Observable<void> {
    return from(this.firebaseService.updateDocument(this.CATEGORIES_COLLECTION, id, category));
  }

  deleteCategory(id: string): Observable<void> {
    return from(this.firebaseService.deleteDocument(this.CATEGORIES_COLLECTION, id));
  }

  // Analytics methods
  getMonthlyTotals(userId: string, year: number, month: number): Observable<{income: number, expense: number}> {
    return this.getTransactionsByMonth(userId, year, month).pipe(
      map(transactions => {
        const result = {income: 0, expense: 0};
        transactions.forEach(transaction => {
          if (transaction.type === 'income') {
            result.income += transaction.amount;
          } else {
            result.expense += transaction.amount;
          }
        });
        return result;
      })
    );
  }

  getCategoryTotals(userId: string, year: number, month: number): Observable<{[category: string]: number}> {
    return this.getTransactionsByMonth(userId, year, month).pipe(
      map(transactions => {
        const result: {[category: string]: number} = {};
        transactions.forEach(transaction => {
          if (transaction.type === 'expense') {
            if (!result[transaction.category]) {
              result[transaction.category] = 0;
            }
            result[transaction.category] += transaction.amount;
          }
        });
        return result;
      })
    );
  }
}