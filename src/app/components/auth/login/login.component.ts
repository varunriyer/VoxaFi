import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  messageSeverity: 'error' | 'info' = 'error';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async onLogin() {
    if (!this.email || !this.password) {
      this.messageSeverity = 'error';
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.messageSeverity = 'error';

    try {
      await this.firebaseService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to login. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async onForgotPassword() {
    if (!this.email) {
      this.messageSeverity = 'error';
      this.errorMessage = 'Please enter your email address first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.firebaseService.sendPasswordReset(this.email);
      this.messageSeverity = 'info';
      this.errorMessage = 'Password reset email sent (if account exists).';
    } catch (error: any) {
      this.messageSeverity = 'error';
      this.errorMessage = error.message || 'Failed to send password reset email.';
    } finally {
      this.isLoading = false;
    }
  }

  async onGoogleSignIn() {
    this.isLoading = true;
    this.errorMessage = '';
    this.messageSeverity = 'error';

    try {
      await this.firebaseService.googleSignInPopup();
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Google sign-in failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
