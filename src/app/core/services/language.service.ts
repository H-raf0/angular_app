import { DOCUMENT, inject, Injectable, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Language } from '~core/enums/language.enum';
import { Locale } from '~core/enums/locale.enum';
import { DEFAULT_LOCALE } from '~core/constants/language.constants';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly localeId = inject(LOCALE_ID);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  convertLocaleToAcceptLanguage(): Language {
    if (this.localeId === (Locale.FR as string)) {
      return Language.FR_FR;
    }
    return Language.EN_US;
  }

  navigateWithUserLanguage(language: Language, pathToRedirect: string) {
    if (this.doesLocaleMatchLanguage(language)) {
      void this.router.navigate([pathToRedirect]).then(() => {
        // eslint-disable-next-line promise/always-return
        this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      const localeToRedirect = this.getLocaleFromLanguage(language);
      window.location.href =
        localeToRedirect === DEFAULT_LOCALE
          ? pathToRedirect
          : `/${localeToRedirect}${pathToRedirect}`;
    }
  }

  private doesLocaleMatchLanguage(language: Language) {
    if (this.localeId === (Locale.FR as string)) {
      return language === Language.FR_FR;
    }
    return language === Language.EN_US;
  }

  private getLocaleFromLanguage(language: Language): Locale {
    if (language === Language.FR_FR) {
      return Locale.FR;
    }
    return DEFAULT_LOCALE;
  }
}
