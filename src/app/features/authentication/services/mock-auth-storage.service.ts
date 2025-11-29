import { inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE } from '~core/providers/local-storage';
import type { User } from '~features/authentication/types/user.type';
import { Language } from '~core/enums/language.enum';

const USERS_STORAGE_KEY = 'mock-users';
const DEFAULT_LANGUAGE = Language.EN_US;

interface StoredUser {
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  language: Language;
  id: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class MockAuthStorageService {
  private readonly storageService = inject(LOCAL_STORAGE);

  registerUser(email: string, password: string, name: string, language: Language = DEFAULT_LANGUAGE): User {
    const users = this.getAllUsers();
    
    // Check if user already exists
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already exists');
    }

    const newUser: StoredUser = {
      email: email.toLowerCase(),
      password, // In production, hash this!
      name,
      language,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    return this.storedUserToUser(newUser);
  }

  loginUser(email: string, password: string): User | null {
    const users = this.getAllUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    if (!user) {
      return null;
    }

    return this.storedUserToUser(user);
  }

  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === id);
    return user ? this.storedUserToUser(user) : null;
  }

  // Accept both `name` and `username` keys so client and server naming
  // mismatches don't break mock updates.
  updateUser(id: string, updates: { name?: string; username?: string; language?: Language }): User | null {
    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return null;
    }

    // Normalize username -> name for stored users
    const applied = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.username) {
      applied.name = updates.username;
    }

    users[userIndex] = applied;

    this.saveUsers(users);
    return this.storedUserToUser(users[userIndex]);
  }

  private getAllUsers(): StoredUser[] {
    try {
      const stored = this.storageService?.getItem(USERS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as StoredUser[];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]): void {
    try {
      this.storageService?.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Storage might be full
    }
  }

  private storedUserToUser(stored: StoredUser): User {
    return {
      id: stored.id,
      email: stored.email,
      name: stored.name,
      language: stored.language,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

