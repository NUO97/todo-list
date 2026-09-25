import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import { createTaskSchema, reorderTasksSchema, updateTaskSchema } from '../schemas/tasks.schema';
import { ReorderMismatchError, type TasksService } from '../services/tasks.service';

export function createTasksRouter(tasksService: TasksService): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      res.json(tasksService.list(res.locals.userId, search));
    }),
  );

  router.post(
    '/',
    validateBody(createTaskSchema),
    asyncHandler(async (req, res) => {
      const task = tasksService.create(res.locals.userId, req.body);
      res.status(201).json(task);
    }),
  );

  router.patch(
    '/reorder',
    validateBody(reorderTasksSchema),
    asyncHandler(async (req, res) => {
      try {
        const tasks = tasksService.reorder(res.locals.userId, req.body.orderedIds);
        res.json(tasks);
      } catch (err) {
        if (err instanceof ReorderMismatchError) {
          res.status(400).json({ error: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const task = tasksService.get(res.locals.userId, req.params.id);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json(task);
    }),
  );

  router.put(
    '/:id',
    validateBody(updateTaskSchema),
    asyncHandler(async (req, res) => {
      const task = tasksService.update(res.locals.userId, req.params.id, req.body);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json(task);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const deleted = tasksService.remove(res.locals.userId, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.status(204).send();
    }),
  );

  return router;
}
