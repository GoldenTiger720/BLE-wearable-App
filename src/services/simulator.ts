import { SensorEvent } from '../types';
import { MOCK_SENSOR_DATA } from '../constants';

export class WearableSimulator {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  start(onSensorEvent: (event: SensorEvent) => void): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Simulate heart rate data
    this.intervals.push(
      setInterval(() => {
        const baseHR = MOCK_SENSOR_DATA.heartRate.normal;
        const variation = Math.sin(Date.now() / 10000) * 10;
        const heartRate = Math.floor(baseHR + variation + Math.random() * 5);

        onSensorEvent({
          id: `hr-${Date.now()}`,
          type: 'heartRate',
          value: heartRate,
          timestamp: new Date(),
        });
      }, 2000)
    );

    // Simulate step count
    this.intervals.push(
      setInterval(() => {
        const steps = Math.floor(Math.random() * 50) + 10;
        
        onSensorEvent({
          id: `steps-${Date.now()}`,
          type: 'steps',
          value: steps,
          timestamp: new Date(),
        });
      }, 5000)
    );

    // Simulate activity changes
    this.intervals.push(
      setInterval(() => {
        const activity = MOCK_SENSOR_DATA.activities[
          Math.floor(Math.random() * MOCK_SENSOR_DATA.activities.length)
        ];

        onSensorEvent({
          id: `activity-${Date.now()}`,
          type: 'activity',
          value: activity,
          timestamp: new Date(),
        });
      }, 15000)
    );

    // Simulate battery level
    this.intervals.push(
      setInterval(() => {
        const battery = Math.floor(Math.random() * 20) + 70;
        
        onSensorEvent({
          id: `battery-${Date.now()}`,
          type: 'battery',
          value: battery,
          timestamp: new Date(),
        });
      }, 30000)
    );
  }

  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  generateCustomEvent(type: string, value: any): SensorEvent {
    return {
      id: `custom-${Date.now()}`,
      type: 'custom',
      value: { type, data: value },
      timestamp: new Date(),
    };
  }

  exportLogs(events: SensorEvent[]): string {
    return JSON.stringify(events, null, 2);
  }
}