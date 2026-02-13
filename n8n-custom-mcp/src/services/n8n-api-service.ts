import { n8nClient, webhookClient } from '../config/env.js';
import { handleApiError } from '../utils/error-handler.js';
import type {
  N8nWorkflow,
  N8nExecution,
  N8nCredential,
  N8nCredentialSchema,
  N8nNodeSchema
} from '../types/n8n-types.js';

/**
 * Service class wrapping n8n REST API v1
 * Handles all HTTP communication with n8n instance
 */
export class N8nApiService {
  private nodeSchemaCache = new Map<string, N8nNodeSchema>();
  private readonly MAX_CACHE_SIZE = 100;

  private validateWorkflowId(id: string): void {
    if (!id || id.trim() === '') {
      throw new Error('Workflow ID is required and cannot be empty');
    }
  }

  private validateWebhookPath(path: string): void {
    if (path.includes('..')) {
      throw new Error('Webhook path cannot contain ".."');
    }
    if (path.startsWith('/')) {
      throw new Error('Webhook path cannot start with "/"');
    }
  }

  private setCacheEntry(key: string, value: N8nNodeSchema): void {
    if (this.nodeSchemaCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.nodeSchemaCache.keys().next().value;
      if (firstKey !== undefined) {
        this.nodeSchemaCache.delete(firstKey);
      }
    }
    this.nodeSchemaCache.set(key, value);
  }

  // ===== WORKFLOW OPERATIONS =====

