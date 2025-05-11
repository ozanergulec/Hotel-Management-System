import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert
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
  const [activeTab, setActiveTab] = useState('Staff Information');
  
  // Shift schedule states
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [weeklySchedule, setWeeklySchedule] = useState({
    Monday: { assigned: false, time: '', shiftId: null },
    Tuesday: { assigned: false, time: '', shiftId: null },
    Wednesday: { assigned: false, time: '', shiftId: null },
    Thursday: { assigned: false, time: '', shiftId: null },
    Friday: { assigned: false, time: '', shiftId: null },
    Saturday: { assigned: false, time: '', shiftId: null },
    Sunday: { assigned: false, time: '', shiftId: null },
  });
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [shiftsError, setShiftsError] = useState(null);
  const [addingShift, setAddingShift] = useState(false);

  useEffect(() => {
    if (isVisible && staffId) {
      fetchStaffDetails();
      fetchStaffShifts();
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

  const fetchStaffShifts = async () => {
    if (!staffId) return;
    
    try {
      setShiftsLoading(true);
      setShiftsError(null);
      // Call the API to get staff shifts
      const shifts = await staffService.getStaffShifts(staffId);
      
      console.log('Received shifts from API:', shifts);
      
      // Reset the schedule
      const newSchedule = {
        Monday: { assigned: false, time: '', shiftId: null },
        Tuesday: { assigned: false, time: '', shiftId: null },
        Wednesday: { assigned: false, time: '', shiftId: null },
        Thursday: { assigned: false, time: '', shiftId: null },
        Friday: { assigned: false, time: '', shiftId: null },
        Saturday: { assigned: false, time: '', shiftId: null },
        Sunday: { assigned: false, time: '', shiftId: null },
      };
      
      // Process shifts data from API
      if (Array.isArray(shifts)) {
        shifts.forEach(shift => {
          // Get the day from the response
          const day = shift.dayOfTheWeek;
          
          if (newSchedule[day]) {
            // Format the times for display
            let startTimeStr = shift.startTime || "09:00:00";
            let endTimeStr = shift.endTime || "17:00:00";
            
            // Remove seconds if present for cleaner display
            if (startTimeStr.includes(':')) {
              const parts = startTimeStr.split(':');
              if (parts.length === 3) {
                startTimeStr = `${parts[0]}:${parts[1]}`;
              }
            }
            
            if (endTimeStr.includes(':')) {
              const parts = endTimeStr.split(':');
              if (parts.length === 3) {
                endTimeStr = `${parts[0]}:${parts[1]}`;
              }
            }
            
            newSchedule[day] = {
              assigned: true,
              time: `${startTimeStr} - ${endTimeStr}`,
              shiftId: shift.id
            };
          }
        });
      }
      
      console.log('Processed schedule:', newSchedule);
      setWeeklySchedule(newSchedule);
    } catch (err) {
      console.error('Error fetching staff shifts:', err);
      setShiftsError(err.message || 'Failed to load shifts');
    } finally {
      setShiftsLoading(false);
    }
  };

  // Make sure time inputs follow the HH:mm:ss format
  const validateTimeFormat = (time) => {
    // If time is already in HH:mm:ss format, return it
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time;
    }
    
    // If time is in HH:mm format, add seconds
    if (/^\d{2}:\d{2}$/.test(time)) {
      return `${time}:00`;
    }
    
    // Default to a valid time format
    return "09:00:00";
  };

  const handleAddShift = async () => {
    if (!staffId) return;
    
    try {
      setAddingShift(true);
      
      // Make sure time inputs are properly formatted
      const formattedStartTime = validateTimeFormat(startTime);
      const formattedEndTime = validateTimeFormat(endTime);
      
      console.log(`Adding shift for ${selectedDay} from ${formattedStartTime} to ${formattedEndTime}`);
      
      // Collect all existing shifts plus the new or updated one
      // This ensures we don't lose existing shifts when adding a new one
      const allShifts = [];
      
      // Add all existing shifts except the one we're updating (if it exists)
      Object.entries(weeklySchedule).forEach(([day, dayShift]) => {
        if (dayShift.assigned && day !== selectedDay) {
          // For existing shifts, keep the same times (though they're not actually used in this implementation)
          allShifts.push({
            dayOfWeek: day
            // No need to include time values as they'll be set to fixed values in the API service
          });
        }
      });
      
      // Add the new or updated shift
      allShifts.push({
        dayOfWeek: selectedDay
        // No need to include time values as they'll be set to fixed values in the API service
      });
      
      console.log('Sending all shifts:', JSON.stringify(allShifts));
      
      // Add or update with all shifts
      await staffService.updateAllShifts(staffId, allShifts);
      
      // Show success message
      const existingShift = weeklySchedule[selectedDay];
      if (existingShift && existingShift.assigned) {
        Alert.alert('Success', `Shift for ${selectedDay} has been updated.`);
      } else {
        Alert.alert('Success', `New shift for ${selectedDay} has been added.`);
      }
      
      // Refresh shifts to see changes
      await fetchStaffShifts();
      
    } catch (err) {
      console.error('Error adding/updating shift:', err);
      Alert.alert('Error', err.message || 'Failed to add/update shift');
    } finally {
      setAddingShift(false);
    }
  };

  const handleDayShiftAdd = (day) => {
    setSelectedDay(day);
    const daySchedule = weeklySchedule[day];
    
    if (daySchedule && daySchedule.assigned) {
      // Parse existing time format "HH:MM - HH:MM"
      const [start, end] = daySchedule.time.split(' - ');
      setStartTime(start);
      setEndTime(end);
    } else {
      // Default values
      setStartTime('09:00');
      setEndTime('17:00');
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

  const renderStaffInformation = () => (
    <>
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
  );

  const renderShiftSchedule = () => (
    <>
      {shiftsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#693FCC" />
          <Text style={styles.loadingText}>Loading shift schedule...</Text>
        </View>
      ) : shiftsError ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#E74C3C" />
          <Text style={styles.errorText}>{shiftsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStaffShifts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.shiftSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color="#693FCC" />
            <Text style={styles.shiftSectionTitle}>Current Shift Schedule</Text>
          </View>

          <View style={styles.addShiftContainer}>
            <TouchableOpacity style={styles.addShiftHeader}>
              <MaterialIcons name="add" size={18} color="#693FCC" />
              <Text style={styles.addShiftText}>Add/Update Shift</Text>
            </TouchableOpacity>

            <View style={styles.shiftInputRow}>
              <View style={styles.shiftInputGroup}>
                <Text style={styles.shiftInputLabel}>Day</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => {
                    Alert.alert(
                      "Select Day",
                      "Choose a day for the shift",
                      [
                        { text: "Monday", onPress: () => setSelectedDay("Monday") },
                        { text: "Tuesday", onPress: () => setSelectedDay("Tuesday") },
                        { text: "Wednesday", onPress: () => setSelectedDay("Wednesday") },
                        { text: "Thursday", onPress: () => setSelectedDay("Thursday") },
                        { text: "Friday", onPress: () => setSelectedDay("Friday") },
                        { text: "Saturday", onPress: () => setSelectedDay("Saturday") },
                        { text: "Sunday", onPress: () => setSelectedDay("Sunday") },
                        { text: "Cancel", style: "cancel" }
                      ]
                    );
                  }}
                >
                  <Text>{selectedDay}</Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.shiftInputGroup}>
                <Text style={styles.shiftInputLabel}>Start Time</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput 
                    style={styles.timeInput} 
                    value={startTime} 
                    onChangeText={(text) => setStartTime(text)}
                    placeholder="09:00:00"
                    keyboardType="numbers-and-punctuation"
                  />
                  <MaterialIcons name="schedule" size={18} color="#693FCC" />
                </View>
              </View>

              <View style={styles.shiftInputGroup}>
                <Text style={styles.shiftInputLabel}>End Time</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput 
                    style={styles.timeInput} 
                    value={endTime} 
                    onChangeText={(text) => setEndTime(text)}
                    placeholder="17:00:00"
                    keyboardType="numbers-and-punctuation"
                  />
                  <MaterialIcons name="schedule" size={18} color="#693FCC" />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.addShiftButton, addingShift && styles.disabledButton]} 
              onPress={handleAddShift}
              disabled={addingShift}
            >
              {addingShift ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="add" size={18} color="white" />
                  <Text style={styles.addShiftButtonText}>ADD SHIFT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.weeklyScheduleContainer}>
            <Text style={styles.weeklyScheduleTitle}>Weekly Schedule</Text>
            
            <View style={styles.scheduleGrid}>
              {Object.entries(weeklySchedule).map(([day, { assigned, time }]) => (
                <View key={day} style={styles.dayScheduleCard}>
                  <Text style={styles.dayName}>{day}</Text>
                  
                  {assigned ? (
                    <View style={styles.assignedShiftContainer}>
                      <MaterialIcons name="schedule" size={16} color="#693FCC" />
                      <Text style={styles.assignedShiftTime}>{time}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noShiftText}>No shift assigned</Text>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.dayAddButton}
                    onPress={() => handleDayShiftAdd(day)}
                  >
                    <MaterialIcons name={assigned ? "edit" : "add"} size={16} color="#693FCC" />
                    <Text style={styles.dayAddButtonText}>
                      {assigned ? 'EDIT SHIFT' : 'ADD SHIFT'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  );

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

              <View style={styles.tabsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'Staff Information' && styles.activeTabButton
                  ]}
                  onPress={() => setActiveTab('Staff Information')}
                >
                  <MaterialIcons 
                    name="info" 
                    size={18} 
                    color={activeTab === 'Staff Information' ? '#693FCC' : '#666'} 
                  />
                  <Text style={[
                    styles.tabButtonText,
                    activeTab === 'Staff Information' && styles.activeTabText
                  ]}>
                    Staff Information
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'Shift Schedule' && styles.activeTabButton
                  ]}
                  onPress={() => setActiveTab('Shift Schedule')}
                >
                  <MaterialIcons 
                    name="schedule" 
                    size={18} 
                    color={activeTab === 'Shift Schedule' ? '#693FCC' : '#666'} 
                  />
                  <Text style={[
                    styles.tabButtonText,
                    activeTab === 'Shift Schedule' && styles.activeTabText
                  ]}>
                    Shift Schedule
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {activeTab === 'Staff Information' ? renderStaffInformation() : renderShiftSchedule()}
              </ScrollView>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No staff details available</Text>
            </View>
          )}

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
    maxHeight: '90%',
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: '#693FCC',
  },
  tabButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#693FCC',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 15,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
    marginBottom: 15,
    marginTop: 10,
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
  // Shift Schedule styles
  shiftSection: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shiftSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#693FCC',
    marginLeft: 5,
  },
  addShiftContainer: {
    backgroundColor: '#F8F8FF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  addShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addShiftText: {
    fontWeight: 'bold',
    color: '#693FCC',
    marginLeft: 5,
    fontSize: 15,
  },
  shiftInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  shiftInputGroup: {
    width: '30%',
  },
  shiftInputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 8,
    height: 40,
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: 8,
    height: 40,
  },
  timeInput: {
    flex: 1,
    fontSize: 14,
  },
  addShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#693FCC',
    borderRadius: 4,
    padding: 10,
  },
  disabledButton: {
    backgroundColor: '#9F8DC7',
  },
  addShiftButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  weeklyScheduleContainer: {
    marginTop: 10,
  },
  weeklyScheduleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayScheduleCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dayName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noShiftText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  assignedShiftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignedShiftTime: {
    fontSize: 13,
    color: '#693FCC',
    marginLeft: 5,
    fontWeight: '500',
  },
  dayAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#693FCC',
    borderRadius: 4,
    padding: 5,
  },
  dayAddButtonText: {
    color: '#693FCC',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 3,
  },
});

export default StaffDetailsModal; 