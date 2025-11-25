import { inject, Injectable } from '@angular/core';
import { of, delay, Observable } from 'rxjs';
import type { UpdateUserRequest } from '~features/authentication/types/update-user-request.type';
import type { User } from '~features/authentication/types/user.type';
import { MockAuthStorageService } from './mock-auth-storage.service';
import { ACCESS_TOKEN_KEY } from './authentication.service';
import { LOCAL_STORAGE } from '~core/providers/local-storage';

// Mock mode - set to false when you have a real backend
const USE_MOCK_AUTH = true;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly mockAuthStorage = inject(MockAuthStorageService);
  private readonly storageService = inject(LOCAL_STORAGE);

  getMe(_options?: { cache?: boolean }): Observable<User> {
    if (USE_MOCK_AUTH) {
      return this.mockGetMe();
    }

    // Real backend code would go here
    throw new Error('Real backend not implemented yet');
  }

  updateUser(updateUserRequest: UpdateUserRequest): Observable<User> {
    if (USE_MOCK_AUTH) {
      return this.mockUpdateUser(updateUserRequest);
    }

    // Real backend code would go here
    throw new Error('Real backend not implemented yet');
  }

  private mockGetMe(): Observable<User> {
    return of(null).pipe(
      delay(300),
      () => {
        return new Observable<User>((subscriber) => {
          const token = this.storageService?.getItem(ACCESS_TOKEN_KEY);
          if (!token) {
            subscriber.error({
              error: {
                internalCode: 401,
                message: 'Not authenticated',
              },
            });
            return;
          }

          const userId = this.extractUserIdFromToken(token);
          const user = this.mockAuthStorage.getUserById(userId);

          if (!user) {
            subscriber.error({
              error: {
                internalCode: 404,
                message: 'User not found',
              },
            });
            return;
          }

          subscriber.next(user);
          subscriber.complete();
        });
      },
    );
  }

  private mockUpdateUser(updateUserRequest: UpdateUserRequest): Observable<User> {
    return of(null).pipe(
      delay(300),
      () => {
        return new Observable<User>((subscriber) => {
          const token = this.storageService?.getItem(ACCESS_TOKEN_KEY);
          if (!token) {
            subscriber.error({
              error: {
                internalCode: 401,
                message: 'Not authenticated',
              },
            });
            return;
          }

          const userId = this.extractUserIdFromToken(token);
          const updatedUser = this.mockAuthStorage.updateUser(userId, updateUserRequest);

          if (!updatedUser) {
            subscriber.error({
              error: {
                internalCode: 404,
                message: 'User not found',
              },
            });
            return;
          }

          subscriber.next(updatedUser);
          subscriber.complete();
        });
      },
    );
  }

  private extractUserIdFromToken(token: string): string {
    // Extract user ID from mock token format: mock-access-token-{userId}-{timestamp}
    const parts = token.split('-');
    return parts[parts.length - 2] || 'unknown';
  }
}
