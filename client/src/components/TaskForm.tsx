import { useState, type FormEvent } from 'react';
import type { Task } from '../api/types';

export interface TaskFormValues {
  title: string;
  description: string;
  completed: boolean;
}

interface TaskFormProps {
  initialTask?: Task;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  submitLabel: string;
}

export function TaskForm({ initialTask, onSubmit, submitLabel }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [completed, setCompleted] = useState(initialTask?.completed ?? false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), completed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <label htmlFor="task-title">Title</label>
      <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />

      <label htmlFor="task-description">Description</label>
      <textarea
        id="task-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={4}
      />

      {initialTask && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={completed}
            onChange={(event) => setCompleted(event.target.checked)}
          />
          Completed
        </label>
      )}

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  );
}
