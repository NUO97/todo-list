import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTask, deleteTask, getTask, updateTask } from '../api/tasks';
import type { Task } from '../api/types';
import { TaskForm, type TaskFormValues } from '../components/TaskForm';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;
    let cancelled = false;
    getTask(id)
      .then((result) => {
        if (!cancelled) setTask(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load task');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const handleSubmit = async (values: TaskFormValues) => {
    if (isNew) {
      await createTask({ title: values.title, description: values.description || undefined });
    } else if (id) {
      await updateTask(id, {
        title: values.title,
        description: values.description || undefined,
        completed: values.completed,
      });
    }
    navigate('/tasks');
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteTask(id);
    navigate('/tasks');
  };

  if (loading) {
    return (
      <main className="task-detail-page">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="task-detail-page">
        <p role="alert" className="form-error">
          {error}
        </p>
      </main>
    );
  }

  if (!isNew && !task) {
    return (
      <main className="task-detail-page">
        <p role="alert" className="form-error">
          Task not found
        </p>
      </main>
    );
  }

  return (
    <main className="task-detail-page">
      <button type="button" onClick={() => navigate('/tasks')} className="back-button">
        &larr; Back
      </button>
      <h1>{isNew ? 'New Task' : 'Edit Task'}</h1>
      <TaskForm
        initialTask={task ?? undefined}
        onSubmit={handleSubmit}
        submitLabel={isNew ? 'Create Task' : 'Save Changes'}
      />
      {!isNew && (
        <button type="button" onClick={handleDelete} className="delete-button danger">
          Delete Task
        </button>
      )}
    </main>
  );
}
