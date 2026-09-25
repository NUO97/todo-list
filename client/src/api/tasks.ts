import { apiRequest } from './client';
import type { Task } from './types';

export interface TaskInput {
  title: string;
  description?: string;
}

export interface TaskUpdateInput extends TaskInput {
  completed: boolean;
}

export const listTasks = (search?: string): Promise<Task[]> =>
  apiRequest<Task[]>(`/tasks${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getTask = (id: string): Promise<Task> => apiRequest<Task>(`/tasks/${id}`);

export const createTask = (input: TaskInput): Promise<Task> =>
  apiRequest<Task>('/tasks', { method: 'POST', body: input });

export const updateTask = (id: string, input: TaskUpdateInput): Promise<Task> =>
  apiRequest<Task>(`/tasks/${id}`, { method: 'PUT', body: input });

export const deleteTask = (id: string): Promise<void> =>
  apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' });

export const reorderTasks = (orderedIds: string[]): Promise<Task[]> =>
  apiRequest<Task[]>('/tasks/reorder', { method: 'PATCH', body: { orderedIds } });
