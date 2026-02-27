/**
 * SQS transport for the event bus. Sends event envelope as JSON in MessageBody.
 */
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from '../../lib/logger.js';

/**
 * @param {{ region: string; queueUrl: string }} options
 */
export function createSqsTransport(options) {
  const { region, queueUrl } = options;
  const client = new SQSClient({ region });

  return {
    async publish(event) {
      const isFifo = queueUrl.endsWith('.fifo');
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(event),
        ...(isFifo && {
          MessageGroupId: event.type,
          MessageDeduplicationId: event.eventId,
        }),
      });
      await client.send(command);
    },

    startConsumer(onMessage) {
      let running = true;
      const poll = async () => {
        while (running) {
          try {
            const result = await client.send(
              new ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20,
                MessageAttributeNames: ['All'],
              })
            );
            const messages = result.Messages || [];
            for (const msg of messages) {
              try {
                const event = JSON.parse(msg.Body || '{}');
                await onMessage(event);
                await client.send(
                  new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: msg.ReceiptHandle })
                );
              } catch (err) {
                logger.error({ err, messageId: msg.MessageId }, 'SQS message handling failed');
              }
            }
          } catch (err) {
            logger.error({ err }, 'SQS receive failed');
          }
        }
      };
      poll();
      return {
        async close() {
          running = false;
        },
      };
    },
  };
}
