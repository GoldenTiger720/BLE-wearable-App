import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/auth';
import { useAppStore } from '../../store';
import { theme } from '../../utils/theme';

const { width } = Dimensions.get('window');

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const setAuth = useAppStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 0.25;
    if (password.length >= 10) strength += 0.25;
    if (/[A-Z]/.test(password)) strength += 0.25;
    if (/[0-9]/.test(password)) strength += 0.25;
    return Math.min(strength, 1);
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 0.33) return theme.colors.error;
    if (strength < 0.67) return '#FF9800';
    return theme.colors.secondary;
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 0.33) return 'Weak';
    if (strength < 0.67) return 'Medium';
    return 'Strong';
  };

  const handleSignUp = async () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.signUp(email, password, name);
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
        Alert.alert('Welcome!', `Account created successfully for ${name}`);
      } else {
        Alert.alert('Sign Up Failed', response.message || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
        <View style={styles.backgroundShape2} />
        
        <View style={styles.header}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          
          <View style={styles.iconContainer}>
            <IconButton 
              icon="account-plus" 
              size={48} 
              iconColor={theme.colors.primary}
              style={styles.mainIcon}
            />
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            Join WearableAI
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Start your intelligent health journey today
          </Text>
        </View>

        <Surface style={styles.card} elevation={3}>
          <Text variant="headlineSmall" style={styles.cardTitle}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.cardSubtitle}>
            Fill in your details to get started
          </Text>

          <TextInput
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            mode="outlined"
            autoCapitalize="words"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Email Address"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
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

          {formData.password.length > 0 && (
            <View style={styles.passwordStrength}>
              <View style={styles.strengthHeader}>
                <Text variant="bodySmall" style={styles.strengthLabel}>
                  Password Strength
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={[
                    styles.strengthText, 
                    { color: getPasswordStrengthColor(passwordStrength) }
                  ]}
                >
                  {getPasswordStrengthText(passwordStrength)}
                </Text>
              </View>
              <ProgressBar 
                progress={passwordStrength} 
                color={getPasswordStrengthColor(passwordStrength)}
                style={styles.progressBar}
              />
            </View>
          )}

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon 
                icon={showConfirmPassword ? "eye-off" : "eye"} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={isLoading}
            disabled={isLoading}
            style={styles.signUpButton}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>

          <View style={styles.signInContainer}>
            <Text variant="bodyMedium" style={styles.signInText}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              compact
              style={styles.signInButton}
            >
              Sign In
            </Button>
          </View>
        </Surface>

        <View style={styles.features}>
          <Text variant="titleSmall" style={styles.featuresTitle}>
            What you'll get:
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <IconButton icon="brain" size={20} iconColor={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.featureText}>
                AI-powered health insights
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconButton icon="heart-pulse" size={20} iconColor={theme.colors.secondary} />
              <Text variant="bodyMedium" style={styles.featureText}>
                Real-time health monitoring
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconButton icon="chart-line" size={20} iconColor={theme.colors.tertiary} />
              <Text variant="bodyMedium" style={styles.featureText}>
                Personalized recommendations
              </Text>
            </View>
          </View>
        </View>
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
    top: -80,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${theme.colors.secondary}10`,
  },
  backgroundShape2: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.tertiary}10`,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: -12,
    top: -8,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 32,
    padding: 8,
  },
  mainIcon: {
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
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  passwordStrength: {
    marginBottom: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  strengthText: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  signUpButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    color: theme.colors.onSurfaceVariant,
  },
  signInButton: {
    marginLeft: -8,
  },
  features: {
    paddingHorizontal: 16,
  },
  featuresTitle: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 12,
  },
  featureText: {
    marginLeft: 8,
    color: theme.colors.onSurface,
    flex: 1,
  },
});