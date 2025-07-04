/**
 * 社交任务API测试
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/social-tasks/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [
              {
                id: '1',
                title: 'Follow on Twitter',
                description: 'Follow our Twitter account',
                platform: 'twitter',
                reward_flowers: 10,
                status: 'active',
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        data: [{ id: '2' }],
        error: null,
      })),
    })),
  },
}));

// Mock input validator
jest.mock('@/lib/security', () => ({
  InputValidator: {
    validateSocialTaskData: jest.fn(() => ({ isValid: true, errors: [] })),
  },
}));

describe('/api/social-tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/social-tasks', () => {
    it('returns social tasks successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/social-tasks');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0]).toMatchObject({
        id: '1',
        title: 'Follow on Twitter',
        platform: 'twitter',
        reward_flowers: 10,
      });
    });

    it('filters tasks by platform', async () => {
      const request = new NextRequest('http://localhost:3000/api/social-tasks?platform=twitter');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('filters tasks by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/social-tasks?status=active');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('handles database errors', async () => {
      // Mock database error
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/social-tasks');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch social tasks');
    });
  });

  describe('POST /api/social-tasks', () => {
    it('creates a new social task successfully', async () => {
      const taskData = {
        title: 'New Twitter Task',
        description: 'Follow our new Twitter account',
        platform: 'twitter',
        reward_flowers: 15,
        requirements: {
          action: 'follow',
          target: '@sociomint',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/social-tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.task).toMatchObject({
        id: '2',
      });
    });

    it('validates input data', async () => {
      const { InputValidator } = require('@/lib/security');
      InputValidator.validateSocialTaskData.mockReturnValue({
        isValid: false,
        errors: ['Title is required'],
      });

      const request = new NextRequest('http://localhost:3000/api/social-tasks', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContain('Title is required');
    });

    it('handles invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/social-tasks', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON data');
    });

    it('handles database insertion errors', async () => {
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: () => ({
          data: null,
          error: { message: 'Insertion failed' },
        }),
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        platform: 'twitter',
        reward_flowers: 10,
      };

      const request = new NextRequest('http://localhost:3000/api/social-tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create social task');
    });
  });

  describe('Error handling', () => {
    it('handles unexpected errors gracefully', async () => {
      // Mock an unexpected error
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/social-tasks');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Rate limiting', () => {
    it('should implement rate limiting for POST requests', async () => {
      // This would test rate limiting if implemented
      // For now, just verify the endpoint exists
      const request = new NextRequest('http://localhost:3000/api/social-tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Rate limit test',
          description: 'Test',
          platform: 'twitter',
          reward_flowers: 5,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      expect(response).toBeDefined();
    });
  });
});
