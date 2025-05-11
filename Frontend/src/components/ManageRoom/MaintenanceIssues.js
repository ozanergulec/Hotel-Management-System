import React, { useState, useEffect } from 'react';
import { Modal, Button, List, Form, Input, DatePicker, Space, Tag, Empty, Spin, Typography, notification } from 'antd';
import { ToolOutlined, CheckCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/tr';
import roomService from '../../services/roomService';

const { TextArea } = Input;
const { Title, Text } = Typography;

const MaintenanceIssues = ({ visible, onClose, room }) => {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    if (visible && room) {
      fetchMaintenanceIssues();
    }
  }, [visible, room]);

  const fetchMaintenanceIssues = async () => {
    if (!room || !room.id) return;
    
    setLoading(true);
    try {
      const response = await roomService.getRoomMaintenanceIssues(room.id);
      setIssues(Array.isArray(response) ? response : []);
      console.log('Bakım sorunları yüklendi:', response);
    } catch (error) {
      console.error('Bakım sorunları yüklenirken hata:', error);
      notification.error({
        message: 'Hata',
        description: 'Bakım sorunları yüklenirken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssue = () => {
    setAddFormVisible(true);
    addForm.resetFields();
  };

  const handleAddFormCancel = () => {
    setAddFormVisible(false);
  };

  const handleAddFormSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      
      const issueData = {
        issueDescription: values.issueDescription,
        estimatedCompletionDate: values.estimatedCompletionDate.toISOString()
      };

      setLoading(true);
      await roomService.addMaintenanceIssue(room.id, issueData);
      
      notification.success({
        message: 'Başarılı',
        description: 'Bakım sorunu başarıyla eklendi.',
      });
      
      setAddFormVisible(false);
      fetchMaintenanceIssues();
    } catch (error) {
      console.error('Bakım sorunu eklenirken hata:', error);
      notification.error({
        message: 'Hata',
        description: 'Bakım sorunu eklenirken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId) => {
    if (window.confirm('Bu bakım sorununu çözüldü olarak işaretlemek istediğinizden emin misiniz?')) {
      setLoading(true);
      try {
        await roomService.resolveMaintenanceIssue(room.id, issueId);
        
        notification.success({
          message: 'Başarılı',
          description: 'Bakım sorunu başarıyla çözüldü olarak işaretlendi.',
        });
        
        fetchMaintenanceIssues();
      } catch (error) {
        console.error('Bakım sorunu çözülürken hata:', error);
        notification.error({
          message: 'Hata',
          description: 'Bakım sorunu çözülürken bir hata oluştu.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusTag = (status, resolvedDate) => {
    if (status?.toLowerCase() === 'resolved' || resolvedDate) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Çözüldü</Tag>;
    }
    return <Tag color="processing" icon={<ToolOutlined />}>Devam Ediyor</Tag>;
  };

  return (
    <>
      <Modal
        title={`Oda ${room?.roomNumber} - Bakım Sorunları`}
        visible={visible}
        onCancel={onClose}
        width={700}
        footer={[
          <Button key="back" onClick={onClose}>
            Kapat
          </Button>,
          <Button 
            key="add" 
            type="primary" 
            icon={<ToolOutlined />} 
            onClick={handleAddIssue}
          >
            Bakım Sorunu Ekle
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          {issues.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={issues}
              renderItem={(issue) => (
                <List.Item
                  actions={
                    !issue.resolvedDate ? [
                      <Button 
                        key="resolve" 
                        type="primary" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleResolveIssue(issue.id)}
                      >
                        Çözüldü İşaretle
                      </Button>
                    ] : []
                  }
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{issue.issueDescription || issue.description}</Text>
                        {getStatusTag(issue.status, issue.resolvedDate)}
                      </Space>
                    }
                    description={
                      <Space direction="vertical">
                        <Text>Bildirim Tarihi: {moment(issue.reportedDate).format('DD MMMM YYYY')}</Text>
                        {issue.estimatedCompletionDate && (
                          <Text>Tahmini Tamamlanma: {moment(issue.estimatedCompletionDate).format('DD MMMM YYYY')}</Text>
                        )}
                        {issue.resolvedDate && (
                          <Text>Çözüm Tarihi: {moment(issue.resolvedDate).format('DD MMMM YYYY')}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description="Bu oda için bakım sorunu bulunamadı" 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          )}
        </Spin>
      </Modal>

      <Modal
        title="Bakım Sorunu Ekle"
        visible={addFormVisible}
        onCancel={handleAddFormCancel}
        onOk={handleAddFormSubmit}
        okText="Ekle"
        cancelText="İptal"
      >
        <Form
          form={addForm}
          layout="vertical"
        >
          <Form.Item
            name="issueDescription"
            label="Sorun Açıklaması"
            rules={[{ required: true, message: 'Lütfen sorun açıklaması girin!' }]}
          >
            <TextArea rows={4} placeholder="Bakım sorununun açıklamasını girin..." />
          </Form.Item>
          
          <Form.Item
            name="estimatedCompletionDate"
            label="Tahmini Tamamlanma Tarihi"
            rules={[{ required: true, message: 'Lütfen tahmini tamamlanma tarihi seçin!' }]}
            initialValue={moment().add(3, 'days')}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MaintenanceIssues; 