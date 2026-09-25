import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { Task } from '../api/types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskItem({ task, onToggleComplete, onDelete }: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="task-item">
      <button
        type="button"
        className="drag-handle"
        aria-label={`Reorder ${task.title}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task)}
        aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <Link to={`/tasks/${task.id}`} className={task.completed ? 'task-title done' : 'task-title'}>
        {task.title}
      </Link>
      <button
        type="button"
        onClick={() => onDelete(task)}
        className="delete-button"
        aria-label={`Delete ${task.title}`}
      >
        Delete
      </button>
    </li>
  );
}
