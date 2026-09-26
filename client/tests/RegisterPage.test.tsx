import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import RegisterPage from '../src/pages/RegisterPage';

const register = vi.fn(async (email: string, _password: string) => ({
  token: 'test-token',
  user: { id: 'user-1', email },
}));

vi.mock('../src/api/auth', () => ({
  login: vi.fn(),
  register: (email: string, password: string) => register(email, password),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/tasks" element={<div>Tasks List Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    register.mockClear();
  });

  it('signs up and navigates to the task list on success', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'grace@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(register).toHaveBeenCalledWith('grace@example.com', 'password123');
    expect(await screen.findByText('Tasks List Page')).toBeInTheDocument();
    expect(localStorage.getItem('todo-auth')).toContain('grace@example.com');
  });

  it('shows an error and stays on the page when registration fails', async () => {
    const user = userEvent.setup();
    register.mockRejectedValueOnce(new Error('Email is already registered'));
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'grace@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
  });

  it('links to the login page', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('link', { name: 'Log in' }));

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
