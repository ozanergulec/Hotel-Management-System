import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { staffService } from '../services/api';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch (error) {
    return dateString;
  }
};

const StaffDetailsModal = ({ isVisible, staffId, onClose }) => {
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && staffId) {
      fetchStaffDetails();
    }
  }, [isVisible, staffId]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffService.getStaffById(staffId);
      setStaffDetails(data);
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError(err.message || 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'OE';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              <MaterialIcons name="person" size={20} color="#693FCC" /> Staff Details
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#693FCC" />
                <Text style={styles.loadingText}>Loading staff details...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchStaffDetails}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : staffDetails ? (
              <>
                <View style={styles.statusContainer}>
                  <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                      <Text style={styles.initials}>{getInitials(staffDetails.name)}</Text>
                    </View>
                    <View style={styles.nameSection}>
                      <Text style={styles.staffName}>{staffDetails.name}</Text>
                      <Text style={styles.staffPosition}>{staffDetails.position}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: staffDetails.status === 'Active' ? '#16A085' : '#7F8C8D' }
                  ]}>
                    <Text style={styles.statusText}>{staffDetails.status || 'Active'}</Text>
                  </View>
                </View>

                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="badge" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Staff ID:</Text>
                  <Text style={styles.infoValue}>{staffDetails.id}</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="email" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{staffDetails.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="phone" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{staffDetails.phone}</Text>
                </View>

                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionTitle}>Employment Information</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="business" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Department:</Text>
                  <Text style={styles.infoValue}>{staffDetails.department}</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="work" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Position/Role:</Text>
                  <Text style={styles.infoValue}>{staffDetails.position}</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="date-range" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Start Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(staffDetails.startDate)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MaterialIcons name="attach-money" size={20} color="#693FCC" />
                  </View>
                  <Text style={styles.infoLabel}>Salary:</Text>
                  <Text style={styles.infoValue}>{staffDetails.salary || 'N/A'}</Text>
                </View>
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No staff details available</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeFullButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#693FCC',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 15,
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#693FCC',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#693FCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  initials: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  nameSection: {
    flexDirection: 'column',
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  staffPosition: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#693FCC',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  closeFullButton: {
    alignItems: 'center',
    backgroundColor: '#693FCC',
    borderRadius: 4,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default StaffDetailsModal; 