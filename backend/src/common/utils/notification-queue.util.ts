import { Logger } from '@nestjs/common';

interface NotificationTask {
  token: string;
  message: string;
  studentId: string;
}

type SendFn = (token: string, message: string) => Promise<void>;

/**
 * Lightweight in-process notification queue.
 * Batches notifications and sends them concurrently without blocking the API response.
 * For production at scale, replace with BullMQ + Redis.
 */
export class NotificationQueue {
  private readonly logger = new Logger(NotificationQueue.name);
  private queue: NotificationTask[] = [];
  private processing = false;
  private readonly concurrency: number;

  constructor(
    private readonly sendFn: SendFn,
    concurrency = 5,
  ) {
    this.concurrency = concurrency;
  }

  /**
   * Add tasks to the queue. Processing starts automatically (fire-and-forget).
   */
  enqueue(tasks: NotificationTask[]) {
    this.queue.push(...tasks);
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      // Take a batch
      const batch = this.queue.splice(0, this.concurrency);

      const results = await Promise.allSettled(
        batch.map((t) => this.sendFn(t.token, t.message)),
      );

      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          this.logger.warn(
            `Notification failed for student ${batch[idx].studentId}: ${result.reason}`,
          );
        }
      });

      // Small delay between batches to avoid rate limiting
      if (this.queue.length > 0) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    this.processing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }
}
