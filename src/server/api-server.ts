/**
 * API Server
 * 
 * REST API server for Agentic IDE
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * API request
 */
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * API response
 */
export interface ApiResponse {
  status: number;
  data?: any;
  error?: string;
  timestamp: number;
}

/**
 * API route handler
 */
export type RouteHandler = (req: ApiRequest) => Promise<ApiResponse>;

/**
 * API Server
 */
export class ApiServer {
  private port: number;
  private routes: Map<string, Map<string, RouteHandler>> = new Map();
  private middleware: Array<(req: ApiRequest) => Promise<void>> = [];
  private isRunning = false;

  constructor(port: number = 3000) {
    this.port = port;
    this.setupDefaultRoutes();
  }

  /**
   * Setup default routes
   */
  private setupDefaultRoutes(): void {
    // Health check
    this.registerRoute('GET', '/health', async () => ({
      status: 200,
      data: { status: 'ok', timestamp: Date.now() },
      timestamp: Date.now(),
    }));

    // API info
    this.registerRoute('GET', '/api/info', async () => ({
      status: 200,
      data: {
        name: 'Agentic IDE API',
        version: '1.0.0',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }));
  }

  /**
   * Register route
   */
  registerRoute(method: string, path: string, handler: RouteHandler): void {
    if (!this.routes.has(path)) {
      this.routes.set(path, new Map());
    }

    this.routes.get(path)!.set(method, handler);
  }

  /**
   * Register middleware
   */
  registerMiddleware(middleware: (req: ApiRequest) => Promise<void>): void {
    this.middleware.push(middleware);
  }

  /**
   * Handle request
   */
  async handleRequest(req: ApiRequest): Promise<ApiResponse> {
    try {
      // Run middleware
      for (const mw of this.middleware) {
        await mw(req);
      }

      // Find route handler
      const handlers = this.routes.get(req.path);

      if (!handlers || !handlers.has(req.method)) {
        return {
          status: 404,
          error: `Route not found: ${req.method} ${req.path}`,
          timestamp: Date.now(),
        };
      }

      const handler = handlers.get(req.method)!;
      return await handler(req);
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`API Server started on port ${this.port}`);
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`API Server stopped`);
  }

  /**
   * Get all routes
   */
  getRoutes(): Array<{ method: string; path: string }> {
    const routes: Array<{ method: string; path: string }> = [];

    for (const [path, methods] of this.routes.entries()) {
      for (const method of methods.keys()) {
        routes.push({ method, path });
      }
    }

    return routes;
  }

  /**
   * Is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get port
   */
  getPort(): number {
    return this.port;
  }
}

/**
 * Create API server instance
 */
export function createApiServer(port: number = 3000): ApiServer {
  return new ApiServer(port);
}

/**
 * API Server Builder
 */
export class ApiServerBuilder {
  private server: ApiServer;

  constructor(port: number = 3000) {
    this.server = new ApiServer(port);
  }

  /**
   * Add route
   */
  addRoute(method: string, path: string, handler: RouteHandler): this {
    this.server.registerRoute(method, path, handler);
    return this;
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware: (req: ApiRequest) => Promise<void>): this {
    this.server.registerMiddleware(middleware);
    return this;
  }

  /**
   * Add authentication middleware
   */
  addAuth(apiKey: string): this {
    this.server.registerMiddleware(async (req) => {
      const key = req.headers?.['x-api-key'];

      if (!key || key !== apiKey) {
        throw new Error('Unauthorized');
      }
    });

    return this;
  }

  /**
   * Add CORS middleware
   */
  addCors(origins: string[] = ['*']): this {
    this.server.registerMiddleware(async (req) => {
      // CORS headers would be added here
    });

    return this;
  }

  /**
   * Add logging middleware
   */
  addLogging(): this {
    this.server.registerMiddleware(async (req) => {
      console.log(`[${req.method}] ${req.path}`);
    });

    return this;
  }

  /**
   * Build server
   */
  build(): ApiServer {
    return this.server;
  }
}
