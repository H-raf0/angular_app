import { inject, Injectable, linkedSignal, signal } from '@angular/core';
import { of, delay, Observable } from 'rxjs';
import { LOCAL_STORAGE } from '~core/providers/local-storage';
import { LanguageService } from '~core/services/language.service';
import { clearCache } from '~core/interceptors/caching.interceptor';
import type { LoginRequest } from '~features/authentication/types/login-request.type';
import type {
  RefreshTokenResponseData,
} from '~features/authentication/types/refresh-token.response.type';
import type {
  RegisterResponseData,
} from '~features/authentication/types/register-response.type';
import type { RegisterFormValue } from '~features/authentication/pages/register/register-form.types';
import type { User } from '~features/authentication/types/user.type';
import type { AuthTokens } from '~features/authentication/types/authentication.types';
import { MockAuthStorageService } from './mock-auth-storage.service';
import { Language } from '~core/enums/language.enum';

export const ACCESS_TOKEN_KEY = 'access-token';
export const REFRESH_TOKEN_KEY = 'refresh-token';

// Mock mode - set to false when you have a real backend
const USE_MOCK_AUTH = true;

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly storageService = inject(LOCAL_STORAGE);
  private readonly languageService = inject(LanguageService);
  private readonly mockAuthStorage = inject(MockAuthStorageService);

  private readonly authTokens = signal<AuthTokens>({
    accessToken: this.storageService?.getItem(ACCESS_TOKEN_KEY) ?? undefined,
    refreshToken: this.storageService?.getItem(REFRESH_TOKEN_KEY) ?? undefined,
  });

  readonly authState = linkedSignal({
    source: this.authTokens,
    computation: (tokens) => ({
      isLoggedIn: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });

  register(registerRequest: RegisterFormValue): Observable<RegisterResponseData> {
    if (USE_MOCK_AUTH) {
      return this.mockRegister(registerRequest);
    }

    // Real backend code would go here
    throw new Error('Real backend not implemented yet');
  }

  logIn(loginRequest: LoginRequest): Observable<User> {
    if (USE_MOCK_AUTH) {
      return this.mockLogin(loginRequest);
    }

    // Real backend code would go here
    throw new Error('Real backend not implemented yet');
  }

  refreshToken(): Observable<RefreshTokenResponseData> {
    if (USE_MOCK_AUTH) {
      return this.mockRefreshToken();
    }

    // Real backend code would go here
    throw new Error('Real backend not implemented yet');
  }

  // Mock implementations
  private mockRegister(registerRequest: RegisterFormValue): Observable<RegisterResponseData> {
    return of(null).pipe(
      delay(500), // Simulate network delay
      () => {
        return new Observable<RegisterResponseData>((subscriber) => {
          try {
            const currentLanguage = this.languageService.convertLocaleToAcceptLanguage();
            const language = currentLanguage === Language.FR_FR
              ? Language.FR_FR
              : Language.EN_US;
            
            const user = this.mockAuthStorage.registerUser(
              registerRequest.email,
              registerRequest.password,
              registerRequest.name,
              language,
            );

            const tokens = this.generateMockTokens(user.id);
            const response: RegisterResponseData = {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              user,
            };

            this.saveTokens(tokens);
            subscriber.next(response);
            subscriber.complete();
          } catch (error) {
            subscriber.error({ 
              error: { 
                internalCode: 400, 
                message: error instanceof Error ? error.message : 'Registration failed' 
              } 
            });
          }
        });
      },
    );
  }

  private mockLogin(loginRequest: LoginRequest): Observable<User> {
    return of(null).pipe(
      delay(500), // Simulate network delay
      () => {
        return new Observable<User>((subscriber) => {
          const user = this.mockAuthStorage.loginUser(
            loginRequest.email,
            loginRequest.password,
          );

          if (!user) {
            subscriber.error({
              error: {
                internalCode: 401,
                message: 'Invalid credentials',
              },
            });
            return;
          }

          const tokens = this.generateMockTokens(user.id);
          this.saveTokens(tokens);
          subscriber.next(user);
          subscriber.complete();
        });
      },
    );
  }

  private mockRefreshToken(): Observable<RefreshTokenResponseData> {
    return of(null).pipe(
      delay(300),
      () => {
        return new Observable<RefreshTokenResponseData>((subscriber) => {
          const currentToken = this.storageService?.getItem(ACCESS_TOKEN_KEY);
          if (!currentToken) {
            subscriber.error({
              error: {
                internalCode: 401,
                message: 'No token to refresh',
              },
            });
            return;
          }

          // Extract user ID from token (simple mock)
          const userId = this.extractUserIdFromToken(currentToken);
          const newTokens = this.generateMockTokens(userId);
          
          const response: RefreshTokenResponseData = {
            accessToken: newTokens.accessToken,
          };

          this.saveTokens(newTokens);
          subscriber.next(response);
          subscriber.complete();
        });
      },
    );
  }

  private generateMockTokens(userId: string): { accessToken: string; refreshToken: string } {
    // Simple mock tokens - in production, use proper JWT
    const timestamp = Date.now();
    return {
      accessToken: `mock-access-token-${userId}-${timestamp}`,
      refreshToken: `mock-refresh-token-${userId}-${timestamp}`,
    };
  }

  private extractUserIdFromToken(token: string): string {
    // Extract user ID from mock token format: mock-access-token-{userId}-{timestamp}
    const parts = token.split('-');
    return parts[parts.length - 2] || 'unknown';
  }

  logOut() {
    clearCache();
    this.removeTokens();
  }


  private saveTokens({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken?: string;
  }): void {
    this.storageService?.setItem(ACCESS_TOKEN_KEY, accessToken);
    this.storageService?.setItem(REFRESH_TOKEN_KEY, refreshToken ?? '');
    this.authTokens.set({ accessToken, refreshToken });
  }

  private removeTokens(): void {
    this.storageService?.removeItem(ACCESS_TOKEN_KEY);
    this.storageService?.removeItem(REFRESH_TOKEN_KEY);
    this.authTokens.set({ accessToken: undefined, refreshToken: undefined });
  }
}
