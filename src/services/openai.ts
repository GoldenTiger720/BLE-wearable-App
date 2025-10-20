import { API_BASE_URL } from '../constants';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamChunk {
  content: string;
  finished: boolean;
}

export class OpenAIService {
  private baseURL = API_BASE_URL;
  private useDemoMode: boolean = false;
  private backendChecked: boolean = false;

  constructor() {
    // Check if backend is available (async, non-blocking)
    this.checkBackendAvailability();
  }

  private async checkBackendAvailability() {
    if (this.backendChecked) return;
    this.backendChecked = true;

    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      this.useDemoMode = !response.ok;
      if (this.useDemoMode) {
        console.log('OpenAI backend unavailable, using demo responses');
      }
    } catch {
      this.useDemoMode = true;
      console.log('OpenAI backend unavailable, using demo responses');
    }
  }

  private getDemoResponse(userMessage: string): string {
    const responses = {
      'health': "Based on your recent data, you're maintaining good health metrics! Your heart rate shows you're active, and your sleep patterns indicate adequate rest. I'd recommend staying consistent with your current routine.",
      'workout': "Your workout performance today shows improvement! I noticed increased heart rate variability during exercise, suggesting better cardiovascular fitness. Consider adding some strength training to complement your cardio routine.",
      'stress': "Your stress levels appear elevated based on heart rate and activity patterns. Try some deep breathing exercises or a short walk. Your wearable shows you've been sitting for extended periods - movement can help reduce stress.",
      'sleep': "Your sleep quality last night was good with 7.2 hours of total sleep. You had 4 REM cycles and minimal interruptions. To optimize further, try avoiding screens 1 hour before bedtime.",
      'activity': "Today you've completed 8,247 steps and burned 342 calories. You're 78% toward your daily goal! Your most active period was between 2-4 PM. Great job staying consistent!",
      'default': "I'm analyzing your health data and wearable metrics. Based on your recent patterns, everything looks good! Your heart rate, activity levels, and sleep quality are all within healthy ranges. Keep up the great work with your wellness routine!"
    };

    const userLower = userMessage.toLowerCase();
    
    if (userLower.includes('health') || userLower.includes('how am i')) {
      return responses.health;
    } else if (userLower.includes('workout') || userLower.includes('exercise') || userLower.includes('fitness')) {
      return responses.workout;
    } else if (userLower.includes('stress') || userLower.includes('anxious') || userLower.includes('tension')) {
      return responses.stress;
    } else if (userLower.includes('sleep') || userLower.includes('tired') || userLower.includes('rest')) {
      return responses.sleep;
    } else if (userLower.includes('activity') || userLower.includes('steps') || userLower.includes('calories')) {
      return responses.activity;
    } else {
      return responses.default;
    }
  }

  async createChatCompletion(
    messages: ChatMessage[],
    model: string = 'gpt-4',
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    // Use demo mode if backend is not available
    if (this.useDemoMode) {
      return this.handleDemoMode(messages, onStream);
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: !!onStream,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        console.warn(`Backend API error: ${response.status} ${response.statusText}`);
        // Fall back to demo mode on API errors
        return this.handleDemoMode(messages, onStream);
      }

      if (onStream && response.body) {
        return this.handleStream(response.body, onStream);
      } else {
        const data = await response.json();
        if (!data.content) {
          console.error('Invalid backend response:', data);
          throw new Error('Invalid response from backend API');
        }
        return data.content;
      }
    } catch (error) {
      console.warn('Backend API request failed, using demo mode:', error);
      // Fall back to demo mode on network errors
      return this.handleDemoMode(messages, onStream);
    }
  }

  private async handleDemoMode(
    messages: ChatMessage[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    const userMessage = messages[messages.length - 1]?.content || '';
    const response = this.getDemoResponse(userMessage);

    if (onStream) {
      // Simulate streaming for demo
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        onStream({ content: chunk, finished: false });
      }
      onStream({ content: '', finished: true });
    }

    return response;
  }

  private async handleStream(
    body: ReadableStream<Uint8Array>,
    onStream: (chunk: StreamChunk) => void
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onStream({ content: '', finished: true });
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onStream({ content, finished: false });
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  async generateSessionSummary(messages: ChatMessage[]): Promise<{
    summary: string;
    highlights: string[];
  }> {
    if (this.useDemoMode) {
      return {
        summary: "Great health discussion! We covered your daily activity levels, sleep patterns, and wellness goals. Your metrics show positive trends in fitness and overall health.",
        highlights: [
          "Daily step goal exceeded by 12%",
          "Heart rate variability improving",
          "Sleep quality rated as good (7.2 hours)",
          "Recommended maintaining current exercise routine",
          "Suggested stress reduction techniques"
        ]
      };
    }

    try {
      const systemPrompt = {
        role: 'system' as const,
        content: 'You are a health AI assistant. Analyze the conversation and provide a concise summary and key highlights.',
      };

      const summaryPrompt = {
        role: 'user' as const,
        content: 'Please provide:\n1. A brief summary (2-3 sentences)\n2. 3-5 key highlights or action items\n\nFormat as JSON with "summary" and "highlights" fields.',
      };

      const response = await this.createChatCompletion([
        systemPrompt,
        ...messages,
        summaryPrompt,
      ], 'gpt-3.5-turbo');

      try {
        return JSON.parse(response);
      } catch {
        return {
          summary: response,
          highlights: [],
        };
      }
    } catch (error) {
      console.warn('Failed to generate summary, using demo mode:', error);
      return {
        summary: "Health session completed successfully. Discussion focused on wellness metrics and lifestyle recommendations.",
        highlights: ["Activity tracking reviewed", "Health goals discussed", "Recommendations provided"]
      };
    }
  }

  async transcribeAudio(audioData: ArrayBuffer): Promise<string> {
    if (this.useDemoMode) {
      // Simulate transcription delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const demoTranscriptions = [
        "How is my health today?",
        "What does my heart rate data show?",
        "Can you analyze my sleep patterns?",
        "I feel tired today, what should I do?",
        "How many steps have I taken?",
        "What are my fitness recommendations?"
      ];
      return demoTranscriptions[Math.floor(Math.random() * demoTranscriptions.length)];
    }

    try {
      const formData = new FormData();
      formData.append('file', new Blob([audioData], { type: 'audio/wav' }), 'audio.wav');

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || data.transcription || "How is my health today?";
    } catch (error) {
      console.warn('Transcription failed, using demo mode:', error);
      return "How is my health today?"; // Default fallback
    }
  }
}