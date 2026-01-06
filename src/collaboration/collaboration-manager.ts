/**
 * Real-time Collaboration Manager
 * 
 * Implements multi-user collaboration features
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * User information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
}

/**
 * Collaboration session
 */
export interface CollaborationSession {
  id: string;
  taskId: string;
  users: User[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Change event
 */
export interface ChangeEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: 'create' | 'update' | 'delete';
  target: 'file' | 'artifact' | 'feedback' | 'state';
  targetId: string;
  data: any;
  timestamp: number;
}

/**
 * Cursor position
 */
export interface CursorPosition {
  userId: string;
  file: string;
  line: number;
  column: number;
  timestamp: number;
}

/**
 * Comment
 */
export interface Comment {
  id: string;
  sessionId: string;
  userId: string;
  targetType: 'file' | 'artifact' | 'line';
  targetId: string;
  content: string;
  resolved: boolean;
  timestamp: number;
  replies: Comment[];
}

/**
 * Collaboration manager
 */
export class CollaborationManager extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map();
  private users: Map<string, User> = new Map();
  private changes: ChangeEvent[] = [];
  private cursors: Map<string, CursorPosition> = new Map();
  private comments: Map<string, Comment> = new Map();

  /**
   * Create session
   */
  createSession(taskId: string, creator: User): CollaborationSession {
    const session: CollaborationSession = {
      id: uuidv4(),
      taskId,
      users: [creator],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.users.set(creator.id, creator);

    this.emit('session:created', session);
    return session;
  }

  /**
   * Join session
   */
  joinSession(sessionId: string, user: User): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Check if user already in session
    if (session.users.find(u => u.id === user.id)) {
      return true;
    }

    session.users.push(user);
    session.updatedAt = Date.now();

    this.users.set(user.id, user);

    this.emit('user:joined', { sessionId, user });
    return true;
  }

  /**
   * Leave session
   */
  leaveSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.users = session.users.filter(u => u.id !== userId);
    session.updatedAt = Date.now();

    this.emit('user:left', { sessionId, userId });

    // Delete session if no users left
    if (session.users.length === 0) {
      this.sessions.delete(sessionId);
      this.emit('session:deleted', sessionId);
    }

    return true;
  }

  /**
   * Broadcast change
   */
  broadcastChange(
    sessionId: string,
    userId: string,
    type: ChangeEvent['type'],
    target: ChangeEvent['target'],
    targetId: string,
    data: any
  ): void {
    const change: ChangeEvent = {
      id: uuidv4(),
      sessionId,
      userId,
      type,
      target,
      targetId,
      data,
      timestamp: Date.now(),
    };

    this.changes.push(change);

    // Keep only last 1000 changes
    if (this.changes.length > 1000) {
      this.changes = this.changes.slice(-1000);
    }

    this.emit('change:broadcast', change);
  }

  /**
   * Update cursor position
   */
  updateCursor(userId: string, file: string, line: number, column: number): void {
    const cursor: CursorPosition = {
      userId,
      file,
      line,
      column,
      timestamp: Date.now(),
    };

    this.cursors.set(userId, cursor);

    this.emit('cursor:updated', cursor);
  }

  /**
   * Get cursors
   */
  getCursors(file?: string): CursorPosition[] {
    const cursors = Array.from(this.cursors.values());

    if (file) {
      return cursors.filter(c => c.file === file);
    }

    return cursors;
  }

  /**
   * Add comment
   */
  addComment(
    sessionId: string,
    userId: string,
    targetType: Comment['targetType'],
    targetId: string,
    content: string
  ): Comment {
    const comment: Comment = {
      id: uuidv4(),
      sessionId,
      userId,
      targetType,
      targetId,
      content,
      resolved: false,
      timestamp: Date.now(),
      replies: [],
    };

    this.comments.set(comment.id, comment);

    this.emit('comment:added', comment);
    return comment;
  }

  /**
   * Reply to comment
   */
  replyToComment(commentId: string, userId: string, content: string): Comment | null {
    const parentComment = this.comments.get(commentId);
    if (!parentComment) return null;

    const reply: Comment = {
      id: uuidv4(),
      sessionId: parentComment.sessionId,
      userId,
      targetType: parentComment.targetType,
      targetId: parentComment.targetId,
      content,
      resolved: false,
      timestamp: Date.now(),
      replies: [],
    };

    parentComment.replies.push(reply);

    this.emit('comment:replied', { parentId: commentId, reply });
    return reply;
  }

  /**
   * Resolve comment
   */
  resolveComment(commentId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) return false;

    comment.resolved = true;

    this.emit('comment:resolved', commentId);
    return true;
  }

  /**
   * Get comments
   */
  getComments(filters?: {
    sessionId?: string;
    targetType?: Comment['targetType'];
    targetId?: string;
    resolved?: boolean;
  }): Comment[] {
    let comments = Array.from(this.comments.values());

    if (filters?.sessionId) {
      comments = comments.filter(c => c.sessionId === filters.sessionId);
    }

    if (filters?.targetType) {
      comments = comments.filter(c => c.targetType === filters.targetType);
    }

    if (filters?.targetId) {
      comments = comments.filter(c => c.targetId === filters.targetId);
    }

    if (filters?.resolved !== undefined) {
      comments = comments.filter(c => c.resolved === filters.resolved);
    }

    return comments.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: User['status']): void {
    const user = this.users.get(userId);
    if (!user) return;

    user.status = status;
    user.lastSeen = Date.now();

    this.emit('user:status', { userId, status });
  }

  /**
   * Get session
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(session =>
      session.users.some(u => u.id === userId)
    );
  }

  /**
   * Get changes
   */
  getChanges(sessionId: string, since?: number): ChangeEvent[] {
    let changes = this.changes.filter(c => c.sessionId === sessionId);

    if (since) {
      changes = changes.filter(c => c.timestamp > since);
    }

    return changes.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSessions: number;
    totalUsers: number;
    totalChanges: number;
    totalComments: number;
    activeSessions: number;
    activeUsers: number;
  } {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    return {
      totalSessions: this.sessions.size,
      totalUsers: this.users.size,
      totalChanges: this.changes.length,
      totalComments: this.comments.size,
      activeSessions: Array.from(this.sessions.values()).filter(
        s => s.updatedAt > fiveMinutesAgo
      ).length,
      activeUsers: Array.from(this.users.values()).filter(
        u => u.status === 'online' && u.lastSeen > fiveMinutesAgo
      ).length,
    };
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.changes = this.changes.filter(c => c.sessionId !== sessionId);
    
    const comments = Array.from(this.comments.entries());
    for (const [id, comment] of comments) {
      if (comment.sessionId === sessionId) {
        this.comments.delete(id);
      }
    }

    this.emit('session:cleared', sessionId);
  }
}

/**
 * Create collaboration manager instance
 */
export function createCollaborationManager(): CollaborationManager {
  return new CollaborationManager();
}
