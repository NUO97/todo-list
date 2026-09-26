import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import LoginPage from '../src/pages/LoginPage';

const login = vi.fn(async (email: string, _password: string) => ({
  token: 'test-token',
  user: { id: 'user-1', email },
}));

vi.mock('../src/api/auth', () => ({
  login: (email: string, password: string) => login(email, password),
  register: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/tasks" element={<div>Tasks List Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    login.mockClear();
  });

  it('logs in and navigates to the task list on success', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(login).toHaveBeenCalledWith('ada@example.com', 'password123');
    expect(await screen.findByText('Tasks List Page')).toBeInTheDocument();
    expect(localStorage.getItem('todo-auth')).toContain('ada@example.com');
  });

  it('shows an error and stays on the page when login fails', async () => {
    const user = userEvent.setup();
    login.mockRejectedValueOnce(new Error('Invalid email or password'));
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('links to the sign up page', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('link', { name: 'Sign up' }));

    expect(await screen.findByText('Register Page')).toBeInTheDocument();
  });
});
