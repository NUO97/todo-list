import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteTask, listTasks, reorderTasks, updateTask } from '../api/tasks';
import type { Task } from '../api/types';
import { SearchBar } from '../components/SearchBar';
import { TaskItem } from '../components/TaskItem';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { arrayMove } from '../lib/arrayMove';

export default function TaskListPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadTasks = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await listTasks(term || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(debouncedSearch);
  }, [debouncedSearch, loadTasks]);

  const handleToggleComplete = async (task: Task) => {
    const updated = await updateTask(task.id, {
      title: task.title,
      description: task.description ?? undefined,
      completed: !task.completed,
    });
    setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleDelete = async (task: Task) => {
    await deleteTask(task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = tasks.findIndex((task) => task.id === active.id);
    const toIndex = tasks.findIndex((task) => task.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = arrayMove(tasks, fromIndex, toIndex);
    setTasks(reordered);
    try {
      await reorderTasks(reordered.map((task) => task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks');
      loadTasks(debouncedSearch);
    }
  };

  return (
    <main className="task-list-page">
      <header className="task-list-header">
        <h1>My Tasks</h1>
        <div className="user-bar">
          <span>{user?.email}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="task-list-controls">
        <SearchBar value={search} onChange={setSearch} />
        <Link to="/tasks/new" className="button-link">
          + New Task
        </Link>
      </div>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet. Create your first one!</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </main>
  );
}
