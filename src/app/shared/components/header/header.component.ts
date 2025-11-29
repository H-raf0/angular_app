import type { ElementRef, Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { AuthenticationService } from '~features/authentication/services/authentication.service';
import { LanguageSelectorComponent } from '~shared/components/language-selector/language-selector.component';
import { ThemeButtonComponent } from '~shared/components/theme-button/theme-button.component';
import { translations } from '~locale/translations';
import { AUTH_URLS, ROOT_URLS, TODO_URLS } from '~core/constants/urls.constants';
import type { SlDropdown } from '@shoelace-style/shoelace';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
    NgTemplateOutlet,
    LanguageSelectorComponent,
    ThemeButtonComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);

  readonly TODO_URLS = TODO_URLS;
  readonly ROOT_URLS = ROOT_URLS;
  readonly AUTH_URLS = AUTH_URLS;
  readonly translations = translations;

  readonly avatarDropdown: Signal<ElementRef<SlDropdown> | undefined> = viewChild('avatarDropdown');
  readonly menuOpen = signal(false);

  readonly isUserLoggedIn = computed(() => this.authService.authState().isLoggedIn);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    // If a focusable element inside the dropdown currently has focus,
    // blur it before hiding the dropdown so we don't hide a focused element
    // (which causes accessibility errors). See WAI-ARIA guidance.
    try {
      const dropdownEl = this.avatarDropdown()?.nativeElement;
      const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      if (active && dropdownEl && dropdownEl.contains(active)) {
        active.blur();
      }
      void dropdownEl?.hide();
    } catch (err) {
      // swallow errors - we don't want hiding the menu to break on unexpected DOM issues
      // eslint-disable-next-line no-console
      console.warn('Error while closing avatar dropdown:', err);
      void this.avatarDropdown()?.nativeElement.hide();
    }

    this.menuOpen.set(false);
  }

  logOutUser(): void {
    this.closeMenu();
    this.authService.logOut();
    void this.router.navigate([ROOT_URLS.home]);
  }
}
