import { logger } from '../utils/logger';

/**
 * Manages active cases in memory
 * Maps telegram_user_id -> case_id
 */
export class CaseManager {
  private activeCases: Map<number, string> = new Map();

  setActive(userId: number, caseId: string): void {
    this.activeCases.set(userId, caseId);
    logger.debug('Case set as active', { userId, caseId });
  }

  getActive(userId: number): string | undefined {
    return this.activeCases.get(userId);
  }

  remove(userId: number): void {
    const removed = this.activeCases.delete(userId);
    if (removed) {
      logger.debug('Case removed from active list', { userId });
    }
  }

  has(userId: number): boolean {
    return this.activeCases.has(userId);
  }

  size(): number {
    return this.activeCases.size;
  }
}

export const caseManager = new CaseManager();
