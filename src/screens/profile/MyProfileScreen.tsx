import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  TextInput,
  Button,
  Avatar,
  Divider,
  List,
  Switch,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { theme } from '../../utils/theme';
import { formatDateString } from '../../utils/dateHelpers';

export const MyProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { auth, settings, updateSettings } = useAppStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.user?.name || '',
    email: auth.user?.email || '',
  });

  const handleSave = () => {
    // In a real app, this would update the user profile via API
    if (auth.user) {
      auth.user.name = formData.name;
    }
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: auth.user?.name || '',
      email: auth.user?.email || '',
    });
    setIsEditing(false);
  };

  const getTotalSessions = () => {
    const sessions = useAppStore.getState().sessions;
    return sessions.length;
  };

  const getTotalActiveTime = () => {
    const sessions = useAppStore.getState().sessions;
    const totalMs = sessions.reduce((total, session) => {
      if (session.endTime) {
        return total + (new Date(session.endTime).getTime() - new Date(session.startTime).getTime());
      }
      return total;
    }, 0);
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="headlineMedium" style={styles.title}>
          My Profile
        </Text>
        <IconButton
          icon={isEditing ? "close" : "pencil"}
          size={24}
          onPress={() => isEditing ? handleCancel() : setIsEditing(true)}
          style={styles.editButton}
        />
      </View>

      <Surface style={styles.profileCard} elevation={2}>
        <View style={styles.avatarSection}>
          <Avatar.Icon
            size={100}
            icon="account"
            style={styles.avatar}
          />
          {!isEditing && (
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {auth.user?.name || 'User'}
              </Text>
              <Text variant="bodyLarge" style={styles.userEmail}>
                {auth.user?.email || 'email@example.com'}
              </Text>
              <Text variant="bodyMedium" style={styles.memberSince}>
                Member since {formatDateString(auth.user?.createdAt, {
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>

        {isEditing && (
          <View style={styles.editForm}>
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              keyboardType="email-address"
              disabled
              style={styles.input}
            />
            <Text variant="bodySmall" style={styles.emailHint}>
              Email cannot be changed
            </Text>
            <View style={styles.editButtons}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
              >
                Save Changes
              </Button>
            </View>
          </View>
        )}
      </Surface>

      <Surface style={styles.statsCard} elevation={2}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Activity Stats
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <IconButton
              icon="chart-timeline"
              size={32}
              iconColor={theme.colors.primary}
              style={styles.statIcon}
            />
            <Text variant="headlineMedium" style={styles.statValue}>
              {getTotalSessions()}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Sessions
            </Text>
          </View>
          <View style={styles.statItem}>
            <IconButton
              icon="clock-outline"
              size={32}
              iconColor={theme.colors.secondary}
              style={styles.statIcon}
            />
            <Text variant="headlineMedium" style={styles.statValue}>
              {getTotalActiveTime()}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Active Time
            </Text>
          </View>
        </View>
      </Surface>

      <Surface style={styles.settingsCard} elevation={2}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Settings
        </Text>
        
        <List.Item
          title="Voice Commands"
          description="Enable voice input during sessions"
          left={(props) => <List.Icon {...props} icon="microphone" />}
          right={() => (
            <Switch
              value={settings.enableVoice}
              onValueChange={(value) => updateSettings({ enableVoice: value })}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Text-to-Speech"
          description="Read AI responses aloud"
          left={(props) => <List.Icon {...props} icon="volume-high" />}
          right={() => (
            <Switch
              value={settings.enableTTS}
              onValueChange={(value) => updateSettings({ enableTTS: value })}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="Streaming Responses"
          description="Show AI responses as they generate"
          left={(props) => <List.Icon {...props} icon="flash" />}
          right={() => (
            <Switch
              value={settings.streamingEnabled}
              onValueChange={(value) => updateSettings({ streamingEnabled: value })}
            />
          )}
        />
      </Surface>

      <Surface style={styles.aboutCard} elevation={2}>
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Privacy Policy', 'Your data is secure and private.')}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Terms of Service', 'By using this app, you agree to our terms.')}
        />
        <Divider />
        <List.Item
          title="App Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    margin: 0,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  editButton: {
    margin: 0,
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  userEmail: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  memberSince: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  editForm: {
    marginTop: 20,
  },
  input: {
    marginBottom: 12,
  },
  emailHint: {
    color: theme.colors.onSurfaceVariant,
    marginTop: -8,
    marginBottom: 20,
    marginLeft: 4,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    margin: 0,
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aboutCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
});