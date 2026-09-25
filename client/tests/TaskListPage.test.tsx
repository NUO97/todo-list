import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import TaskListPage from '../src/pages/TaskListPage';

const baseTasks = [
  {
    id: 'task-1',
    title: 'Buy milk',
    description: null,
    completed: false,
    position: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Walk the dog',
    description: null,
    completed: false,
    position: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const listTasks = vi.fn(async (search?: string) =>
  baseTasks.filter((task) => !search || task.title.toLowerCase().includes(search.toLowerCase())),
);
const deleteTask = vi.fn(async (_id: string) => undefined);
const updateTask = vi.fn(async (id: string, input: { title: string; completed: boolean }) => ({
  ...baseTasks.find((task) => task.id === id)!,
  ...input,
}));
const reorderTasks = vi.fn(async () => baseTasks);

vi.mock('../src/api/tasks', () => ({
  listTasks: (search?: string) => listTasks(search),
  deleteTask: (id: string) => deleteTask(id),
  updateTask: (id: string, input: unknown) => updateTask(id, input as { title: string; completed: boolean }),
  reorderTasks: () => reorderTasks(),
}));

function renderPage() {
  localStorage.setItem(
    'todo-auth',
    JSON.stringify({ token: 'test-token', user: { id: 'user-1', email: 'ada@example.com' } }),
  );
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TaskListPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('TaskListPage', () => {
  beforeEach(() => {
    localStorage.clear();
    listTasks.mockClear();
    deleteTask.mockClear();
    updateTask.mockClear();
  });

  it('renders the caller\'s tasks', async () => {
    renderPage();

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
  });

  it('filters tasks as the user types in the search box', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Buy milk');

    await user.type(screen.getByLabelText('Search tasks'), 'milk');

    await waitFor(() => {
      expect(listTasks).toHaveBeenLastCalledWith('milk');
    });
  });

  it('deletes a task when the delete button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Buy milk');
    await user.click(screen.getByLabelText('Delete Buy milk'));

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith('task-1');
    });
  });

  it('toggles completion when the checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Buy milk');
    await user.click(screen.getByLabelText('Mark Buy milk as complete'));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({ completed: true }));
    });
  });
});
