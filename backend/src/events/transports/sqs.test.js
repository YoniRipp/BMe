import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn().mockResolvedValue({ MessageId: 'test-id' });
vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: class MockSQSClient {
    send = sendMock;
  },
  SendMessageCommand: class SendMessageCommand {
    constructor(opts) {
      this._opts = opts;
    }
  },
  ReceiveMessageCommand: vi.fn(),
  DeleteMessageCommand: vi.fn(),
}));

import { createSqsTransport } from './sqs.js';

describe('SQS event transport', () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it('publish sends event as JSON in MessageBody', async () => {
    const transport = createSqsTransport({
      region: 'us-east-1',
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/events',
    });
    const event = {
      eventId: 'e1',
      type: 'money.TransactionCreated',
      payload: { id: 'tx-1' },
      metadata: { userId: 'u1', timestamp: '2025-02-24T12:00:00.000Z' },
    };
    await transport.publish(event);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const [cmd] = sendMock.mock.calls[0];
    expect(cmd._opts.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123/events');
    expect(cmd._opts.MessageBody).toBe(JSON.stringify(event));
  });

  it('publish does not add FIFO fields for standard queue URL', async () => {
    const transport = createSqsTransport({
      region: 'us-east-1',
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/events',
    });
    const event = {
      eventId: 'e1',
      type: 'money.TransactionCreated',
      payload: {},
      metadata: { userId: 'u1', timestamp: '2025-02-24T12:00:00.000Z' },
    };
    await transport.publish(event);
    const [cmd] = sendMock.mock.calls[0];
    expect(cmd._opts.MessageGroupId).toBeUndefined();
    expect(cmd._opts.MessageDeduplicationId).toBeUndefined();
  });

  it('publish adds MessageGroupId and MessageDeduplicationId for FIFO queue', async () => {
    const transport = createSqsTransport({
      region: 'us-east-1',
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/events.fifo',
    });
    const event = {
      eventId: 'e1',
      type: 'money.TransactionCreated',
      payload: {},
      metadata: { userId: 'u1', timestamp: '2025-02-24T12:00:00.000Z' },
    };
    await transport.publish(event);
    const [cmd] = sendMock.mock.calls[0];
    expect(cmd._opts.MessageGroupId).toBe('money.TransactionCreated');
    expect(cmd._opts.MessageDeduplicationId).toBe('e1');
  });
});
