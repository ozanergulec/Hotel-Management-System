import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { customerService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function CustomerInfoScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        (customer.FullName?.toLowerCase().includes(lowerCaseQuery) ||
        customer.Email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.Phone?.includes(searchQuery) || // Phone might not need lowercasing
        customer.id?.toString().includes(searchQuery))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      if (!shouldRefresh) setLoading(true);
  
      const response = await customerService.getAllCustomers(pageNum, pageSize);
      console.log('Raw API Response:', JSON.stringify(response, null, 2));
  
      const customerData = (response?.data || []).map(c => ({
        ...c,
        FullName: c.fullName || 'Unknown',
        Phone: c.phone || 'No phone',
        Email: c.email || 'No email',
        Status: c.status || 'Standart',
      }));
  
      if (shouldRefresh || pageNum === 1) {
        setCustomers(customerData);
      } else {
        setCustomers(prevCustomers => [...prevCustomers, ...customerData]);
      }
  
      setHasMore(customerData.length === pageSize);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
      Alert.alert('Error', 'Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCustomers(1, true);
  };

  const loadMoreCustomers = () => {
    if (hasMore && !loading && !searchQuery) {
      fetchCustomers(page + 1);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    // Use first and last part for initials
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = ['#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', 
                   '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', 
                   '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
    
    // Use customer ID to pick a consistent color
    const colorIndex = typeof id === 'number' ? id % colors.length : 0;
    return colors[colorIndex];
  };

  const getFullName = (customer) => {
    // Use the FullName field directly from the API response
    return customer?.FullName || 'Unknown';
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setDetailModalVisible(true);
  };

  const renderCustomerItem = ({ item }) => {
    // Use the correct fields from the API response
    const customerName = getFullName(item);
    const customerPhone = item.Phone || 'No phone';
    const customerEmail = item.Email || 'No email';
    const customerId = item.id?.toString() || '';
    const avatarColor = getAvatarColor(item.id);
    const customerStatus = item.Status === 'VIP' ? 'VIP' : 'Standart';
    const isVip = customerStatus === 'VIP';
    
    // Log the customer data to help debug
    console.log('Customer data:', { 
      FullName: item.FullName, 
      Phone: item.Phone,
      Email: item.Email,
      Status: item.Status,
      id: item.id,
      // idNumber: item.idNumber, // Commented out as idNumber is not in the provided API structure
      displayName: customerName
    });
    
    return (
      <View style={styles.customerRow}>
        <View style={styles.customerMain}>
          <View style={[styles.customerAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(customerName)}
            </Text>
          </View>
          
          <View style={styles.customerInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.customerName}>{customerName}</Text>
            </View>
            
            <View style={styles.contactSection}>
              <Text style={styles.contactText}>
                {customerPhone}
              </Text>
              <Text style={styles.contactText}>
                {customerEmail}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.customerActions}>
          <View style={[styles.statusBadge, { 
            backgroundColor: isVip ? '#FF5252' : '#F5F5F5',
            borderColor: isVip ? '#FF5252' : '#DDDDDD'
          }]}>
            <Text style={[styles.statusText, { 
              color: isVip ? '#FFFFFF' : '#555555' 
            }]}>{customerStatus}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => viewCustomerDetails(item)}
          >
            <Text style={styles.detailsButtonText}>DETAYLAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Customer details modal
  const renderCustomerDetailModal = () => {
    if (!selectedCustomer) return null;
    
    const customerName = getFullName(selectedCustomer);
    const customerPhone = selectedCustomer.Phone || 'No phone number provided';
    const customerEmail = selectedCustomer.Email || 'No email provided';
    const customerAddress = selectedCustomer.Address || 'No address provided';
    const customerId = selectedCustomer.id?.toString() || '';
    const customerStatus = selectedCustomer.Status === 'VIP' ? 'VIP' : 'Standart';
    
    return (
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.customerDetailHeader}>
                <View style={[styles.detailAvatar, { backgroundColor: getAvatarColor(selectedCustomer.id) }]}>
                  <Text style={styles.detailAvatarText}>{getInitials(customerName)}</Text>
                </View>
                <View style={styles.customerDetailInfo}>
                  <Text style={styles.detailName}>{customerName}</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: customerStatus === 'VIP' ? '#FF5252' : '#F5F5F5',
                    borderColor: customerStatus === 'VIP' ? '#FF5252' : '#DDDDDD'
                  }]}>
                    <Text style={[styles.statusText, { 
                      color: customerStatus === 'VIP' ? '#FFFFFF' : '#555555' 
                    }]}>{customerStatus}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="phone" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    {customerPhone}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="email" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    {customerEmail}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="location-on" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    {customerAddress}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Reservation History</Text>
                
                {(selectedCustomer.reservations && selectedCustomer.reservations.length > 0) ? (
                  selectedCustomer.reservations.map((reservation, index) => (
                    <View key={index} style={styles.reservationItem}>
                      <View style={styles.reservationHeader}>
                        <Text style={styles.reservationDate}>
                          {reservation.checkInDate} - {reservation.checkOutDate}
                        </Text>
                        <Text style={styles.reservationStatus}>
                          {reservation.status || 'Completed'}
                        </Text>
                      </View>
                      <Text style={styles.reservationRoom}>
                        Room: {reservation.roomNumber || 'N/A'}
                      </Text>
                      <Text style={styles.reservationAmount}>
                        Amount: ${reservation.amount || 'N/A'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No reservation history</Text>
                )}
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="person" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    {/* ID: {customerId || 'N/A'} */}
                    {/* Commented out as idNumber is not in the provided API structure, using item.id instead if needed */} 
                    ID: {selectedCustomer.id ? `Internal ID: ${selectedCustomer.id}` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="date-range" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    Created on: {selectedCustomer.createdAt || 'Unknown date'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="loyalty" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    Loyalty Points: {selectedCustomer.loyaltyPoints || '0'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="edit" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F44336' }]}>
                  <MaterialIcons name="delete" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Müşteri Bilgileri</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri Ara (İsim, E-posta, Telefon, Adres, TC Kimlik)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={24} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <Text style={styles.sectionTitle}>Müşteri Listesi</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchCustomers(1)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B3DC9" />
              <Text style={styles.loadingText}>Loading customers...</Text>
            </View>
          ) : filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No customers match your search' : 'No customers found'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={renderCustomerItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#6B3DC9']}
                  />
                }
                onEndReached={loadMoreCustomers}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  hasMore && !searchQuery ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color="#6B3DC9" />
                      <Text style={styles.footerText}>Loading more...</Text>
                    </View>
                  ) : null
                }
              />
            </View>
          )}
        </>
      )}
      
      {renderCustomerDetailModal()}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => Alert.alert('Add Customer', 'Add new customer functionality coming soon')}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
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
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customerMain: {
    flexDirection: 'row',
    flex: 3,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameSection: {
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactSection: {
    
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  customerActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  clearSearchText: {
    color: '#6B3DC9',
    fontSize: 16,
    marginTop: 15,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B3DC9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // Modal styles
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 15,
  },
  customerDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailAvatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  customerDetailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  noDataText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  reservationItem: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6B3DC9',
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reservationDate: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  reservationStatus: {
    fontSize: 13,
    color: '#4CAF50',
  },
  reservationRoom: {
    fontSize: 14,
    color: '#555',
  },
  reservationAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 0.48,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
}); 