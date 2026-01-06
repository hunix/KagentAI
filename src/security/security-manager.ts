/**
 * Security Manager
 * 
 * Implements security features and access control
 */

import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';

/**
 * Permission
 */
export type Permission =
  | 'read:files'
  | 'write:files'
  | 'execute:terminal'
  | 'manage:agents'
  | 'manage:users'
  | 'admin';

/**
 * User role
 */
export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

/**
 * API key
 */
export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: Permission[];
  expiresAt?: number;
  createdAt: number;
  lastUsed?: number;
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'access_denied' | 'suspicious_activity';
  userId: string;
  details: string;
  timestamp: number;
}

/**
 * Security manager
 */
export class SecurityManager extends EventEmitter {
  private roles: Map<string, UserRole> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private events: SecurityEvent[] = [];
  private rateLimits: Map<string, number[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    this.createRole('admin', [
      'read:files',
      'write:files',
      'execute:terminal',
      'manage:agents',
      'manage:users',
      'admin',
    ]);

    this.createRole('editor', [
      'read:files',
      'write:files',
      'execute:terminal',
      'manage:agents',
    ]);

    this.createRole('viewer', ['read:files']);
  }

  /**
   * Create role
   */
  createRole(name: string, permissions: Permission[]): UserRole {
    const role: UserRole = {
      id: randomBytes(16).toString('hex'),
      name,
      permissions,
    };

    this.roles.set(role.id, role);
    return role;
  }

  /**
   * Get role
   */
  getRole(id: string): UserRole | undefined {
    return this.roles.get(id);
  }

  /**
   * Get role by name
   */
  getRoleByName(name: string): UserRole | undefined {
    return Array.from(this.roles.values()).find(r => r.name === name);
  }

  /**
   * Check permission
   */
  hasPermission(permissions: Permission[], required: Permission): boolean {
    return permissions.includes('admin') || permissions.includes(required);
  }

  /**
   * Create API key
   */
  createAPIKey(
    name: string,
    userId: string,
    permissions: Permission[],
    expiresIn?: number
  ): APIKey {
    const key = this.generateAPIKey();

    const apiKey: APIKey = {
      id: randomBytes(16).toString('hex'),
      key,
      name,
      userId,
      permissions,
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      createdAt: Date.now(),
    };

    this.apiKeys.set(apiKey.key, apiKey);
    return apiKey;
  }

  /**
   * Validate API key
   */
  validateAPIKey(key: string): APIKey | null {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      this.apiKeys.delete(key);
      return null;
    }

    // Update last used
    apiKey.lastUsed = Date.now();

    return apiKey;
  }

  /**
   * Revoke API key
   */
  revokeAPIKey(key: string): boolean {
    return this.apiKeys.delete(key);
  }

  /**
   * Hash password
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(password + actualSalt)
      .digest('hex');

    return { hash, salt: actualSalt };
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt);
    return computedHash === hash;
  }

  /**
   * Generate API key
   */
  private generateAPIKey(): string {
    return `sk-${randomBytes(32).toString('hex')}`;
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    type: SecurityEvent['type'],
    userId: string,
    details: string
  ): void {
    const event: SecurityEvent = {
      id: randomBytes(16).toString('hex'),
      type,
      userId,
      details,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    this.emit('security:event', event);

    // Check for suspicious activity
    if (type === 'access_denied') {
      this.checkSuspiciousActivity(userId);
    }
  }

  /**
   * Check suspicious activity
   */
  private checkSuspiciousActivity(userId: string): void {
    const recentEvents = this.events.filter(
      e =>
        e.userId === userId &&
        e.type === 'access_denied' &&
        e.timestamp > Date.now() - 5 * 60 * 1000
    );

    if (recentEvents.length >= 5) {
      this.logSecurityEvent('suspicious_activity', userId, 'Multiple access denied events');
      this.emit('security:suspicious', userId);
    }
  }

  /**
   * Rate limit check
   */
  checkRateLimit(userId: string, limit: number, window: number): boolean {
    const now = Date.now();
    const windowStart = now - window;

    // Get or create rate limit array
    let requests = this.rateLimits.get(userId) || [];

    // Remove old requests
    requests = requests.filter(t => t > windowStart);

    // Check limit
    if (requests.length >= limit) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.rateLimits.set(userId, requests);

    return true;
  }

  /**
   * Get security events
   */
  getSecurityEvents(filters?: {
    type?: SecurityEvent['type'];
    userId?: string;
    since?: number;
  }): SecurityEvent[] {
    let events = this.events;

    if (filters?.type) {
      events = events.filter(e => e.type === filters.type);
    }

    if (filters?.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }

    if (filters?.since) {
      events = events.filter(e => e.timestamp > filters.since);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRoles: number;
    totalAPIKeys: number;
    totalEvents: number;
    recentEvents: number;
    suspiciousActivities: number;
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    return {
      totalRoles: this.roles.size,
      totalAPIKeys: this.apiKeys.size,
      totalEvents: this.events.length,
      recentEvents: this.events.filter(e => e.timestamp > oneHourAgo).length,
      suspiciousActivities: this.events.filter(
        e => e.type === 'suspicious_activity'
      ).length,
    };
  }

  /**
   * Sanitize input
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  /**
   * Validate file path
   */
  validateFilePath(path: string, allowedPaths: string[]): boolean {
    const normalizedPath = path.replace(/\\/g, '/');

    for (const allowedPath of allowedPaths) {
      if (normalizedPath.startsWith(allowedPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Encrypt data
   */
  encryptData(data: string, key: string): string {
    // Simple XOR encryption (in production, use proper encryption)
    const encrypted = Buffer.from(data)
      .map((byte, i) => byte ^ key.charCodeAt(i % key.length))
      .toString('base64');

    return encrypted;
  }

  /**
   * Decrypt data
   */
  decryptData(encrypted: string, key: string): string {
    // Simple XOR decryption (in production, use proper decryption)
    const decrypted = Buffer.from(encrypted, 'base64')
      .map((byte, i) => byte ^ key.charCodeAt(i % key.length))
      .toString('utf-8');

    return decrypted;
  }
}

/**
 * Create security manager instance
 */
export function createSecurityManager(): SecurityManager {
  return new SecurityManager();
}
