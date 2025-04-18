import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  
  // Use the email from the context or params as a fallback
  const userEmail = user?.email || params.email || "user@example.com";
  
  const handleLogout = async () => {
    // Show confirmation dialog
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            console.log('Logging out...');
            await logout();
            console.log('Logged out, redirecting to login screen...');
            router.replace('/');
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Custom Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hotel Management System</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Greeting */}
        <Text style={styles.greeting}>Welcome to Hotel Management System</Text>
        <Text style={styles.userInfo}>Logged in as: {userEmail}</Text>
        
        {/* Daily Summary */}
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Rooms Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="hotel" size={24} color="#4C3A89" />
              <Text style={styles.statTitle}>Rooms</Text>
            </View>
            <Text style={styles.statValue}>45/120</Text>
            <Text style={styles.statSubtitle}>Available rooms</Text>
            <View style={styles.statDetails}>
              <Text style={styles.statDetailText}>45 available</Text>
              <Text style={styles.statDetailText}>68 occupied</Text>
              <Text style={styles.statDetailText}>7 maintenance</Text>
            </View>
          </View>
          
          {/* Check In/Out Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="swap-horiz" size={24} color="#4CAF50" />
              <Text style={styles.statTitle}>Check In/Out</Text>
            </View>
            <View style={styles.statDoubleValue}>
              <View style={styles.statDoubleItem}>
                <Text style={styles.statValue}>15</Text>
                <Text style={styles.statSubtitle}>Today's check-ins</Text>
              </View>
              <View style={styles.statDoubleItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statSubtitle}>Today's check-outs</Text>
              </View>
            </View>
          </View>
          
          {/* Revenue Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <FontAwesome5 name="dollar-sign" size={20} color="#2E7D32" />
              <Text style={styles.statTitle}>Revenue</Text>
            </View>
            <Text style={styles.statValue}>$24,500</Text>
            <Text style={styles.statSubtitle}>Today's revenue</Text>
            <Text style={styles.statDetail}>This month: $356,000</Text>
          </View>
          
          {/* Reservations Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="event-available" size={24} color="#1976D2" />
              <Text style={styles.statTitle}>Reservations</Text>
            </View>
            <Text style={styles.statValue}>32</Text>
            <Text style={styles.statSubtitle}>Next 7 days</Text>
          </View>
        </View>
        
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4C3A89' }]}
            onPress={() => router.push('/rooms')}
          >
            <MaterialIcons name="meeting-room" size={24} color="white" />
            <Text style={styles.actionButtonText}>VIEW ROOM STATUS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => router.push('/checkIn')}
          >
            <MaterialIcons name="login" size={24} color="white" />
            <Text style={styles.actionButtonText}>NEW CHECK-IN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#3949AB' }]}
            onPress={() => router.push('/checkOut')}
          >
            <MaterialIcons name="logout" size={24} color="white" />
            <Text style={styles.actionButtonText}>NEW CHECK-OUT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#1976D2' }]}
            onPress={() => router.push('/customerInfo')}
          >
            <MaterialIcons name="people" size={24} color="white" />
            <Text style={styles.actionButtonText}>CUSTOMER LIST</Text>
          </TouchableOpacity>
        </View>
        
        {/* Database Status */}
        <View style={styles.databaseStatus}>
          <Text style={styles.databaseTitle}>Database Status</Text>
          <View style={styles.databaseDetails}>
            <View style={styles.databaseItem}>
              <Text style={styles.databaseLabel}>Total Customers:</Text>
              <Text style={styles.databaseValue}>250</Text>
            </View>
            
            <View style={styles.databaseItem}>
              <Text style={styles.databaseLabel}>Last Update:</Text>
              <Text style={styles.databaseValue}>26.03.2025 22:54:30</Text>
            </View>
            
            <View style={styles.databaseItem}>
              <Text style={styles.databaseLabel}>Database Connection:</Text>
              <Text style={[styles.databaseValue, styles.activeStatus]}>Active</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2023 Hotel Management System - All Rights Reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6B3DC9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#555',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  statDetails: {
    marginTop: 10,
  },
  statDetailText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  statDoubleValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statDoubleItem: {
    width: '45%',
  },
  statDetail: {
    fontSize: 13,
    color: '#777',
    marginTop: 10,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C3A89',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
  },
  databaseStatus: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  databaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  databaseDetails: {
    marginBottom: 5,
  },
  databaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  databaseLabel: {
    color: '#555',
    fontSize: 14,
  },
  databaseValue: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#777',
    fontSize: 12,
  },
});
