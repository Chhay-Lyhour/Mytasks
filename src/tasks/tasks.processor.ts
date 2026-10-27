import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

interface SendReminderData {
  taskId: number;
  title: string;
  ownerId: number | null;
}

@Processor('tasks')
export class TasksProcessor extends WorkerHost {
  private readonly logger = new Logger(TasksProcessor.name);



  async process(job: Job<SendReminderData>): Promise<void> {
    if (job.name !== 'send-reminder') {
      throw new Error(`Unsupported task queue job: ${job.name}`);
    }

    this.logger.log(
      `Reminder for task ${job.data.taskId}: ${JSON.stringify(job.data.title)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SendReminderData> | undefined, error: Error): void {
    this.logger.error(
      `Reminder job ${job?.id ?? 'unknown'} failed on attempt ${job?.attemptsMade ?? 'unknown'}: ${error.message}`,
    );
  }
}
