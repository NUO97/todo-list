import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

vi.mock('../src/api/auth', () => ({
  login: vi.fn(async (email: string) => ({
    token: 'test-token',
    user: { id: 'user-1', email },
  })),
  register: vi.fn(async (email: string) => ({
    token: 'test-token',
    user: { id: 'user-1', email },
  })),
}));

function TestConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p>{isAuthenticated ? `Logged in as ${user?.email}` : 'Logged out'}</p>
      <button onClick={() => login('ada@example.com', 'password123')}>Log in</button>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists the session to localStorage after login and clears it on logout', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('Logged out')).toBeInTheDocument();

    await user.click(screen.getByText('Log in'));

    await waitFor(() => {
      expect(screen.getByText('Logged in as ada@example.com')).toBeInTheDocument();
    });
    expect(localStorage.getItem('todo-auth')).toContain('ada@example.com');

    await user.click(screen.getByText('Log out'));

    expect(screen.getByText('Logged out')).toBeInTheDocument();
    expect(localStorage.getItem('todo-auth')).toBeNull();
  });

  it('restores a session from localStorage on mount', async () => {
    localStorage.setItem(
      'todo-auth',
      JSON.stringify({ token: 'stored-token', user: { id: 'user-2', email: 'grace@example.com' } }),
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Logged in as grace@example.com')).toBeInTheDocument();
    });
  });
});