  async listWorkflows(params?: {
    active?: boolean;
    limit?: number;
    tags?: string;
  }): Promise<{ data: N8nWorkflow[] }> {
    try {
      const response = await n8nClient.get('/workflows', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to list workflows');
    }
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    this.validateWorkflowId(id);
    try {
      const response = await n8nClient.get(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to get workflow ${id}`);
    }
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    try {
      const response = await n8nClient.post('/workflows', workflow);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create workflow');
    }
  }

  private validateWorkflowUpdate(workflow: Partial<N8nWorkflow>): void {
    // Validate nodes array if provided
    if (workflow.nodes !== undefined) {
      if (!Array.isArray(workflow.nodes)) {
        throw new Error('Workflow nodes must be an array');
      }
      if (workflow.nodes.length === 0) {
        throw new Error('Workflow nodes array cannot be empty');
      }
    }

    // Validate name if provided
    if (workflow.name !== undefined && typeof workflow.name !== 'string') {
      throw new Error('Workflow name must be a string');
    }

    // Validate connections if provided
    if (workflow.connections !== undefined && typeof workflow.connections !== 'object') {
      throw new Error('Workflow connections must be an object');
    }
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    this.validateWorkflowId(id);
    this.validateWorkflowUpdate(workflow);
    try {
      const response = await n8nClient.put(`/workflows/${id}`, workflow);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to update workflow ${id}`);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    this.validateWorkflowId(id);
    try {
      await n8nClient.delete(`/workflows/${id}`);
    } catch (error) {
      throw handleApiError(error, `Failed to delete workflow ${id}`);
    }
  }

  async activateWorkflow(id: string, active: boolean): Promise<N8nWorkflow> {
    this.validateWorkflowId(id);
    try {
      const endpoint = active ? 'activate' : 'deactivate';
      const response = await n8nClient.post(`/workflows/${id}/${endpoint}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to ${active ? 'activate' : 'deactivate'} workflow ${id}`);
    }
  }

  // ===== EXECUTION OPERATIONS =====

  async listExecutions(params?: {
    workflowId?: string;
    status?: string;
    limit?: number;
    includeData?: boolean;
  }): Promise<{ data: N8nExecution[] }> {
    try {
      const response = await n8nClient.get('/executions', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to list executions');
    }
  }

  async getExecution(id: string): Promise<N8nExecution> {
    try {
      const response = await n8nClient.get(`/executions/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to get execution ${id}`);
    }
  }

  async executeWorkflow(id: string): Promise<any> {
    this.validateWorkflowId(id);

    // Strategy 1: Try direct execute API (may work in future n8n versions)
    try {
      const response = await n8nClient.post(`/workflows/${id}/execute`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 405) {
        throw handleApiError(error, `Failed to execute workflow ${id}`);
      }
      // 405 = n8n doesn't support this endpoint, try fallback strategies
    }

    // Strategy 2: Find webhook trigger node → activate → trigger via webhook
    try {
      const workflow = await this.getWorkflow(id);
      const webhookNode = workflow.nodes?.find(
        (n: any) => n.type === 'n8n-nodes-base.webhook' &&
          (!n.disabled)
      );

      if (webhookNode) {
        // Activate workflow if not already active
        if (!workflow.active) {
          await this.activateWorkflow(id, true);
          // Small delay for n8n to register the webhook
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Extract webhook path from node parameters
        const webhookPath = webhookNode.parameters?.path || (webhookNode as any).webhookId || id;
        const httpMethod = (webhookNode.parameters?.httpMethod || 'POST').toLowerCase();

        // Trigger the webhook
        const result = await this.triggerWebhook({
          path: webhookPath,
          method: httpMethod,
          body: { triggeredBy: 'mcp-execute-workflow', workflowId: id },
        });

        return {
          executionMethod: 'webhook-trigger',
          webhookPath,
          workflowId: id,
          workflowName: workflow.name,
          result,
        };
      }

      // No webhook node found — activate workflow (for schedule/event triggers)
      if (!workflow.active) {
        const activated = await this.activateWorkflow(id, true);
        return {
          executionMethod: 'activated',
          workflowId: id,
          workflowName: workflow.name,
          active: true,
          message: `Workflow activated. It will run when its trigger fires (schedule, event, etc.). No Webhook node found for immediate execution.`,
          triggerNodes: workflow.nodes
            ?.filter((n: any) => n.type?.includes('trigger') || n.type?.includes('Trigger'))
            ?.map((n: any) => ({ name: n.name, type: n.type })) || [],
        };
      }

      return {
        executionMethod: 'already-active',
        workflowId: id,
        workflowName: workflow.name,
        active: true,
        message: `Workflow is already active. It runs when its trigger fires. No Webhook node found for immediate execution. Use 'trigger_webhook' tool if you add a Webhook node.`,
      };

    } catch (fallbackError) {
      throw handleApiError(fallbackError,
        `Failed to execute workflow ${id}. n8n Public API does not support direct execution. ` +
        `Add a Webhook trigger node to enable execution via MCP.`
      );
    }
  }

  // ===== WEBHOOK OPERATIONS =====

  async triggerWebhook(params: {
    path: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    testMode?: boolean;
  }): Promise<any> {
    this.validateWebhookPath(params.path);
    try {
      const encodedPath = encodeURIComponent(params.path);
      const endpoint = params.testMode
        ? `/webhook-test/${encodedPath}`
        : `/webhook/${encodedPath}`;

      const response = await webhookClient.request({
        method: params.method,
        url: endpoint,
        data: params.body,
        headers: params.headers,
        params: params.queryParams,
        validateStatus: () => true, // Don't throw on any status
      });

      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      };
    } catch (error) {
      throw handleApiError(error, 'Failed to trigger webhook');
    }
  }

  // ===== NODE TYPES =====

  async listNodeTypes(): Promise<any[]> {
    try {
      const response = await n8nClient.get('/node-types');
      return response.data.data || response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to list node types');
    }
  }

  async getNodeSchema(nodeName: string): Promise<N8nNodeSchema> {
    // Check cache first
    if (this.nodeSchemaCache.has(nodeName)) {
      return this.nodeSchemaCache.get(nodeName)!;
    }

    try {
      const response = await n8nClient.get(`/node-types/${nodeName}`);
      let schema = response.data;

      // Handle potentially wrapped response (n8n API structure varies)
      if (schema.data) {
        schema = schema.data;
      }

      // If multiple versions are returned (legacy/new structure handling)
      // We want to ensure we get the latest version if it's an array or a map
      // But typically /node-types/:name returns the specific node definition.
      // If the node has versions, n8n might return the default one or a list.
      // Assuming for now it returns a single INodeTypeDescription compatible object.
      // If it returns an array of versions, we'll need to pick the highest one.

      if (Array.isArray(schema)) {
        // Sort by version number (descending) and pick the first one
        schema.sort((a: any, b: any) => {
          const vA = typeof a.version === 'number' ? a.version : (Array.isArray(a.version) ? Math.max(...a.version) : 0);
          const vB = typeof b.version === 'number' ? b.version : (Array.isArray(b.version) ? Math.max(...b.version) : 0);
          return vB - vA;
        });
        schema = schema[0];
      }

      // Store in cache with size limit
      this.setCacheEntry(nodeName, schema);
      return schema;
    } catch (error) {
      throw handleApiError(error, `Failed to get schema for node ${nodeName}`);
    }
  }

  // ===== CREDENTIALS (Phase 1 will extend) =====

  async getCredentialSchema(credentialType: string): Promise<N8nCredentialSchema> {
    try {
      const response = await n8nClient.get(`/credentials/schema/${credentialType}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to get schema for ${credentialType}`);
    }
  }

  async createCredential(credential: N8nCredential): Promise<N8nCredential> {
    try {
      const response = await n8nClient.post('/credentials', credential);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create credential');
    }
  }

  async updateCredential(id: string, credential: Partial<N8nCredential>): Promise<N8nCredential> {
    try {
      const response = await n8nClient.put(`/credentials/${id}`, credential);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to update credential ${id}`);
    }
  }

  async deleteCredential(id: string): Promise<void> {
    try {
      await n8nClient.delete(`/credentials/${id}`);
    } catch (error) {
      throw handleApiError(error, `Failed to delete credential ${id}`);
    }
  }
}

// Export singleton instance
export const n8nApi = new N8nApiService();
