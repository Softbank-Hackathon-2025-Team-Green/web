import { FunctionMetadata } from '@/types/function';

/**
 * Storage utilities for function data
 * In production, these would use DynamoDB and S3
 */

export const storage = {
  /**
   * Get all functions for a user
   */
  async getFunctions(userId: string = 'default-user'): Promise<FunctionMetadata[]> {
    try {
      const response = await fetch(`/api/functions/list?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching functions:', error);
      return [];
    }
  },

  /**
   * Get a single function by ID
   */
  async getFunction(functionId: string): Promise<FunctionMetadata | null> {
    try {
      const response = await fetch(`/api/functions/get?id=${functionId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching function:', error);
      return null;
    }
  },

  /**
   * Create a new function
   */
  async createFunction(data: Partial<FunctionMetadata> & { code: string }): Promise<{ id: string; success: boolean }> {
    const response = await fetch('/api/functions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  /**
   * Update an existing function
   */
  async updateFunction(functionId: string, data: Partial<FunctionMetadata> & { code?: string }): Promise<boolean> {
    try {
      const response = await fetch('/api/functions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId, ...data }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating function:', error);
      return false;
    }
  },

  /**
   * Delete a function
   */
  async deleteFunction(functionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/functions/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting function:', error);
      return false;
    }
  },
};

/**
 * Function deployment and execution utilities
 */
export const functionOps = {
  /**
   * Deploy a function to AWS Lambda
   */
  async deploy(functionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/functions/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deploying function:', error);
      return false;
    }
  },

  /**
   * Run a function for testing
   */
  async run(functionId: string, input?: unknown): Promise<unknown> {
    try {
      const response = await fetch('/api/functions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId, input }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error running function:', error);
      return null;
    }
  },

  /**
   * Check code for vulnerabilities
   */
  async checkVulnerabilities(functionId: string) {
    try {
      const response = await fetch('/api/functions/vulnerability-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error checking vulnerabilities:', error);
      return null;
    }
  },
};
