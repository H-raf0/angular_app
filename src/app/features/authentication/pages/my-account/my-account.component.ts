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
import { RouterModule } from '@angular/router';
import { translations } from '~locale/translations';
import { UserService } from '~features/authentication/services/user.service';
import { Language } from '~core/enums/language.enum';
import { SlInputIconFocusDirective } from '~shared/directives/sl-input-icon-focus.directive';
import { AppSlSelectControlDirective } from '~shared/directives/sl-select-control.directive';
import { ThemeButtonComponent } from '~shared/components/theme-button/theme-button.component';
import { AlertService } from '~core/services/ui/alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '~core/services/language.service';
import { AUTH_URLS } from '~core/constants/urls.constants';
import type { User } from '~features/authentication/types/user.type';
import { SlInputUniqueIdDirective } from '~shared/directives/sl-input-unique-id.directive';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import { TrimDirective } from '~shared/directives/trim.directive';

@Component({
  selector: 'app-my-account',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    SlInputIconFocusDirective,
    AppSlSelectControlDirective,
    SlInputUniqueIdDirective,
    ThemeButtonComponent,
    TrimDirective,
  ],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MyAccountComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languageService = inject(LanguageService);

  readonly isButtonUpdateUserFormLoading = signal(false);

  translations = translations;
  user: User | undefined;
  name = new FormControl('', [Validators.required, Validators.minLength(2)]);
  email = new FormControl('');
  language = new FormControl<Language>(Language.EN_US, [Validators.required]);
  password = new FormControl('', [Validators.minLength(6)]);
  updateUserForm = this.formBuilder.group({
    name: this.name,
    language: this.language,
    email: this.email,
    password: this.password,
  });

  ngOnInit() {
    //this.email.disable();
    this.loadUserInfo();
  }

  loadUserInfo() {
    this.userService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user: User) => {
          this.user = user;
            // Guard against missing/null fields from the backend. Backend returns
            // `username` (or `username` as `username`/`Username` in JSON) while our
            // frontend `User` type uses `name`. Support both fields.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const returned = this.user as any;
            const resolvedName = returned.name ?? returned.username ?? '';

            this.name.setValue(resolvedName);
            this.email.setValue(returned.email ?? '');

            // Normalize language values that may come from backend (eg. "en_us" or "EN_US")
            const rawLang = returned.language as string | undefined | null;
            const normalize = (l?: string | null) => {
              if (!l) return Language.EN_US;
              const parts = l.split(/[-_]/);
              const lang = parts[0]?.toLowerCase() ?? 'en';
              const region = (parts[1] ?? '').toUpperCase();
              const normalized = region ? `${lang}-${region}` : `${lang}-US`;
              return normalized === Language.FR_FR ? Language.FR_FR : Language.EN_US;
            };

            this.language.setValue(normalize(rawLang));
        },
        error: () => {
          this.alertService.createErrorAlert(translations.genericErrorAlert);
        },
      });
  }

  sendForm() {
    this.updateUserForm.markAllAsTouched();
    if (this.updateUserForm.valid) {
      this.isButtonUpdateUserFormLoading.set(true);
      this.updateUser();
    }
  }

  updateUser() {
    const formValue = this.updateUserForm.getRawValue();
    this.userService
      .updateUser({
          // Backend expects `username` property
          username: formValue.name!,
          language: formValue.language!,
          password: formValue.password!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.createSuccessAlert(translations.myAccountSuccessAlert);
          this.languageService.navigateWithUserLanguage(formValue.language!, AUTH_URLS.myAccount);
          this.isButtonUpdateUserFormLoading.set(false);
        },
        error: () => {
          this.isButtonUpdateUserFormLoading.set(false);
          this.alertService.createErrorAlert(translations.genericErrorAlert);
        },
      });
  }
}
