import { randomUUID } from 'node:crypto';
import type { Db } from '../db';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/tasks.schema';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export class ReorderMismatchError extends Error {
  constructor() {
    super('orderedIds must contain exactly the caller\'s current task ids');
  }
}

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: Boolean(row.completed),
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function createTasksService(db: Db) {
  const findRow = (userId: string, taskId: string): TaskRow | undefined =>
    db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(taskId, userId) as TaskRow | undefined;

  return {
    list(userId: string, search?: string): Task[] {
      const rows = search
        ? (db
            .prepare(
              `SELECT * FROM tasks WHERE user_id = ?
               AND (title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')
               ORDER BY position ASC`,
            )
            .all(
              userId,
              `%${escapeLike(search)}%`,
              `%${escapeLike(search)}%`,
            ) as TaskRow[])
        : (db
            .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC')
            .all(userId) as TaskRow[]);

      return rows.map(toTask);
    },

    get(userId: string, taskId: string): Task | null {
      const row = findRow(userId, taskId);
      return row ? toTask(row) : null;
    },

    create(userId: string, input: CreateTaskInput): Task {
      const { max } = db
        .prepare('SELECT MAX(position) as max FROM tasks WHERE user_id = ?')
        .get(userId) as { max: number | null };

      const id = randomUUID();
      const now = new Date().toISOString();
      const position = (max ?? -1) + 1;

      db.prepare(
        `INSERT INTO tasks (id, user_id, title, description, completed, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      ).run(id, userId, input.title, input.description ?? null, position, now, now);

      return toTask(findRow(userId, id) as TaskRow);
    },

    update(userId: string, taskId: string, input: UpdateTaskInput): Task | null {
      if (!findRow(userId, taskId)) {
        return null;
      }
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE tasks SET title = ?, description = ?, completed = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      ).run(input.title, input.description ?? null, input.completed ? 1 : 0, now, taskId, userId);

      return toTask(findRow(userId, taskId) as TaskRow);
    },

    remove(userId: string, taskId: string): boolean {
      const result = db
        .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
        .run(taskId, userId);
      return result.changes > 0;
    },

    reorder(userId: string, orderedIds: string[]): Task[] {
      const current = db
        .prepare('SELECT id FROM tasks WHERE user_id = ?')
        .all(userId) as { id: string }[];
      const currentIds = new Set(current.map((row) => row.id));

      const sameMembers =
        orderedIds.length === currentIds.size && orderedIds.every((id) => currentIds.has(id));
      if (!sameMembers) {
        throw new ReorderMismatchError();
      }

      const now = new Date().toISOString();
      const update = db.prepare(
        'UPDATE tasks SET position = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      );
      const applyAll = db.transaction((ids: string[]) => {
        ids.forEach((id, index) => update.run(index, now, id, userId));
      });
      applyAll(orderedIds);

      return this.list(userId);
    },
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export type TasksService = ReturnType<typeof createTasksService>;
