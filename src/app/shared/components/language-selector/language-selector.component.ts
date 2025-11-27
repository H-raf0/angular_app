import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { LanguageService } from '~core/services/language.service';
import { Language } from '~core/enums/language.enum';
import { ROOT_URLS } from '~core/constants/urls.constants';

import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';

@Component({
  selector: 'app-language-selector',
  imports: [UpperCasePipe],
  templateUrl: './language-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LanguageSelectorComponent {
  private readonly languageService = inject(LanguageService);

  readonly router = inject(Router);
  readonly localeIdText = signal(this.languageService.convertLocaleToAcceptLanguage());

  switchLanguage(locale: string): void {
    const language = locale === 'fr-FR' ? Language.FR_FR : Language.EN_US;
    const pathToRedirect = this.router.url.replace(/^\/fr/, '') || ROOT_URLS.home;
    this.languageService.navigateWithUserLanguage(language, pathToRedirect);
  }
}
