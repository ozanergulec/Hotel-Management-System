import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error, isAuthenticated, autoLoginDisabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // If user is already authenticated and auto login is not disabled, navigate to dashboard
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Clear any saved credentials initially to prevent auto-login
      if (!isAuthenticated) {
        await AsyncStorage.setItem('autoLoginDisabled', 'true');
      }
      
      if (isAuthenticated && !autoLoginDisabled) {
        console.log('User is authenticated and auto login enabled, redirecting to dashboard');
        router.replace('/(tabs)');
      } else {
        console.log('Not auto-redirecting: isAuthenticated =', isAuthenticated, 'autoLoginDisabled =', autoLoginDisabled);
      }
    };
    
    checkAuthStatus();
  }, [isAuthenticated, autoLoginDisabled, router]);
  
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      console.log('Attempting login...');
      await login(email, password);
      
      console.log('Login successful, navigating to dashboard...');
      router.replace('/(tabs)');
    } catch (error) {
      console.log('Login failed:', error.message);
      
      // Show error alert
      Alert.alert(
        'Login Failed', 
        'Invalid email or password. Please check your credentials and try again.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4527A0', '#5E35B1', '#3949AB']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Welcome to Hotel Management System</Text>
        </View>
        
        <View style={styles.cardContainer}>
          <Text style={styles.title}>Login</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#6B3DC9',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 