import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

interface SignUpResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

// Mock users for demo
const mockUsers = [
  { id: '1', email: 'demo@example.com', password: 'password123', name: 'Demo User' },
  { id: '2', email: 'john@wearable.com', password: 'health123', name: 'John Doe' },
  { id: '3', email: 'sarah@fitness.com', password: 'fitness456', name: 'Sarah Smith' },
];

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.password !== password) {
      return { 
        success: false, 
        message: 'Invalid email or password' 
      };
    }

    // Generate mock JWT token
    const token = `mock-jwt-${Date.now()}-${user.id}`;
    
    // Store token
    await AsyncStorage.setItem('@auth_token', token);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async signUp(email: string, password: string, name: string): Promise<SignUpResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return { 
        success: false, 
        message: 'User already exists with this email' 
      };
    }

    // Create new user
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      email: email.toLowerCase(),
      password,
      name,
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Generate mock JWT token
    const token = `mock-jwt-${Date.now()}-${newUser.id}`;
    
    // Store token
    await AsyncStorage.setItem('@auth_token', token);

    return {
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    };
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem('@auth_token');
  }

  static async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('@auth_token');
  }
}