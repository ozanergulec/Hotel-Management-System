import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { staffService } from '../services/api';
import styles from './managestaffStyle';
import StaffDetailsModal from '../components/StaffDetailsModal';

// Tarih formatı için yardımcı fonksiyon
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // ISO formatı (2025-05-10T21:00:00Z) veya başka bir format olabilir
  try {
    const date = new Date(dateString);
    // "MM/DD/YYYY" formatında tarih döndür
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch (error) {
    // Eğer parse edilemezse doğrudan değeri döndür
    return dateString;
  }
};

export default function ManageStaffScreen() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [activeTab, setActiveTab] = useState('ALL STAFF');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery, selectedStatus, selectedDepartment, activeTab]);

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Pass selected filters to API if they're not 'All'
      const status = selectedStatus !== 'All' ? selectedStatus : '';
      const department = selectedDepartment !== 'All' ? selectedDepartment : '';
      const response = await staffService.getAllStaff(status, department);
      
      // API yanıtı doğrudan bir dizi olmayabilir, items veya data adında bir property içerebilir
      let staffData = [];
      
      if (response) {
        console.log('API Response:', response);
        if (Array.isArray(response)) {
          staffData = response; // Yanıt doğrudan bir dizi ise
        } else if (response.data && Array.isArray(response.data)) {
          staffData = response.data; // { data: [...] } formatında ise
        } else if (response.items && Array.isArray(response.items)) {
          staffData = response.items; // { items: [...] } formatında ise
        } else if (response.results && Array.isArray(response.results)) {
          staffData = response.results; // { results: [...] } formatında ise
        } else {
          console.log('Unexpected API response format:', response);
          staffData = []; // Bilinen bir format değilse boş dizi kullan
        }
      }
      
      setStaff(staffData);
      setFilteredStaff(staffData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError(error.message || 'Failed to fetch staff');
      setLoading(false);

      // For demo purposes, if API fails, use mock data
      const mockStaff = [
        {
          id: 1,
          name: 'Ozan Ergüleç',
          position: 'Katçı (Housekeeping)',
          department: 'Housekeeping',
          startDate: '5/11/2025',
          email: 'ozan123@gmail.com',
          phone: '05367234467',
          status: 'Active'
        }
      ];
      setStaff(mockStaff);
      setFilteredStaff(mockStaff);
    }
  };

  const filterStaff = () => {
    if (!Array.isArray(staff)) {
      console.error('Staff is not an array:', staff);
      setFilteredStaff([]);
      return;
    }

    let result = [...staff];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(item => 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'All') {
      result = result.filter(item => item.status === selectedStatus);
    }

    // Filter by department
    if (selectedDepartment !== 'All') {
      result = result.filter(item => item.department === selectedDepartment);
    }

    // Filter by department tab
    if (activeTab === 'FRONT OFFICE') {
      result = result.filter(item => item.department === 'Front Office');
    } else if (activeTab === 'HOUSEKEEPING') {
      result = result.filter(item => item.department === 'Housekeeping');
    } else if (activeTab === 'OTHER DEPARTMENTS') {
      result = result.filter(item => 
        item.department !== 'Front Office' && 
        item.department !== 'Housekeeping'
      );
    }

    setFilteredStaff(result);
  };

  const renderStaffItem = ({ item }) => {
    if (!item || !item.name) {
      return null; // Geçersiz öğeleri atla
    }

    const initials = item.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();

    const formattedDate = formatDate(item.startDate);

    return (
      <View style={styles.staffCard}>
        <View style={styles.topRow}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.staffPosition}>{item.position}</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'Active' ? '#16A085' : '#7F8C8D' }
          ]}>
            <Text style={styles.statusText}>{item.status || 'Active'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{item.department || 'Housekeeping'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>{formattedDate || '5/11/2025'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{item.email || 'ozan123@gmail.com'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{item.phone || '05367234467'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => {
            setSelectedStaffId(item.id);
            setModalVisible(true);
          }}
        >
          <Text style={styles.detailsButtonText}>DETAILS</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
      </View>
      
      <View style={styles.filterArea}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search staff..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Status</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text>{selectedStatus}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Department</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text>{selectedDepartment}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-staff')}
          >
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>NEW STAFF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ALL STAFF' && styles.activeTab]}
          onPress={() => setActiveTab('ALL STAFF')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL STAFF' && styles.activeTabText]}>
            ALL STAFF
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'FRONT OFFICE' && styles.activeTab]}
          onPress={() => setActiveTab('FRONT OFFICE')}
        >
          <Text style={[styles.tabText, activeTab === 'FRONT OFFICE' && styles.activeTabText]}>
            FRONT OFFICE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'HOUSEKEEPING' && styles.activeTab]}
          onPress={() => setActiveTab('HOUSEKEEPING')}
        >
          <Text style={[styles.tabText, activeTab === 'HOUSEKEEPING' && styles.activeTabText]}>
            HOUSEKEEPING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'OTHER DEPARTMENTS' && styles.activeTab]}
          onPress={() => setActiveTab('OTHER DEPARTMENTS')}
        >
          <Text style={[styles.tabText, activeTab === 'OTHER DEPARTMENTS' && styles.activeTabText]}>
            OTHER DEPARTMENTS
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultCount}>
        Total {filteredStaff.length} staff found
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#693FCC" style={styles.loading} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={50} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStaff}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          renderItem={renderStaffItem}
          keyExtractor={(item, index) => (item?.id?.toString() || index.toString())}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={50} color="#693FCC" />
              <Text style={styles.emptyText}>No staff members found</Text>
            </View>
          }
        />
      )}

      {/* Staff Details Modal */}
      <StaffDetailsModal
        isVisible={modalVisible}
        staffId={selectedStaffId}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
} 