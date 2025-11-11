import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

export class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || '4inarow-game',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      logLevel: 0, // Disable Kafka logs (0 = NOTHING)
    });
    
    this.producer = this.kafka.producer();
    this.isConnected = false;
    this.initProducer();
  }

  async initProducer() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Kafka producer connected');
    } catch (error) {
      // Silently continue without Kafka in development
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Kafka connection error:', error);
        throw error;
      }
      // In development, just skip Kafka silently
    }
  }

  async emitEvent(eventType, data) {
    if (!this.isConnected) {
      // Silently skip events if Kafka is not connected
      return;
    }

    try {
      await this.producer.send({
        topic: 'game-analytics',
        messages: [
          {
            key: eventType,
            value: JSON.stringify({
              eventType,
              data,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      
      console.log(`📊 Emitted event: ${eventType}`);
    } catch (error) {
      console.error('Error emitting event to Kafka:', error);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.producer.disconnect();
      console.log('Kafka producer disconnected');
    }
  }
}
