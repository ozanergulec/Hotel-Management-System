import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

export default function RoomsScreen() {
  const params = useLocalSearchParams();
  const username = params.username || "Utku Adanur";
  
  const [activeView, setActiveView] = useState('card'); // 'card' or 'calendar'
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Sample room data based on the image
  const rooms = [
    {
      id: '101',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺'
    },
    {
      id: '102',
      status: 'occupied',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      guest: 'Ayşe Yılmaz',
      checkIn: '20.03.2025',
      checkOut: '25.03.2025'
    },
    {
      id: '103',
      status: 'maintenance',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      maintenance: 'Klima arızası',
      expectedCompletion: '26.03.2025'
    },
    {
      id: '104',
      status: 'occupied',
      capacity: '4 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      guest: 'Ali Kaya',
      checkIn: '22.03.2025',
      checkOut: '28.03.2025'
    },
    {
      id: '105',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺'
    },
    {
      id: '201',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺'
    },
    {
      id: '202',
      status: 'occupied',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      guest: 'Zeynep Demir',
      checkIn: '21.03.2025',
      checkOut: '26.03.2025'
    },
    {
      id: '203',
      status: 'available',
      capacity: '2 Kişilik',
      amenities: ['TV', 'Minibar', 'Wi-Fi'],
      price: '₺'
    }
  ];

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
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const renderRoomCard = ({ item }) => (
    <View style={styles.roomCard}>
      <View style={[styles.roomHeader, { backgroundColor: getStatusColor(item.status) }]}>
        <MaterialIcons name={getStatusIcon(item.status)} size={20} color="white" />
        <Text style={styles.roomNumber}>{item.id}</Text>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
      
      <View style={styles.roomContent}>
        <Text style={styles.roomInfo}>• {item.capacity}</Text>
        <Text style={styles.roomInfo}>TV • Minibar • Wi-Fi</Text>
        
        {item.status === 'occupied' && (
          <>
            <Text style={styles.guestInfo}>Misafir: {item.guest}</Text>
            <Text style={styles.dateInfo}>Giriş/Çıkış: {item.checkIn} - {item.checkOut}</Text>
          </>
        )}
        
        {item.status === 'maintenance' && (
          <>
            <Text style={styles.maintenanceInfo}>Bakım: {item.maintenance}</Text>
            <Text style={styles.dateInfo}>Tahmini Bitiş: {item.expectedCompletion}</Text>
          </>
        )}
        
        {item.status === 'available' && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Gecelik Fiyat: </Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.roomActions}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => showRoomDetails(item)}
        >
          <MaterialIcons name="info" size={16} color="#3C3169" />
          <Text style={styles.buttonText}>DETAYLAR</Text>
        </TouchableOpacity>
        
        {item.status === 'available' && (
          <TouchableOpacity style={styles.reserveButton}>
            <MaterialIcons name="date-range" size={16} color="white" />
            <Text style={styles.reserveText}>REZERVE ET</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusText(selectedRoom.status)}
                  </Text>
                </View>
                <Text style={styles.roomDetailText}>Kapasite: {selectedRoom.capacity}</Text>
                <Text style={styles.roomDetailText}>Gecelik Fiyat: {selectedRoom.price || '-'}</Text>
              </View>
              
              {selectedRoom.status === 'occupied' && (
                <View style={styles.guestSection}>
                  <Text style={styles.sectionTitle}>Misafir Bilgileri</Text>
                  <Text style={styles.roomDetailText}>İsim: {selectedRoom.guest}</Text>
                  <Text style={styles.roomDetailText}>Giriş Tarihi: {selectedRoom.checkIn}</Text>
                  <Text style={styles.roomDetailText}>Çıkış Tarihi: {selectedRoom.checkOut}</Text>
                  
                  <TouchableOpacity style={styles.cancelButton}>
                    <MaterialIcons name="cancel" size={16} color="#E53935" />
                    <Text style={styles.cancelText}>REZERVASYONU İPTAL ET</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.amenitiesSection}>
                <Text style={styles.sectionTitle}>Oda Özellikleri</Text>
                <View style={styles.amenitiesList}>
                  {selectedRoom.amenities.map((item, index) => (
                    <View key={index} style={styles.amenityBadge}>
                      <MaterialIcons 
                        name={
                          item === 'TV' ? 'tv' : 
                          item === 'Minibar' ? 'kitchen' : 
                          item === 'Wi-Fi' ? 'wifi' : 'check'
                        } 
                        size={16} 
                        color="#3C3169" 
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Room Status</Text>
        <View style={styles.headerRight}>
          <Text style={styles.username}>{username}</Text>
          <MaterialIcons name="logout" size={24} color="white" />
        </View>
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
              color={activeView === 'card' ? '#3C3169' : '#666'} 
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
              color={activeView === 'calendar' ? '#3C3169' : '#666'} 
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
          
          <TouchableOpacity style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={20} color="#3C3169" />
            <Text style={styles.refreshText}>YENİLE</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Oda Numarası Ara"
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.statusFilter}>
              <Text style={styles.filterText}>{statusFilter}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.advancedFilter}
              onPress={() => setShowFilters(!showFilters)}
            >
              <MaterialIcons name="filter-list" size={20} color="#3C3169" />
              <Text style={styles.advancedFilterText}>GELİŞMİŞ FİLTRELER</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Advanced Filters */}
        {showFilters && (
          <View style={styles.advancedFiltersContainer}>
            <Text style={styles.filterSectionTitle}>Gelişmiş Filtreler</Text>
            
            <View style={styles.dateFilterRow}>
              <View style={styles.dateFilter}>
                <Text style={styles.dateLabel}>Tarih Aralığı</Text>
                <Text style={styles.smallLabel}>Başlangıç Tarihi</Text>
                <View style={styles.dateInput}>
                  <Text>24.03.2025</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </View>
              </View>
              
              <View style={styles.dateFilter}>
                <Text style={styles.smallLabel}>Bitiş Tarihi</Text>
                <View style={styles.dateInput}>
                  <Text>GG.AA.YYYY</Text>
                  <MaterialIcons name="calendar-today" size={16} color="#333" />
                </View>
              </View>
            </View>
            
            <View style={styles.featureFilter}>
              <Text style={styles.featureLabel}>Oda Özellikleri</Text>
              <TouchableOpacity style={styles.featureDropdown}>
                <Text>Özellikler</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Active Filter Tags */}
        <View style={styles.activeFilters}>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>24.03.2025</Text>
            <TouchableOpacity>
              <MaterialIcons name="close" size={16} color="#3C3169" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Room List */}
        <FlatList
          data={rooms}
          renderItem={renderRoomCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.roomList}
          numColumns={1}
        />
        
        {/* Room Details Modal */}
        {renderRoomDetails()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3C3169',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    marginRight: 15,
    fontSize: 16,
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
    borderBottomColor: '#3C3169',
  },
  toggleText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#3C3169',
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
    color: '#3C3169',
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
    color: '#3C3169',
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
    color: '#3C3169',
    marginRight: 5,
    fontSize: 12,
  },
  roomList: {
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  roomNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    marginLeft: 'auto',
  },
  roomContent: {
    padding: 10,
  },
  roomInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  guestInfo: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#333',
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3C3169',
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
    padding: 10,
    flex: 1,
  },
  buttonText: {
    marginLeft: 5,
    color: '#3C3169',
    fontSize: 12,
    fontWeight: '500',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#3C3169',
    flex: 1,
  },
  reserveText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
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
    backgroundColor: '#3C3169',
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
    backgroundColor: '#E53935',
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
    color: '#3C3169',
    fontSize: 12,
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#3C3169',
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
}); 