import { Queue, ConnectionOptions } from "bullmq";

// Ensure Redis connection works gracefully if not provided
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection: ConnectionOptions = {
  url: redisUrl,
};

export function getQueueConnection() {
  return connection;
}

let inboundQueue: Queue | undefined;
let outboundQueue: Queue | undefined;

export function getInboundQueue() {
  if (!inboundQueue) {
    inboundQueue = new Queue("meta-inbound", { connection });
  }
  return inboundQueue;
}

export function getOutboundQueue() {
  if (!outboundQueue) {
    outboundQueue = new Queue("meta-outbound", { connection });
  }
  return outboundQueue;
}
