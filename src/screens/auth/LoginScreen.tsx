import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  IconButton,
  Divider,
  Card,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/auth';
import { useAppStore } from '../../store';
import { theme } from '../../utils/theme';

const { width } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const setAuth = useAppStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.login(email, password);
      if (response.success && response.token && response.user) {
        setAuth({
          isAuthenticated: true,
          user: {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            createdAt: new Date(),
          },
          token: response.token,
        });
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (userIndex: number) => {
    const demoUsers = [
      { email: 'demo@example.com', password: 'password123' },
      { email: 'john@wearable.com', password: 'health123' },
      { email: 'sarah@fitness.com', password: 'fitness456' },
    ];
    
    const user = demoUsers[userIndex];
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundShape} />
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconButton 
              icon="brain" 
              size={48} 
              iconColor={theme.colors.primary}
              style={styles.brainIcon}
            />
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            WearableAI
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Your intelligent health companion
          </Text>
        </View>

        <Surface style={styles.card} elevation={3}>
          <Text variant="headlineSmall" style={styles.cardTitle}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.cardSubtitle}>
            Sign in to continue your health journey
          </Text>

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.orText}>or</Text>
            <Divider style={styles.divider} />
          </View>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('SignUp')}
            style={styles.signUpButton}
            contentStyle={styles.buttonContent}
          >
            Create New Account
          </Button>
        </Surface>

        <Card style={styles.demoCard} mode="outlined">
          <Card.Content>
            <Text variant="titleSmall" style={styles.demoTitle}>
              Demo Accounts
            </Text>
            <Text variant="bodySmall" style={styles.demoSubtitle}>
              Try these credentials for quick access
            </Text>
            
            <View style={styles.demoChips}>
              <Chip 
                mode="outlined" 
                onPress={() => fillDemoCredentials(0)}
                style={styles.demoChip}
              >
                Demo User
              </Chip>
              <Chip 
                mode="outlined" 
                onPress={() => fillDemoCredentials(1)}
                style={styles.demoChip}
              >
                John Doe
              </Chip>
              <Chip 
                mode="outlined" 
                onPress={() => fillDemoCredentials(2)}
                style={styles.demoChip}
              >
                Sarah Smith
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backgroundShape: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${theme.colors.primary}15`,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 32,
    padding: 8,
  },
  brainIcon: {
    margin: 0,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    padding: 32,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginBottom: 24,
  },
  cardTitle: {
    marginBottom: 8,
    textAlign: 'center',
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    marginBottom: 32,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  orText: {
    marginHorizontal: 16,
    color: theme.colors.onSurfaceVariant,
  },
  signUpButton: {
    borderRadius: 12,
    borderColor: theme.colors.outline,
  },
  demoCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outlineVariant,
  },
  demoTitle: {
    marginBottom: 4,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  demoSubtitle: {
    marginBottom: 16,
    color: theme.colors.onSurfaceVariant,
  },
  demoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: theme.colors.surface,
  },
});