import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Colors from '../../constants/Colors';
import roomService from '../../services/roomService';

export default function RoomsScreen() {
  const params = useLocalSearchParams();
  const username = params.username || "Utku Adanur";
  
  const [activeView, setActiveView] = useState('card'); // 'card' or 'calendar'
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState(''); // 'start' or 'end'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarViewRange, setCalendarViewRange] = useState({
    start: new Date(2025, 3, 16), // April 16, 2025
    end: new Date(2025, 3, 30) // April 30, 2025
  });
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [reservationRoom, setReservationRoom] = useState(null);
  const [reservationDates, setReservationDates] = useState({ start: '', end: '' });
  const [customerIdNumber, setCustomerIdNumber] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [showReservationDateModal, setShowReservationDateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Room data state
  const [rooms, setRooms] = useState([]);

  // All available features for filtering
  const availableFeatures = ['TV', 'Minibar', 'Wi-Fi', 'Balkon', 'Deniz Manzarası', 'Jakuzi'];

  // Fetch rooms data from API on component mount
  useEffect(() => {
    fetchRooms();
  }, [startDate, endDate]); // Re-fetch rooms when date filters change

  // Function to fetch rooms from API
  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Prepare filter parameters
      const params = {};
      
      // Add date filters if available
      if (startDate) {
        // Convert DD.MM.YYYY to YYYY-MM-DD
        const [day, month, year] = startDate.split('.');
        params.AvailabilityStartDate = `${year}-${month}-${day}`;
      }
      
      if (endDate) {
        // Convert DD.MM.YYYY to YYYY-MM-DD
        const [day, month, year] = endDate.split('.');
        params.AvailabilityEndDate = `${year}-${month}-${day}`;
      }
      
      // Add maintenance filter if needed
      if (statusFilter === 'Bakımda') {
        params.IsOnMaintenance = true;
      }
      
      // Get rooms from API
      const response = await roomService.getAllRooms(params);
      
      // Transform API response to match our UI format
      const formattedRooms = response.data.map(room => roomService.formatRoomData(room));
      
      console.log("Formatted rooms (first 2):", formattedRooms.slice(0, 2).map(r => ({id: r.id, roomNumber: r.roomNumber})));
      setRooms(formattedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Odalar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh room data
  const refreshRooms = () => {
    fetchRooms();
  };

  // Function to parse date string to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filter the rooms based on search text, status filter, and other filters
  const filteredRooms = rooms.filter(room => {
    // Filter by search text (room number)
    if (searchText && !room.id.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'Tümü') {
      const statusMap = {
        'Müsait': 'available',
        'Dolu': 'occupied',
        'Bakımda': 'maintenance'
      };
      
      // Get actual status based on current data
      let actualStatus = room.status;
      
      if (actualStatus !== statusMap[statusFilter]) {
        return false;
      }
    }
    
    // Filter by selected features/amenities
    if (selectedFeatures.length > 0) {
      for (const feature of selectedFeatures) {
        if (!room.amenities.includes(feature)) {
          return false;
        }
      }
    }
    
    // Apply date range filtering if specified
    if (startDate || endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const searchStartDate = startDate ? parseDate(startDate) : today;
      const searchEndDate = endDate ? parseDate(endDate) : null;
      
      // Check if room has checkout date or maintenance completion date
      if (room.status === 'occupied') {
        const checkoutDate = parseDate(room.checkOut);
        
        // If checkout date is set and before our search start date
        // then this room will be available for the dates we're looking for
        if (checkoutDate && checkoutDate < searchStartDate) {
          return true; // Room will be available by our desired start date
        }
      } else if (room.status === 'maintenance') {
        const completionDate = parseDate(room.expectedCompletion);
        
        // If maintenance completion date is set and before our search start date
        // then this room will be available for the dates we're looking for
        if (completionDate && completionDate < searchStartDate) {
          return true; // Room will be available by our desired start date
        }
      }
    }
    
    return true;
  });
  
  // For Calendar view, filter by date availability
  const isRoomAvailableForDate = (room, date) => {
    // Format date for comparison
    const formatDate = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if room is under maintenance
    if (room.maintenanceIssueDescription) {
      const completionDate = parseDate(room.expectedCompletion);
      // If maintenance ends before or on this date, room will be available
      if (completionDate && completionDate <= currentDate) {
        return true;
      } else if (!completionDate) {
        // No completion date means indefinite maintenance
        return false;
      } else {
        return false; // Still under maintenance on this date
      }
    }
    
    // Check if room is occupied
    if (room.currentReservationId) {
      const checkoutDate = parseDate(room.checkOut);
      // If guest checks out before or on this date, room will be available
      if (checkoutDate && checkoutDate <= currentDate) {
        return true;
      } else {
        return false; // Still occupied on this date
      }
    }
    
    // If not under maintenance or occupied, room is available
    return true;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CAF50'; // Green
      case 'occupied':
        return '#E53935'; // Red
      case 'maintenance':
        return '#FF9800'; // Orange
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'occupied':
        return 'Dolu';
      case 'maintenance':
        return 'Bakımda';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return 'meeting-room';
      case 'occupied':
        return 'person';
      case 'maintenance':
        return 'build';
      default:
        return 'help-outline';
    }
  };

  const showRoomDetails = (room) => {
    // Check if we're looking at a future date 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const searchStartDate = startDate ? parseDate(startDate) : today;
    
    // Deep copy the room to modify without affecting the original
    const roomCopy = JSON.parse(JSON.stringify(room));
    
    // If we're looking at a future date, recalculate the status
    if (searchStartDate > today) {
      if (roomCopy.status === 'occupied') {
        const checkoutDate = parseDate(roomCopy.checkOut);
        if (checkoutDate && checkoutDate < searchStartDate) {
          // Room will be available by our search date
          roomCopy.status = 'available';
          roomCopy.futureDateInfo = {
            originalStatus: 'occupied',
            availableFrom: roomCopy.checkOut,
            searchDate: startDate
          };
        }
      } else if (roomCopy.status === 'maintenance') {
        const completionDate = parseDate(roomCopy.expectedCompletion);
        if (completionDate && completionDate < searchStartDate) {
          // Room will be available by our search date
          roomCopy.status = 'available';
          roomCopy.futureDateInfo = {
            originalStatus: 'maintenance',
            availableFrom: roomCopy.expectedCompletion,
            searchDate: startDate
          };
        }
      }
    }
    
    setSelectedRoom(roomCopy);
    setModalVisible(true);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
    
    // Update active filters
    const newFilters = [...activeFilters.filter(f => f.type !== 'status')];
    if (status !== 'Tümü') {
      newFilters.push({ type: 'status', value: status });
    }
    setActiveFilters(newFilters);
  };

  const handleFeatureToggle = (feature) => {
    let newSelectedFeatures;
    if (selectedFeatures.includes(feature)) {
      // Remove the feature
      newSelectedFeatures = selectedFeatures.filter(f => f !== feature);
    } else {
      // Add the feature
      newSelectedFeatures = [...selectedFeatures, feature];
    }
    setSelectedFeatures(newSelectedFeatures);
    
    // Update active filters
    const newFilters = [...activeFilters.filter(f => f.type !== 'feature' || !f.value.includes(feature))];
    if (!selectedFeatures.includes(feature)) {
      newFilters.push({ type: 'feature', value: feature });
    }
    setActiveFilters(newFilters);
  };

  const handleDateChange = (date, type) => {
    if (type === 'start') {
      setStartDate(date);
      // Update active filters
      const newFilters = [...activeFilters.filter(f => f.type !== 'startDate')];
      if (date) {
        newFilters.push({ type: 'startDate', value: date });
      }
      setActiveFilters(newFilters);
    } else {
      setEndDate(date);
      // Update active filters
      const newFilters = [...activeFilters.filter(f => f.type !== 'endDate')];
      if (date) {
        newFilters.push({ type: 'endDate', value: date });
      }
      setActiveFilters(newFilters);
    }
  };

  const removeFilter = (filterToRemove) => {
    const newFilters = activeFilters.filter(filter => 
      !(filter.type === filterToRemove.type && filter.value === filterToRemove.value)
    );
    setActiveFilters(newFilters);
    
    // Also update the corresponding state
    if (filterToRemove.type === 'status') {
      setStatusFilter('Tümü');
    } else if (filterToRemove.type === 'feature') {
      setSelectedFeatures(selectedFeatures.filter(f => f !== filterToRemove.value));
    } else if (filterToRemove.type === 'startDate') {
      setStartDate('');
    } else if (filterToRemove.type === 'endDate') {
      setEndDate('');
    }
  };

  const clearAllFilters = () => {
    setSearchText('');
    setStatusFilter('Tümü');
    setSelectedFeatures([]);
    setStartDate('');
    setEndDate('');
    setActiveFilters([]);
  };
  
  const openCalendar = (type) => {
    setCalendarType(type);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    // Format the date as DD.MM.YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    
    if (calendarType === 'start') {
      handleDateChange(formattedDate, 'start');
    } else if (calendarType === 'end') {
      handleDateChange(formattedDate, 'end');
    } else if (calendarType === 'reservationStart') {
      setReservationDates(prev => ({ ...prev, start: formattedDate }));
    } else if (calendarType === 'reservationEnd') {
      setReservationDates(prev => ({ ...prev, end: formattedDate }));
    }
    
    setShowCalendar(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysArray = [];
    
    // Add empty spaces for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push({ day: '', date: null });
    }
    
    // Add all days of the month
    for (let i = 1; i <= days; i++) {
      daysArray.push({ 
        day: i, 
        date: new Date(year, month, i)
      });
    }
    
    return daysArray;
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    if (!showCalendar) return null;
    
    const daysOfWeek = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const monthDays = getDaysInMonth(currentMonth);
    const month = currentMonth.toLocaleString('tr-TR', { month: 'long' });
    const year = currentMonth.getFullYear();
    
    // Parse currently selected date (if any)
    const parseSelectedDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('.').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const selectedDate = calendarType === 'start' 
      ? parseSelectedDate(startDate) 
      : parseSelectedDate(endDate);
    
    // Check if a date is today
    const isToday = (date) => {
      if (!date) return false;
      const today = new Date();
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    };
    
    // Check if a date is the selected date
    const isSelectedDate = (date) => {
      if (!date || !selectedDate) return false;
      return date.getDate() === selectedDate.getDate() && 
             date.getMonth() === selectedDate.getMonth() && 
             date.getFullYear() === selectedDate.getFullYear();
    };
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {calendarType === 'start' ? 'Başlangıç Tarihi' : 'Bitiş Tarihi'}
              </Text>
              <TouchableOpacity 
                style={styles.closeCalendarButton}
                onPress={() => setShowCalendar(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <MaterialIcons name="chevron-left" size={24} color="#6B3DC9" />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>{`${month} ${year}`}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <MaterialIcons name="chevron-right" size={24} color="#6B3DC9" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.daysOfWeek}>
              {daysOfWeek.map(day => (
                <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {monthDays.map((item, index) => {
                const isSelected = item.date && isSelectedDate(item.date);
                const isTodayDate = item.date && isToday(item.date);
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.dayCell,
                      item.day ? styles.validDay : styles.emptyDay,
                      isSelected && styles.selectedDay,
                      isTodayDate && styles.todayDay
                    ]}
                    disabled={!item.day}
                    onPress={() => item.day ? handleDateSelect(item.date) : null}
                  >
                    <Text 
                      style={[
                        styles.dayText,
                        item.day ? styles.validDayText : styles.emptyDayText,
                        isSelected && styles.selectedDayText,
                        isTodayDate && styles.todayDayText
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.calendarActions}>
              <TouchableOpacity 
                style={[styles.calendarButton, { backgroundColor: '#f0f0f0' }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: '#666' }]}>İPTAL</Text>
              </TouchableOpacity>
              
              {(calendarType === 'start' ? startDate : endDate) && (
                <TouchableOpacity 
                  style={[styles.calendarButton, { backgroundColor: '#FEE8E7' }]}
                  onPress={() => {
                    if (calendarType === 'start') {
                      handleDateChange('', 'start');
                    } else {
                      handleDateChange('', 'end');
                    }
                    setShowCalendar(false);
                  }}
                >
                  <Text style={[styles.calendarButtonText, { color: '#E53935' }]}>TEMİZLE</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.calendarButton, { backgroundColor: '#6B3DC9', flex: 1 }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: 'white' }]}>TAMAM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleReservation = (room) => {
    // Log room object to help debug
    console.log("Room for reservation:", JSON.stringify(room, null, 2));
    
    // Check if date range is already selected
    if (!startDate || !endDate) {
      // If dates aren't selected, open the reservation date modal first
      setReservationRoom(room);
      setReservationDates({ start: '', end: '' });
      setShowReservationDateModal(true);
    } else {
      // If dates are already selected, proceed directly to guest name
      setReservationRoom(room);
      setReservationDates({ start: startDate, end: endDate });
      setCustomerIdNumber('');
      setNumberOfGuests('2');
      setReservationModalVisible(true);
    }
  };

  const confirmReservation = async () => {
    if (!customerIdNumber.trim()) {
      Alert.alert('Hata', 'Lütfen müşteri TC Kimlik No girin.');
      return;
    }
    
    if (!reservationDates.start || !reservationDates.end) {
      Alert.alert('Hata', 'Lütfen giriş ve çıkış tarihlerini seçin.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Reservation dates:", reservationDates);
      
      // Format dates for API (DD.MM.YYYY to YYYY-MM-DD)
      const formatDateForApi = (dateStr) => {
        // Parse DD.MM.YYYY format
        const parts = dateStr.split('.');
        if (parts.length !== 3) {
          console.error("Invalid date format:", dateStr);
          return null;
        }
        
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Return in YYYY-MM-DD format
        return `${year}-${month}-${day}`;
      };
      
      // Create reservation payload
      const reservationData = {
        roomId: reservationRoom.id,
        customerIdNumber: customerIdNumber.trim(),
        checkInDate: formatDateForApi(reservationDates.start),
        checkOutDate: formatDateForApi(reservationDates.end),
        numberOfGuests: parseInt(numberOfGuests) || 1
      };
      
      console.log("Sending reservation data:", reservationData);
      
      // Call API to create reservation
      try {
        const response = await roomService.reserveRoom(reservationData);
        console.log("Reservation response:", response);
        
        // Close modal
        setReservationModalVisible(false);
        
        // Clear date filters after reservation
        setStartDate('');
        setEndDate('');
        setActiveFilters(activeFilters.filter(filter => 
          filter.type !== 'startDate' && filter.type !== 'endDate'
        ));
        
        // Show confirmation
        Alert.alert(
          'Başarılı', 
          `Oda ${reservationRoom.roomNumber || reservationRoom.id} başarıyla rezerve edildi.`,
          [{ text: 'Tamam', onPress: () => refreshRooms() }]
        );
      } catch (error) {
        console.error('API error:', error);
        let errorMessage = 'Rezervasyon yapılırken bir hata oluştu.';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Rezervasyon Hatası', errorMessage);
      }
    } catch (error) {
      console.error('Reservation error:', error);
      Alert.alert('Hata', 'Rezervasyon yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderReservationModal = () => {
    if (!reservationRoom) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={reservationModalVisible}
        onRequestClose={() => setReservationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.reservationModalContent}>
            <View style={styles.reservationModalHeader}>
              <Text style={styles.reservationModalTitle}>Oda {reservationRoom.id} için Rezervasyon</Text>
              <TouchableOpacity onPress={() => setReservationModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reservationModalBody}>
              {/* TC Kimlik No */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="person" size={18} color="#666" /> Müşteri TC Kimlik No:
                </Text>
                <TextInput
                  style={styles.reservationTextInput}
                  placeholder="11 Haneli TC Kimlik No"
                  value={customerIdNumber}
                  onChangeText={setCustomerIdNumber}
                  keyboardType="number-pad"
                  maxLength={11}
                />
              </View>
              
              {/* Giriş Tarihi */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="calendar-today" size={18} color="#666" /> Giriş Tarihi:
                </Text>
                <TouchableOpacity 
                  style={styles.reservationDateInput}
                  onPress={() => {
                    setCalendarType('reservationStart');
                    setShowCalendar(true);
                  }}
                >
                  <Text>{reservationDates.start || 'GG.AA.YYYY'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Çıkış Tarihi */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="calendar-today" size={18} color="#666" /> Çıkış Tarihi:
                </Text>
                <TouchableOpacity 
                  style={styles.reservationDateInput}
                  onPress={() => {
                    setCalendarType('reservationEnd');
                    setShowCalendar(true);
                  }}
                >
                  <Text>{reservationDates.end || 'GG.AA.YYYY'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Misafir Sayısı */}
              <View style={styles.reservationInputGroup}>
                <Text style={styles.reservationInputLabel}>
                  <MaterialIcons name="people" size={18} color="#666" /> Misafir Sayısı:
                </Text>
                <TextInput
                  style={styles.reservationTextInput}
                  placeholder="Misafir sayısı"
                  value={numberOfGuests}
                  onChangeText={setNumberOfGuests}
                  keyboardType="number-pad"
                />
              </View>
              
              {/* İşlem Butonları */}
              <View style={styles.reservationButtonContainer}>
                <TouchableOpacity 
                  style={styles.reservationCancelBtn}
                  onPress={() => setReservationModalVisible(false)}
                >
                  <Text style={styles.reservationCancelBtnText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reservationCreateBtn}
                  onPress={confirmReservation}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="event-available" size={18} color="white" />
                      <Text style={styles.reservationCreateBtnText}>Rezervasyon Oluştur</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderReservationDateModal = () => {
    if (!reservationRoom) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReservationDateModal}
        onRequestClose={() => setShowReservationDateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rezervasyon Tarihleri: Oda {reservationRoom.id}</Text>
              <TouchableOpacity onPress={() => setShowReservationDateModal(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Rezervasyon Tarihi Seçin</Text>
              
              <View style={styles.dateFilterRow}>
                <View style={[styles.dateFilter, { width: '48%' }]}>
                  <Text style={styles.smallLabel}>Giriş Tarihi</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setCalendarType('reservationStart');
                      setShowCalendar(true);
                    }}
                  >
                    <Text>{reservationDates.start || 'GG.AA.YYYY'}</Text>
                    <MaterialIcons name="calendar-today" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.dateFilter, { width: '48%' }]}>
                  <Text style={styles.smallLabel}>Çıkış Tarihi</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setCalendarType('reservationEnd');
                      setShowCalendar(true);
                    }}
                  >
                    <Text>{reservationDates.end || 'GG.AA.YYYY'}</Text>
                    <MaterialIcons name="calendar-today" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelReservationButton}
                  onPress={() => setShowReservationDateModal(false)}
                >
                  <Text style={styles.cancelText}>İPTAL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmReservationButton}
                  onPress={handleReservationDateSelect}
                >
                  <Text style={styles.confirmText}>DEVAM ET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleReservationDateSelect = () => {
    if (!reservationDates.start || !reservationDates.end) {
      alert('Lütfen hem giriş hem de çıkış tarihini seçin.');
      return;
    }
    
    setShowReservationDateModal(false);
    setCustomerIdNumber('');
    setNumberOfGuests('2');
    setReservationModalVisible(true);
  };

  const renderRoomCard = ({ item }) => {
    // Check if the room is actually available for the selected dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const searchStartDate = startDate ? parseDate(startDate) : today;
    
    // Determine actual status for display
    let displayStatus = item.status;
    
    // If we're looking at a future date, recalculate the status
    if (searchStartDate > today) {
      if (item.status === 'occupied') {
        const checkoutDate = parseDate(item.checkOut);
        if (checkoutDate && checkoutDate < searchStartDate) {
          // Room will be available by our search date
          displayStatus = 'available';
        }
      } else if (item.status === 'maintenance') {
        const completionDate = parseDate(item.expectedCompletion);
        if (completionDate && completionDate < searchStartDate) {
          // Room will be available by our search date
          displayStatus = 'available';
        }
      }
    }
    
    // Status color based on actual status
    const statusColor = 
      displayStatus === 'occupied' ? '#E53935' :  // Red if reserved
      displayStatus === 'maintenance' ? '#FF9800' :  // Yellow if in maintenance
      '#4CAF50';  // Green if available
      
    // Determine whether to show reservation button
    const canReserve = displayStatus === 'available';
    
    return (
      <View style={styles.roomCard}>
        <View style={[
          styles.roomHeader, 
          { backgroundColor: statusColor }
        ]}>
          <Text style={styles.roomNumber}>{item.roomNumber || item.id}</Text>
          <Text style={styles.capacityText}>{item.capacity}</Text>
        </View>
        
        <View style={styles.roomContent}>
          <View style={styles.amenitiesRow}>
            {item.features && item.features.map((feature, index) => (
              <View key={index} style={styles.amenityItem}>
                <MaterialIcons 
                  name={
                    feature === 'TV' ? 'tv' : 
                    feature === 'Minibar' ? 'kitchen' : 
                    feature === 'Wi-Fi' ? 'wifi' :
                    feature === 'Air Conditioning' ? 'ac-unit' :
                    feature === 'Balkon' ? 'balcony' :
                    feature === 'Deniz Manzarası' ? 'landscape' :
                    feature === 'Jakuzi' ? 'hot-tub' : 'check'
                  } 
                  size={18} 
                  color="#555" 
                />
                <Text style={styles.amenityItemText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          {displayStatus === 'available' && (
            <>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Gecelik Fiyat: </Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
              <Text style={styles.roomTypeText}>{item.roomType}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </>
          )}
          
          {displayStatus === 'occupied' && (
            <View style={styles.occupiedInfo}>
              <View style={styles.guestInfoRow}>
                <MaterialIcons name="person" size={18} color="#E53935" />
                <Text style={styles.guestInfo}>Misafir: {item.occupantName || "Rezerve Edilmiş"}</Text>
              </View>
              <View style={styles.dateInfoRow}>
                <MaterialIcons name="date-range" size={18} color="#666" />
                <Text style={styles.dateInfo}>Giriş: {item.occupantCheckInDate || item.checkIn || "Belirtilmemiş"}</Text>
              </View>
              <View style={styles.dateInfoRow}>
                <MaterialIcons name="logout" size={18} color="#666" />
                <Text style={styles.dateInfo}>Çıkış: {item.occupantCheckOutDate || item.checkOut || "Belirtilmemiş"}</Text>
                {searchStartDate > today && (
                  <Text style={styles.futureAvailableInfo}> (Seçili tarihte müsait olacak)</Text>
                )}
              </View>
            </View>
          )}
          
          {displayStatus === 'maintenance' && (
            <View style={styles.maintenanceInfo}>
              <View style={styles.maintenanceRow}>
                <MaterialIcons name="build" size={18} color="#FF9800" />
                <Text style={styles.maintenanceText}>Bakım: {item.maintenanceIssueDescription}</Text>
              </View>
              <View style={styles.dateInfoRow}>
                <MaterialIcons name="event-available" size={18} color="#666" />
                <Text style={styles.dateInfo}>Tahmini Bitiş: {item.maintenanceCompletionDate || item.expectedCompletion || "Belirtilmemiş"}</Text>
                {searchStartDate > today && (
                  <Text style={styles.futureAvailableInfo}> (Seçili tarihte müsait olacak)</Text>
                )}
              </View>
            </View>
          )}
          
          {/* Display selected date information if different from today */}
          {searchStartDate > today && (displayStatus !== item.status) && (
            <View style={styles.dateNoteContainer}>
              <MaterialIcons name="info-outline" size={16} color="#1565C0" />
              <Text style={styles.dateNoteText}>
                Bu oda seçilen tarihte ({startDate}) müsait olacak
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.roomActions}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => showRoomDetails(item)}
          >
            <MaterialIcons name="info-outline" size={16} color="#673AB7" />
            <Text style={styles.buttonText}>DETAYLAR</Text>
          </TouchableOpacity>
          
          {canReserve && (
            <TouchableOpacity 
              style={styles.reserveButton}
              onPress={() => handleReservation(item)}
            >
              <MaterialIcons name="event-available" size={16} color="white" />
              <Text style={styles.reserveText}>REZERVE ET</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderRoomDetails = () => {
    if (!selectedRoom) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oda {selectedRoom.id}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.roomInfoSection}>
                <Text style={styles.sectionTitle}>Oda Bilgileri</Text>
                <View style={[styles.statusBadge, {backgroundColor: getStatusColor(selectedRoom.status)}]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusText(selectedRoom.status)}
                  </Text>
                </View>
                
                {/* Gelecek tarih bilgisi varsa göster */}
                {selectedRoom.futureDateInfo && (
                  <View style={styles.futureStatusNote}>
                    <MaterialIcons name="event-available" size={16} color="#4CAF50" />
                    <Text style={styles.futureStatusText}>
                      {selectedRoom.futureDateInfo.originalStatus === 'occupied' 
                        ? `Bu oda ${selectedRoom.futureDateInfo.availableFrom} tarihinde boşalacak.`
                        : `Bu odanın bakımı ${selectedRoom.futureDateInfo.availableFrom} tarihinde tamamlanacak.`
                      }
                    </Text>
                  </View>
                )}
                
                <Text style={styles.roomDetailText}>Kat: {selectedRoom.floor}</Text>
                <Text style={styles.roomDetailText}>Kapasite: {selectedRoom.capacity}</Text>
                <Text style={styles.roomDetailText}>Gecelik Fiyat: {selectedRoom.price}</Text>
                <Text style={styles.roomDetailText}>Oda Tipi: {selectedRoom.roomType}</Text>
                <Text style={styles.roomDetailText}>Açıklama: {selectedRoom.description}</Text>
              </View>
              
              {selectedRoom.status === 'occupied' && (
                <View style={styles.guestSection}>
                  <Text style={styles.sectionTitle}>Misafir Bilgileri</Text>
                  <Text style={styles.roomDetailText}>İsim: {selectedRoom.guest}</Text>
                  <Text style={styles.roomDetailText}>Giriş Tarihi: {selectedRoom.checkIn}</Text>
                  <Text style={styles.roomDetailText}>Çıkış Tarihi: {selectedRoom.checkOut}</Text>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelReservation(selectedRoom)}
                  >
                    <MaterialIcons name="cancel" size={16} color="#E53935" />
                    <Text style={styles.cancelText}>REZERVASYONU İPTAL ET</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {selectedRoom.status === 'maintenance' && (
                <View style={styles.maintenanceSection}>
                  <Text style={styles.sectionTitle}>Bakım Bilgileri</Text>
                  <Text style={styles.roomDetailText}>Bakım Sebebi: {selectedRoom.maintenance}</Text>
                  <Text style={styles.roomDetailText}>Tahmini Bitiş: {selectedRoom.expectedCompletion}</Text>
                </View>
              )}
              
              <View style={styles.amenitiesSection}>
                <Text style={styles.sectionTitle}>Oda Özellikleri</Text>
                <View style={styles.amenitiesList}>
                  {selectedRoom.features && selectedRoom.features.map((item, index) => (
                    <View key={index} style={styles.amenityBadge}>
                      <MaterialIcons 
                        name={
                          item === 'TV' ? 'tv' : 
                          item === 'Minibar' ? 'kitchen' : 
                          item === 'Wi-Fi' ? 'wifi' :
                          item === 'Air Conditioning' ? 'ac-unit' :
                          item === 'Balkon' ? 'balcony' :
                          item === 'Deniz Manzarası' ? 'landscape' :
                          item === 'Jakuzi' ? 'hot-tub' : 'check'
                        } 
                        size={16} 
                        color="#6B3DC9" 
                      />
                      <Text style={styles.amenityText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>KAPAT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Function to handle reservation cancellation
  const handleCancelReservation = (room) => {
    // Show confirmation dialog using React Native's Alert
    Alert.alert(
      "Rezervasyon İptali",
      `${room.guest} adına yapılan rezervasyonu iptal etmek istediğinizden emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Evet, İptal Et",
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Call API to cancel reservation
              if (room.reservationId) {
                await roomService.cancelReservation(room.reservationId);
                
                setModalVisible(false);
                
                // Show success message and refresh
                Alert.alert(
                  "Rezervasyon İptal Edildi",
                  `Oda ${room.id} rezervasyonu başarıyla iptal edildi.`,
                  [{ text: 'Tamam', onPress: () => refreshRooms() }]
                );
              } else {
                throw new Error('Reservation ID not found');
              }
            } catch (error) {
              console.error('Error cancelling reservation:', error);
              Alert.alert('Hata', 'Rezervasyon iptal edilirken bir hata oluştu.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Function to get calendar view data from API
  const fetchCalendarViewData = async () => {
    try {
      setIsLoading(true);
      
      // Format dates for API (YYYY-MM-DD)
      const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Prepare parameters
      const params = {
        StartDate: formatDateForApi(calendarViewRange.start),
        EndDate: formatDateForApi(calendarViewRange.end)
      };
      
      // Call API
      const calendarData = await roomService.getCalendarViewData(params);
      
      // Process and update the local state with returned data
      const processedRooms = calendarData.map(roomData => {
        // Transform the API data to match our existing room format
        return roomService.formatRoomData(roomData);
      });
      
      setRooms(processedRooms);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError('Takvim verisi yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update calendar view when range changes
  useEffect(() => {
    if (activeView === 'calendar') {
      fetchCalendarViewData();
    }
  }, [calendarViewRange, activeView]);

  // Function to generate dates for the calendar view
  const generateCalendarDates = () => {
    const dates = [];
    const start = new Date(calendarViewRange.start);
    const end = new Date(calendarViewRange.end);
    
    while (start <= end) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    
    return dates;
  };

  // Helper function to format date as "DD/MM EEE" (e.g., "24/03 Pzt")
  const formatDateHeader = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const dayNames = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const dayOfWeek = dayNames[date.getDay()];
    
    return `${day}/${month} ${dayOfWeek}`;
  };
  
  // Function to get room status for a specific date
  const getRoomStatusForDate = (room, date) => {
    // Check if room is available for this date using our helper
    if (isRoomAvailableForDate(room, date)) {
      return 'available';
    }
    
    // Format date for consistent comparison
    const formatDate = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if room is occupied on this date
    if (room.status === 'occupied' || room.currentReservationId) {
      const checkIn = parseDate(room.checkIn);
      const checkOut = parseDate(room.checkOut);
      
      if (checkIn && checkOut) {
        if (currentDate >= checkIn && currentDate < checkOut) {
          return 'occupied';
        }
      }
    }
    
    // Check if room is under maintenance on this date 
    if (room.status === 'maintenance' || room.maintenanceIssueDescription) {
      const completionDate = parseDate(room.expectedCompletion);
      
      if (completionDate) {
        if (currentDate < completionDate) {
          return 'maintenance';
        }
      } else {
        // No completion date specified, assume indefinite maintenance
        return 'maintenance';
      }
    }
    
    // Default to available if not occupied or under maintenance for this date
    return 'available';
  };

  // Function to handle changing the calendar view date range
  const changeCalendarViewRange = (increment) => {
    const newStart = new Date(calendarViewRange.start);
    const newEnd = new Date(calendarViewRange.end);
    
    newStart.setDate(newStart.getDate() + (increment * 14));
    newEnd.setDate(newEnd.getDate() + (increment * 14));
    
    setCalendarViewRange({
      start: newStart,
      end: newEnd
    });
  };

  // Function to format the date range display
  const formatDateRangeDisplay = () => {
    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    return `${formatDate(calendarViewRange.start)} - ${formatDate(calendarViewRange.end)}`;
  };

  // Modify the renderCalendarView function to modify the calendar rendering
  const renderCalendarView = () => {
    const dates = generateCalendarDates();
    const filteredRoomsByNumber = [...filteredRooms].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B3DC9" />
          <Text style={styles.loadingText}>Takvim verisi yükleniyor...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={32} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchCalendarViewData()}
          >
            <Text style={styles.retryButtonText}>TEKRAR DENE</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.calendarViewContainer}>
        <View style={styles.calendarViewHeader}>
          <TouchableOpacity onPress={() => changeCalendarViewRange(-1)}>
            <MaterialIcons name="chevron-left" size={24} color="#6B3DC9" />
          </TouchableOpacity>
          
          <Text style={styles.dateRangeText}>{formatDateRangeDisplay()}</Text>
          
          <TouchableOpacity onPress={() => changeCalendarViewRange(1)}>
            <MaterialIcons name="chevron-right" size={24} color="#6B3DC9" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.todayButton}
            onPress={() => {
              const today = new Date();
              setCalendarViewRange({
                start: today,
                end: new Date(new Date().setDate(today.getDate() + 14))
              });
            }}
          >
            <Text style={styles.todayButtonText}>BUGÜN</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Column Headers (Dates) */}
            <View style={styles.calendarHeaderRow}>
              <View style={styles.roomNumberCell}>
                <Text style={styles.roomNumberHeaderText}>Oda / Tarih</Text>
              </View>
              {dates.map((date, index) => (
                <View key={index} style={styles.dateHeaderCell}>
                  <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
                </View>
              ))}
            </View>
            
            {/* Room Rows */}
            <ScrollView style={{ maxHeight: 550 }}>
              {filteredRoomsByNumber.map((room) => (
                <View key={room.id} style={styles.roomRow}>
                  <View style={styles.roomNumberCell}>
                    <Text style={styles.roomNumberText}>{room.id}</Text>
                  </View>
                  
                  {dates.map((date, dateIndex) => {
                    // Get the status for this room on this specific date
                    const status = getRoomStatusForDate(room, date);
                    
                    return (
                      <TouchableOpacity 
                        key={dateIndex} 
                        style={[
                          styles.roomStatusCell,
                          { backgroundColor: getStatusColor(status) }
                        ]}
                        onPress={() => showRoomDetails(room)}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('available') }]} />
            <Text style={styles.legendText}>Müsait</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('occupied') }]} />
            <Text style={styles.legendText}>Dolu</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getStatusColor('maintenance') }]} />
            <Text style={styles.legendText}>Bakımda</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Room Status</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Oda Durumu</Text>
        
        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              activeView === 'card' && styles.activeToggle
            ]}
            onPress={() => setActiveView('card')}
          >
            <MaterialIcons 
              name="grid-view" 
              size={20} 
              color={activeView === 'card' ? '#6B3DC9' : '#666'} 
            />
            <Text 
              style={[
                styles.toggleText, 
                activeView === 'card' && styles.activeToggleText
              ]}
            >
              KART GÖRÜNÜMÜ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              activeView === 'calendar' && styles.activeToggle
            ]}
            onPress={() => setActiveView('calendar')}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={20} 
              color={activeView === 'calendar' ? '#6B3DC9' : '#666'} 
            />
            <Text 
              style={[
                styles.toggleText, 
                activeView === 'calendar' && styles.activeToggleText
              ]}
            >
              TAKVİM GÖRÜNÜMÜ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshRooms}
            disabled={isLoading}
          >
            <MaterialIcons name="refresh" size={20} color="#6B3DC9" />
            <Text style={styles.refreshText}>YENİLE</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search and Filters */}
        {activeView === 'card' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Oda Numarası Ara"
              value={searchText}
              onChangeText={setSearchText}
            />
            
            <View style={styles.filterRow}>
              <TouchableOpacity 
                style={styles.statusFilter}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.filterText}>{statusFilter}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.advancedFilter}
                onPress={() => setShowFilters(!showFilters)}
              >
                <MaterialIcons name="filter-list" size={20} color="#6B3DC9" />
                <Text style={styles.advancedFilterText}>GELİŞMİŞ FİLTRELER</Text>
              </TouchableOpacity>
            </View>
            
            {/* Status Dropdown */}
            {showStatusDropdown && (
              <View style={styles.dropdownMenu}>
                {['Tümü', 'Müsait', 'Dolu', 'Bakımda'].map((status) => (
                  <TouchableOpacity 
                    key={status} 
                    style={[
                      styles.dropdownItem,
                      statusFilter === status && styles.selectedDropdownItem
                    ]}
                    onPress={() => handleStatusFilter(status)}
                  >
                    <Text 
                      style={[
                        styles.dropdownText,
                        statusFilter === status && styles.selectedDropdownText
                      ]}
                    >
                      {status}
                    </Text>
                    {statusFilter === status && (
                      <MaterialIcons name="check" size={16} color="#6B3DC9" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B3DC9" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        )}
        
        {/* Error Message */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={32} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={refreshRooms}
            >
              <Text style={styles.retryButtonText}>TEKRAR DENE</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* View Toggle */}
        {activeView === 'card' && (
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                activeView === 'card' && styles.activeToggle
              ]}
              onPress={() => setActiveView('card')}
            >
              <MaterialIcons 
                name="grid-view" 
                size={20} 
                color={activeView === 'card' ? '#6B3DC9' : '#666'} 
              />
              <Text 
                style={[
                  styles.toggleText, 
                  activeView === 'card' && styles.activeToggleText
                ]}
              >
                KART GÖRÜNÜMÜ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                activeView === 'calendar' && styles.activeToggle
              ]}
              onPress={() => setActiveView('calendar')}
            >
              <MaterialIcons 
                name="calendar-today" 
                size={20} 
                color={activeView === 'calendar' ? '#6B3DC9' : '#666'} 
              />
              <Text 
                style={[
                  styles.toggleText, 
                  activeView === 'calendar' && styles.activeToggleText
                ]}
              >
                TAKVİM GÖRÜNÜMÜ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshRooms}
            >
              <MaterialIcons name="refresh" size={20} color="#6B3DC9" />
              <Text style={styles.refreshText}>YENİLE</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Advanced Filters */}
        {activeView === 'card' && showFilters && (
          <View style={styles.advancedFiltersContainer}>
            <Text style={styles.filterSectionTitle}>Gelişmiş Filtreler</Text>
            
            <View style={styles.dateFilterRow}>
              <View style={styles.dateFilter}>
                <Text style={styles.dateLabel}>Tarih Aralığı</Text>
                <Text style={styles.smallLabel}>Başlangıç Tarihi</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openCalendar('start')}
                >
                  <Text>{startDate || 'GG.AA.YYYY'}</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateFilter}>
                <Text style={styles.smallLabel}>Bitiş Tarihi</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => openCalendar('end')}
                >
                  <Text>{endDate || 'GG.AA.YYYY'}</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.featureFilter}>
              <Text style={styles.featureLabel}>Oda Özellikleri</Text>
              <TouchableOpacity 
                style={styles.featureDropdown}
                onPress={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
              >
                <Text>
                  {selectedFeatures.length > 0 
                    ? `${selectedFeatures.length} özellik seçildi` 
                    : 'Özellikler'}
                </Text>
                <MaterialIcons 
                  name={showFeaturesDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
                  size={24} 
                  color="#333" 
                />
              </TouchableOpacity>
              
              {showFeaturesDropdown && (
                <View style={styles.featuresDropdownMenu}>
                  {availableFeatures.map((feature) => (
                    <TouchableOpacity 
                      key={feature}
                      style={styles.featureCheckItem}
                      onPress={() => handleFeatureToggle(feature)}
                    >
                      <View style={styles.checkboxContainer}>
                        <View style={[
                          styles.checkbox,
                          selectedFeatures.includes(feature) && styles.checkedBox
                        ]}>
                          {selectedFeatures.includes(feature) && (
                            <MaterialIcons name="check" size={14} color="white" />
                          )}
                        </View>
                        <Text style={styles.featureItemText}>{feature}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFiltersText}>FİLTRELERİ TEMİZLE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersText}>UYGULA</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Active Filter Tags */}
        {activeView === 'card' && activeFilters.length > 0 && (
          <View style={styles.activeFilters}>
            {activeFilters.map((filter, index) => {
              let displayText = '';
              
              if (filter.type === 'status') {
                displayText = filter.value;
              } else if (filter.type === 'feature') {
                displayText = filter.value;
              } else if (filter.type === 'startDate') {
                displayText = `Başlangıç: ${filter.value}`;
              } else if (filter.type === 'endDate') {
                displayText = `Bitiş: ${filter.value}`;
              }
              
              return (
                <View key={index} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{displayText}</Text>
                  <TouchableOpacity onPress={() => removeFilter(filter)}>
                    <MaterialIcons name="close" size={16} color="#6B3DC9" />
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {activeFilters.length > 1 && (
              <TouchableOpacity 
                style={styles.clearAllTag}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearAllText}>Tümünü Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Empty state when no rooms match the filters */}
        {activeView === 'card' && !isLoading && !error && filteredRooms.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#999" />
            <Text style={styles.emptyStateTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptyStateText}>
              Arama kriterlerinize uygun oda bulunamadı. Lütfen filtreleri değiştirin.
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.resetButtonText}>FİLTRELERİ SIFIRLA</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Room List */}
        {activeView === 'card' && !isLoading && !error && filteredRooms.length > 0 && (
          <FlatList
            data={filteredRooms}
            renderItem={renderRoomCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.roomList}
            numColumns={1}
          />
        )}
        
        {/* Calendar View */}
        {activeView === 'calendar' && renderCalendarView()}
        
        {/* Room Details Modal */}
        {renderRoomDetails()}
        
        {/* Calendar Modal */}
        {renderCalendar()}
        
        {/* Reservation Modal */}
        {renderReservationModal()}
        
        {/* Reservation Date Modal */}
        {renderReservationDateModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#6B3DC9',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  viewToggle: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  activeToggle: {
    borderBottomWidth: 2,
    borderBottomColor: '#6B3DC9',
  },
  toggleText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#6B3DC9',
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 'auto',
  },
  refreshText: {
    marginLeft: 5,
    color: '#6B3DC9',
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '30%',
  },
  filterText: {
    flex: 1,
    color: '#333',
  },
  advancedFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '65%',
  },
  advancedFilterText: {
    marginLeft: 5,
    color: '#6B3DC9',
    fontSize: 13,
    fontWeight: '500',
  },
  advancedFiltersContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateFilter: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  smallLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingLeft: 30,
  },
  featureFilter: {
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  featureDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  activeFilters: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E4F3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
  },
  filterTagText: {
    color: '#6B3DC9',
    marginRight: 5,
    fontSize: 12,
  },
  roomList: {
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
  },
  roomNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  capacityText: {
    color: 'white',
    fontWeight: '500',
  },
  roomContent: {
    padding: 15,
    paddingTop: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  amenityItemText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#555',
  },
  priceContainer: {
    marginTop: 8,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  roomTypeText: {
    fontSize: 15,
    color: '#333',
    marginTop: 3,
    marginBottom: 5,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  guestInfo: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginLeft: 5,
    color: '#333',
  },
  dateInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  maintenanceInfo: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    color: '#FF9800',
  },
  roomActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    flex: 1,
    backgroundColor: '#EDE7F6',
  },
  buttonText: {
    marginLeft: 5,
    color: '#673AB7',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#673AB7',
    flex: 1,
  },
  reserveText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
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
    backgroundColor: '#6B3DC9',
    padding: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 15,
  },
  roomInfoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomDetailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  guestSection: {
    marginBottom: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E7',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  amenitiesSection: {
    marginBottom: 20,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E4F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  amenityText: {
    color: '#6B3DC9',
    fontSize: 12,
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDropdownItem: {
    backgroundColor: '#E8E4F3',
  },
  dropdownText: {
    color: '#333',
  },
  selectedDropdownText: {
    fontWeight: 'bold',
    color: '#6B3DC9',
  },
  featuresDropdownMenu: {
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureCheckItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#6B3DC9',
    borderColor: '#6B3DC9',
  },
  featureItemText: {
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: 'bold',
  },
  applyFiltersButton: {
    backgroundColor: '#6B3DC9',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#6B3DC9',
    padding: 10,
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearAllTag: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 5,
  },
  clearAllText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '500',
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeCalendarButton: {
    padding: 5,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B3DC9',
  },
  daysOfWeek: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 5,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  validDay: {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 14,
  },
  validDayText: {
    color: '#333',
  },
  emptyDayText: {
    color: 'transparent',
  },
  selectedDay: {
    backgroundColor: '#6B3DC9',
    borderRadius: 20,
  },
  todayDay: {
    backgroundColor: '#E8E4F3',
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#6B3DC9',
    fontWeight: '600',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  calendarButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarViewContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  roomNumberCell: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  roomNumberHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  dateHeaderCell: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateHeaderText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  roomRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roomNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  roomStatusCell: {
    width: 70,
    height: 40,
    borderWidth: 0.5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  guestInputContainer: {
    marginVertical: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  guestInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  reservationInfo: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelReservationButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  confirmReservationButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B3DC9',
    fontSize: 14,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  occupiedInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF9C4',
    borderRadius: 5,
  },
  guestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  maintenanceInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  maintenanceText: {
    marginLeft: 5,
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
  },
  maintenanceSection: {
    marginBottom: 20,
  },
  futureAvailableInfo: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginLeft: 5,
  },
  dateNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
  },
  dateNoteText: {
    fontSize: 13,
    color: '#1565C0',
    marginLeft: 5,
  },
  futureStatusNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    marginVertical: 8,
  },
  futureStatusText: {
    fontSize: 13,
    color: '#2E7D32',
    fontStyle: 'italic',
    marginLeft: 5,
    flex: 1,
  },
  formGroup: {
    marginBottom: 15,
  },
  formGroupIcon: {
    position: 'absolute',
    left: 0,
    top: 24,
    zIndex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingLeft: 30,
    fontSize: 14,
  },
  reservationFormContainer: {
    marginBottom: 20,
  },
  reservationFormGroup: {
    marginBottom: 15,
  },
  reservationFormIcon: {
    position: 'absolute',
    left: 0,
    top: 24,
    zIndex: 1,
  },
  reservationFormLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  reservationFormInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingLeft: 30,
    fontSize: 14,
  },
  reservationFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  reservationDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reservationDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingLeft: 30,
    fontSize: 14,
  },
  reservationActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  reservationCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  reservationCancelText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  reservationConfirmButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reservationConfirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  reservationModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reservationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  reservationModalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  reservationModalBody: {
    padding: 15,
  },
  reservationInputGroup: {
    marginBottom: 20,
  },
  reservationInputIcon: {
    position: 'absolute',
    left: 15,
    top: 33,
    zIndex: 1,
  },
  reservationInputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  reservationTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 45,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  reservationDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 45,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
  },
  reservationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  reservationCancelBtn: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
  },
  reservationCancelBtnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  reservationCreateBtn: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '65%',
  },
  reservationCreateBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 