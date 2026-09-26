import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TaskDetailPage from '../src/pages/TaskDetailPage';

const existingTask = {
  id: 'task-1',
  title: 'Buy milk',
  description: 'Whole milk',
  completed: false,
  position: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const getTask = vi.fn(async (_id: string) => existingTask);
const createTask = vi.fn(async (input: { title: string; description?: string }) => ({
  ...existingTask,
  ...input,
  id: 'task-new',
}));
const updateTask = vi.fn(async (id: string, input: { title: string; completed: boolean }) => ({
  ...existingTask,
  ...input,
  id,
}));
const deleteTask = vi.fn(async (_id: string) => undefined);

vi.mock('../src/api/tasks', () => ({
  getTask: (id: string) => getTask(id),
  createTask: (input: unknown) => createTask(input as { title: string; description?: string }),
  updateTask: (id: string, input: unknown) =>
    updateTask(id, input as { title: string; completed: boolean }),
  deleteTask: (id: string) => deleteTask(id),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tasks" element={<div>Tasks List Page</div>} />
        <Route path="/tasks/new" element={<TaskDetailPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    getTask.mockClear();
    createTask.mockClear();
    updateTask.mockClear();
    deleteTask.mockClear();
  });

  it('creates a task and navigates back to the list', async () => {
    const user = userEvent.setup();
    renderAt('/tasks/new');

    expect(screen.getByRole('heading', { name: 'New Task' })).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Title'), 'Read a book');
    await user.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(createTask).toHaveBeenCalledWith({ title: 'Read a book', description: undefined });
    expect(await screen.findByText('Tasks List Page')).toBeInTheDocument();
  });

  it('blocks submission client-side when the title is empty', async () => {
    const user = userEvent.setup();
    renderAt('/tasks/new');

    await user.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
    expect(createTask).not.toHaveBeenCalled();
  });

  it('loads and displays an existing task for editing', async () => {
    renderAt('/tasks/task-1');

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    expect(await screen.findByDisplayValue('Buy milk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Whole milk')).toBeInTheDocument();
    expect(screen.getByLabelText('Completed')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Delete Task' })).toBeInTheDocument();
  });

  it('submits an update and navigates back to the list', async () => {
    const user = userEvent.setup();
    renderAt('/tasks/task-1');

    await screen.findByDisplayValue('Buy milk');
    await user.click(screen.getByLabelText('Completed'));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(updateTask).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ title: 'Buy milk', completed: true }),
    );
    expect(await screen.findByText('Tasks List Page')).toBeInTheDocument();
  });

  it('shows an error instead of the form when loading the task fails', async () => {
    getTask.mockRejectedValueOnce(new Error('Task not found'));
    renderAt('/tasks/task-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Task not found');
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('deletes a task and navigates back to the list', async () => {
    const user = userEvent.setup();
    renderAt('/tasks/task-1');

    await screen.findByDisplayValue('Buy milk');
    await user.click(screen.getByRole('button', { name: 'Delete Task' }));

    expect(deleteTask).toHaveBeenCalledWith('task-1');
    expect(await screen.findByText('Tasks List Page')).toBeInTheDocument();
  });

  it('shows an error and keeps the task visible when deleting fails', async () => {
    const user = userEvent.setup();
    deleteTask.mockRejectedValueOnce(new Error('Unauthorized'));
    renderAt('/tasks/task-1');

    await screen.findByDisplayValue('Buy milk');
    await user.click(screen.getByRole('button', { name: 'Delete Task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unauthorized');
    expect(screen.getByDisplayValue('Buy milk')).toBeInTheDocument();
  });
});
