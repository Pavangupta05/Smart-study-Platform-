import { describe, it, expect, vi } from 'vitest';
import { tasksService } from '../../services/index';
import api from '../../services/api';

// Mock the axios instance used by services
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('tasksService', () => {
  it('getAll should return tasks', async () => {
    const mockTasks = [{ id: 1, text: 'Test Task', completed: false }];
    
    api.get.mockResolvedValueOnce({ data: { tasks: mockTasks } });

    const response = await tasksService.getAll();
    expect(response.data.tasks).toEqual(mockTasks);
    expect(api.get).toHaveBeenCalledWith('/tasks');
  });

  it('create should return the created task', async () => {
    const newTask = { id: 2, text: 'New Task', completed: false };
    
    api.post.mockResolvedValueOnce({ data: { task: newTask } });

    const response = await tasksService.create({ text: 'New Task' });
    expect(response.data.task).toEqual(newTask);
    expect(api.post).toHaveBeenCalledWith('/tasks', { text: 'New Task' });
  });
});
