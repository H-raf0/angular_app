import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, merge } from 'rxjs';
import { AUTH_URLS, TODO_URLS } from '~core/constants/urls.constants';
import { emailValidator } from '~shared/validators/email.validator';
import { passwordValidator } from '~shared/validators/password.validator';
import { SlInputIconFocusDirective } from '~shared/directives/sl-input-icon-focus.directive';
import { AppSlCheckboxControlDirective } from '~shared/directives/sl-checkbox-control.directive';
import { LowercaseDirective } from '~shared/directives/lowercase.directive';
import { TrimDirective } from '~shared/directives/trim.directive';
import { AlertService } from '~core/services/ui/alert.service';
import { AuthenticationService } from '../../services/authentication.service';
import type {
  RegisterFormGroup,
  RegisterFormState,
  RegisterFormValue,
} from './register-form.types';
import { translations } from '~locale/translations';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

@Component({
  selector: 'app-register',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    SlInputIconFocusDirective,
    AppSlCheckboxControlDirective,
    LowercaseDirective,
    TrimDirective,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegisterComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  readonly translations = translations;
  readonly authUrls = AUTH_URLS;
  readonly registerForm = this.createRegisterForm();
  readonly formControls = {
    username: this.registerForm.controls.username,
    email: this.registerForm.controls.email,
    password: this.registerForm.controls.password,
    confirmPassword: this.registerForm.controls.confirmPassword,
    terms: this.registerForm.controls.terms,
  };
  readonly formState = signal<RegisterFormState>({
    isLoading: false,
    isSubmitted: false,
    isRegistrationCompleted: false,
    passwordsMatch: false,
  });

  ngOnInit() {
    merge(this.formControls.password.valueChanges, this.formControls.confirmPassword.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkPasswords();
      });
  }

  sendForm(): void {
    this.updateFormState({ isSubmitted: true });

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.updateFormState({ isLoading: true });

    const formValue = this.registerForm.getRawValue();
    const { confirmPassword, ...registerData } = formValue;

    this.authService
      .register(registerData as RegisterFormValue)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.handleRegistrationError();
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.handleRegistrationSuccess();
      });
  }

  private createRegisterForm(): RegisterFormGroup {
    return this.formBuilder.group({
      username: new FormControl<string>('', {
        validators: [Validators.required, Validators.minLength(2)],
        nonNullable: true,
      }),
      email: new FormControl<string>('', {
        validators: [Validators.required, Validators.minLength(4), emailValidator()],
        nonNullable: true,
      }),
      password: new FormControl<string>('', {
        validators: [Validators.required, passwordValidator()],
        updateOn: 'change',
        nonNullable: true,
      }),
      confirmPassword: new FormControl<string>('', {
        validators: [Validators.required, passwordValidator()],
        updateOn: 'change',
        nonNullable: true,
      }),
      terms: new FormControl<boolean | null>(null, {
        validators: [Validators.requiredTrue],
      }),
    });
  }

  private checkPasswords(): void {
    if (this.formControls.password.value === this.formControls.confirmPassword.value) {
      this.updateFormState({ passwordsMatch: true });
      this.formControls.confirmPassword.setErrors(null);
    } else {
      this.updateFormState({
        passwordsMatch: false,
      });
      this.formControls.confirmPassword.setErrors({ notEqual: true });
    }
  }

  private handleRegistrationSuccess() {
    this.updateFormState({ isRegistrationCompleted: true });
    setTimeout(() => {
      void this.router.navigate([TODO_URLS.list]);
    }, 1000);
  }

  private handleRegistrationError(): void {
    this.alertService.createErrorAlert(translations.genericErrorAlert);
    this.updateFormState({ isLoading: false });
  }

  private updateFormState(updates: Partial<RegisterFormState>): void {
    this.formState.update((state) => ({ ...state, ...updates }));
  }
}
