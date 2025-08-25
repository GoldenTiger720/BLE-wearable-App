import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  TextInput,
  Button,
  Chip,
  FAB,
  Portal,
  Modal,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { OpenAIService } from '../../services/openai';
import { VoiceService } from '../../services/voice';
import { WearableSimulator } from '../../services/simulator';
import { BluetoothService } from '../../services/bluetooth';
import { Message, SensorEvent } from '../../types';
import { theme } from '../../utils/theme';

const { height } = Dimensions.get('window');

export const SessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { prompts } = (route.params as any) || {};
  
  const {
    currentSession,
    connectedDevice,
    simulatorEnabled,
    settings,
    addMessage,
    addSensorEvent,
    pauseSession,
    endSession,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{summary: string, highlights: string[]} | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const openAIService = useRef(new OpenAIService());
  const voiceService = useRef(new VoiceService());
  const simulator = useRef(new WearableSimulator());

  useEffect(() => {
    if (!currentSession) {
      navigation.goBack();
      return;
    }

    // Initialize sensor data collection
    if (simulatorEnabled) {
      simulator.current.start(handleSensorEvent);
    } else if (connectedDevice) {
      const bluetoothService = new BluetoothService();
      const unsubscribe = bluetoothService.subscribeSensorData(handleSensorEvent);
      return () => unsubscribe();
    }

    return () => {
      simulator.current.stop();
      voiceService.current.cleanup();
    };
  }, [currentSession, simulatorEnabled, connectedDevice]);

  const handleSensorEvent = (event: SensorEvent) => {
    addSensorEvent(event);
  };

  const sendMessage = async (content: string, isVoice = false) => {
    if (!content.trim() || !currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      isVoice,
    };

    addMessage(userMessage);
    setInputText('');

    try {
      setIsStreaming(true);
      
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a health AI assistant analyzing wearable device data. Be concise, helpful, and focus on actionable health insights.',
        },
        ...currentSession.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content },
      ];

      let assistantResponse = '';
      
      if (settings.streamingEnabled) {
        assistantResponse = await openAIService.current.createChatCompletion(
          messages,
          settings.llmModel,
          (chunk) => {
            if (chunk.content) {
              // Update streaming message in real-time
              assistantResponse += chunk.content;
            }
          }
        );
      } else {
        assistantResponse = await openAIService.current.createChatCompletion(
          messages,
          settings.llmModel
        );
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };

      addMessage(assistantMessage);

      // Play TTS if enabled
      if (settings.enableTTS) {
        await voiceService.current.textToSpeech(assistantResponse);
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to get response. Please try again.');
      console.error('AI Response Error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!settings.enableVoice) {
      Alert.alert('Voice Disabled', 'Please enable voice features in settings');
      return;
    }

    try {
      if (isRecording) {
        setIsRecording(false);
        const audioUri = await voiceService.current.stopRecording();
        
        if (audioUri) {
          // In production, convert audio to text using OpenAI Whisper
          const mockTranscription = 'How is my heart rate looking today?';
          await sendMessage(mockTranscription, true);
        }
      } else {
        setIsRecording(true);
        await voiceService.current.startRecording();
      }
    } catch (error) {
      setIsRecording(false);
      Alert.alert('Voice Error', 'Failed to process voice input');
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;

    try {
      // Generate session summary
      const messages = currentSession.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const summary = await openAIService.current.generateSessionSummary(messages);
      setSessionSummary(summary);
      
      endSession();
      setShowSummary(true);
    } catch (error) {
      console.error('Summary generation error:', error);
      endSession();
      navigation.goBack();
    }
  };

  const getStatusColor = () => {
    if (!currentSession) return theme.colors.onSurfaceVariant;
    
    switch (currentSession.status) {
      case 'active':
        return theme.colors.secondary;
      case 'paused':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isLast = index === (currentSession?.messages.length || 0) - 1;

    return (
      <View key={message.id} style={[styles.messageContainer, isUser && styles.userMessage]}>
        <Surface
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
          elevation={1}
        >
          {message.isVoice && (
            <Chip compact icon="microphone" style={styles.voiceChip}>
              Voice
            </Chip>
          )}
          <Text variant="bodyMedium" style={styles.messageText}>
            {message.content}
          </Text>
          <Text variant="bodySmall" style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </Surface>
      </View>
    );
  };

  const renderSensorEvent = (event: SensorEvent, index: number) => (
    <View key={event.id} style={styles.sensorEventContainer}>
      <Chip
        compact
        icon={getSensorIcon(event.type)}
        style={styles.sensorChip}
      >
        {formatSensorValue(event)}
      </Chip>
    </View>
  );

  const getSensorIcon = (type: SensorEvent['type']) => {
    switch (type) {
      case 'heartRate':
        return 'heart';
      case 'steps':
        return 'walk';
      case 'activity':
        return 'run';
      case 'battery':
        return 'battery';
      default:
        return 'information';
    }
  };

  const formatSensorValue = (event: SensorEvent) => {
    switch (event.type) {
      case 'heartRate':
        return `${event.value} BPM`;
      case 'steps':
        return `+${event.value} steps`;
      case 'activity':
        return event.value;
      case 'battery':
        return `${event.value}% battery`;
      default:
        return JSON.stringify(event.value);
    }
  };

  if (!currentSession) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge">Loading session...</Text>
      </View>
    );
  }

  const sessionDuration = currentSession.endTime
    ? currentSession.endTime.getTime() - currentSession.startTime.getTime()
    : Date.now() - currentSession.startTime.getTime();
  const minutes = Math.floor(sessionDuration / 60000);
  const seconds = Math.floor((sessionDuration % 60000) / 1000);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="close"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.sessionInfo}>
            <Text variant="titleMedium">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
              textStyle={{ color: 'white' }}
            >
              {currentSession.status === 'active' ? 'Collecting' : 'Paused'}
            </Chip>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <IconButton
            icon="pause"
            size={24}
            onPress={pauseSession}
            disabled={currentSession.status === 'paused'}
          />
          <IconButton
            icon="file-document-outline"
            size={24}
            onPress={() => setShowSummary(true)}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.conversation}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Render messages and sensor events in chronological order */}
        {[...currentSession.messages, ...currentSession.sensorEvents]
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          .map((item, index) =>
            'role' in item
              ? renderMessage(item as Message, index)
              : renderSensorEvent(item as SensorEvent, index)
          )}
        
        {isStreaming && (
          <View style={[styles.messageContainer]}>
            <Surface style={[styles.messageBubble, styles.assistantBubble]} elevation={1}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.streamingText}>
                AI is thinking...
              </Text>
            </Surface>
          </View>
        )}
      </ScrollView>

      <Surface style={styles.inputContainer} elevation={3}>
        <View style={styles.inputRow}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your health data..."
            mode="outlined"
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          
          <FAB
            icon={isRecording ? 'stop' : 'microphone'}
            onPress={handleVoiceInput}
            style={[
              styles.voiceFab,
              isRecording && { backgroundColor: theme.colors.error },
            ]}
          />
        </View>
        
        <View style={styles.inputActions}>
          <Button
            mode="text"
            onPress={() => voiceService.current.stopSpeaking()}
            disabled={!voiceService.current.isSpeaking()}
          >
            Stop TTS
          </Button>
          
          <View style={styles.sendButtonContainer}>
            <Button
              mode="contained"
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isStreaming}
              style={styles.sendButton}
            >
              Send
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleEndSession}
              style={styles.endButton}
            >
              End Session
            </Button>
          </View>
        </View>
      </Surface>

      <Portal>
        <Modal
          visible={showSummary}
          onDismiss={() => setShowSummary(false)}
          contentContainerStyle={styles.summaryModal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.summaryTitle}>
              Session Summary
            </Text>
            
            {sessionSummary ? (
              <>
                <Text variant="bodyLarge" style={styles.summaryContent}>
                  {sessionSummary.summary}
                </Text>
                
                {sessionSummary.highlights.length > 0 && (
                  <>
                    <Text variant="titleMedium" style={styles.highlightsTitle}>
                      Key Highlights
                    </Text>
                    {sessionSummary.highlights.map((highlight, index) => (
                      <Text key={index} variant="bodyMedium" style={styles.highlight}>
                        • {highlight}
                      </Text>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text variant="bodyMedium">Generating summary...</Text>
              </View>
            )}
            
            <View style={styles.summaryActions}>
              <Button mode="outlined" onPress={() => setShowSummary(false)}>
                Close
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setShowSummary(false);
                  navigation.navigate('Dashboard' as never);
                }}
              >
                Back to Dashboard
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  sessionInfo: {
    marginLeft: 8,
  },
  statusChip: {
    marginTop: 4,
  },
  conversation: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 8,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  messageTime: {
    marginTop: 4,
    opacity: 0.7,
    fontSize: 11,
  },
  voiceChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    height: 24,
  },
  sensorEventContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  sensorChip: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  streamingText: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 120,
  },
  voiceFab: {
    backgroundColor: theme.colors.primary,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  sendButtonContainer: {
    flexDirection: 'row',
  },
  sendButton: {
    marginRight: 8,
  },
  endButton: {
    borderColor: theme.colors.error,
  },
  summaryModal: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: theme.roundness,
    maxHeight: height * 0.8,
  },
  summaryTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryContent: {
    lineHeight: 24,
    marginBottom: 16,
  },
  highlightsTitle: {
    marginBottom: 12,
    color: theme.colors.primary,
  },
  highlight: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  summaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});