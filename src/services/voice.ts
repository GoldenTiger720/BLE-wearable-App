import { AudioRecorder, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

export class VoiceService {
  private recording: AudioRecorder | null = null;
  private player: AudioPlayer | null = null;

  async startRecording(): Promise<void> {
    try {
      const recorder = new AudioRecorder();
      await recorder.requestPermissionsAsync();
      
      await recorder.startRecording({
        extension: '.wav',
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      });
      
      this.recording = recorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    try {
      const uri = await this.recording.stopRecording();
      this.recording = null;
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  async playSound(uri: string): Promise<void> {
    try {
      const player = new AudioPlayer();
      this.player = player;
      await player.loadAudio(uri);
      await player.play();
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  async stopSound(): Promise<void> {
    if (this.player) {
      await this.player.stop();
      this.player = null;
    }
  }

  async textToSpeech(text: string, options?: Speech.SpeechOptions): Promise<void> {
    const defaultOptions: Speech.SpeechOptions = {
      language: 'en-US',
      pitch: 1,
      rate: 1,
      ...options,
    };

    return Speech.speak(text, defaultOptions);
  }

  stopSpeaking(): void {
    Speech.stop();
  }

  isSpeaking(): boolean {
    return Speech.isSpeakingAsync() as unknown as boolean;
  }

  async getRecordingStatus(): Promise<boolean> {
    return this.recording !== null;
  }

  cleanup(): void {
    if (this.recording) {
      this.recording.stopRecording().catch(() => {});
      this.recording = null;
    }
    if (this.player) {
      this.player.stop().catch(() => {});
      this.player = null;
    }
    Speech.stop();
  }
}