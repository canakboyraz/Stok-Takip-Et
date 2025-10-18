import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Grid
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Person as PersonIcon,
  Category as CategoryIcon,
  Restaurant as RestaurantIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { supabase } from '../lib/supabase';
import { getActivityTypeLabel, getEntityTypeLabel, ActivityType, EntityType } from '../lib/activityLogger';

interface Activity {
  id: number;
  project_id: number;
  action_type: ActivityType;
  action_description: string;
  entity_type: EntityType;
  entity_id: number | null;
  created_at: string;
  user_email: string;
  ip_address: string;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Etkinlik kayıtlarını fetch et
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }

      // activities_view yerine doğrudan activities tablosunu kullan
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        console.log('🔍 Activities: Yüklenen etkinlik sayısı:', data.length);
        console.log('🔍 Activities: İlk 3 etkinlik:', data.slice(0, 3));
        
        // Etkinlik türlerinin dağılımını göster
        const activityTypes = data.reduce((acc: any, activity: any) => {
          acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
          return acc;
        }, {});
        console.log('🔍 Activities: Etkinlik türleri dağılımı:', activityTypes);
        
        // Son 5 etkinliği detaylı göster
        console.log('🔍 Activities: Son 5 etkinlik detayları:');
        data.slice(0, 5).forEach((activity: any, index: number) => {
          console.log(`${index + 1}. ${activity.action_type} - ${activity.action_description} (${new Date(activity.created_at).toLocaleString()})`);
        });
        
        setActivities(data as Activity[]);
        
        // Kullanıcı listesini al - Set yerine manuel tekrar kontrolü yapıyoruz
        const uniqueEmailsMap: Record<string, boolean> = {};
        const users: string[] = [];
        
        data.forEach(activity => {
          if (activity.user_email && !uniqueEmailsMap[activity.user_email]) {
            uniqueEmailsMap[activity.user_email] = true;
            users.push(activity.user_email);
          }
        });
        
        setUniqueUsers(users);
      }
    } catch (error: any) {
      console.error('Etkinlik kayıtları yüklenirken hata:', error);
      setError(`Etkinlik kayıtları yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Her bir entity type için ikon getir
  const getEntityIcon = (entityType: EntityType) => {
    switch (entityType) {
      case 'product':
        return <InventoryIcon />;
      case 'product_template':
        return <InventoryIcon />;
      case 'category':
        return <CategoryIcon />;
      case 'recipe':
        return <RestaurantIcon />;
      case 'menu':
        return <DescriptionIcon />;
      case 'stock_movement':
        return <InventoryIcon />;
      case 'bulk_movement':
        return <InventoryIcon />;
      case 'personnel':
        return <PeopleIcon />;
      case 'expense':
        return <DescriptionIcon />;
      case 'project':
        return <FolderIcon />;
      case 'user_permission':
        return <PersonIcon />;
      case 'system':
        return <DescriptionIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: tr });
    } catch (error) {
      return dateString;
    }
  };

  // Filtre değişiklikleri
  const handleEntityTypeFilterChange = (event: SelectChangeEvent) => {
    setEntityTypeFilter(event.target.value);
  };

  const handleActionTypeFilterChange = (event: SelectChangeEvent) => {
    setActionTypeFilter(event.target.value);
  };

  const handleUserFilterChange = (event: SelectChangeEvent) => {
    setUserFilter(event.target.value);
  };

  const handleDateFilterChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  // Filtrelenmiş aktiviteler
  const filteredActivities = activities.filter(activity => {
    // Arama teriminde filtre
    const matchesSearch = 
      searchTerm === '' || 
      activity.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_email.toLowerCase().includes(searchTerm.toLowerCase());

    // Entity tipi filtresi
    const matchesEntityType = 
      entityTypeFilter === 'all' || 
      activity.entity_type === entityTypeFilter;

    // Action tipi filtresi
    const matchesActionType = 
      actionTypeFilter === 'all' || 
      activity.action_type === actionTypeFilter;

    // Kullanıcı filtresi
    const matchesUser = 
      userFilter === 'all' || 
      activity.user_email === userFilter;

    // Tarih filtresi
    const now = new Date();
    const activityDate = new Date(activity.created_at);
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      matchesDate = activityDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesDate = activityDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      matchesDate = activityDate >= monthAgo;
    }

    return matchesSearch && matchesEntityType && matchesActionType && matchesUser && matchesDate;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Etkinlik Kayıtları
        </Typography>
        <Tooltip title="Yenile">
          <span>
            <IconButton onClick={fetchActivities} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Ara"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Açıklama veya kullanıcı e-postasında ara"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="date-filter-label">Tarih</InputLabel>
              <Select
                labelId="date-filter-label"
                value={dateFilter}
                label="Tarih"
                onChange={handleDateFilterChange}
              >
                <MenuItem value="all">Tüm Zamanlar</MenuItem>
                <MenuItem value="today">Bugün</MenuItem>
                <MenuItem value="week">Son 7 Gün</MenuItem>
                <MenuItem value="month">Son 30 Gün</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="entity-type-filter-label">Varlık Tipi</InputLabel>
              <Select
                labelId="entity-type-filter-label"
                value={entityTypeFilter}
                label="Varlık Tipi"
                onChange={handleEntityTypeFilterChange}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="product">Ürün</MenuItem>
                <MenuItem value="product_template">Ürün Şablonu</MenuItem>
                <MenuItem value="category">Kategori</MenuItem>
                <MenuItem value="recipe">Tarif</MenuItem>
                <MenuItem value="menu">Menü</MenuItem>
                <MenuItem value="stock_movement">Stok Hareketi</MenuItem>
                <MenuItem value="bulk_movement">Toplu İşlem</MenuItem>
                <MenuItem value="personnel">Personel</MenuItem>
                <MenuItem value="expense">Gider</MenuItem>
                <MenuItem value="project">Proje</MenuItem>
                <MenuItem value="user_permission">Kullanıcı İzni</MenuItem>
                <MenuItem value="system">Sistem</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="action-type-filter-label">İşlem Tipi</InputLabel>
              <Select
                labelId="action-type-filter-label"
                value={actionTypeFilter}
                label="İşlem Tipi"
                onChange={handleActionTypeFilterChange}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="stock_add">Stok Girişi</MenuItem>
                <MenuItem value="stock_remove">Stok Çıkışı</MenuItem>
                <MenuItem value="stock_update">Stok Güncelleme</MenuItem>
                <MenuItem value="stock_bulk_update">Toplu Stok Güncelleme</MenuItem>
                <MenuItem value="stock_bulk_out">Toplu Stok Çıkışı</MenuItem>
                <MenuItem value="product_create">Ürün Ekleme</MenuItem>
                <MenuItem value="product_update">Ürün Güncelleme</MenuItem>
                <MenuItem value="product_delete">Ürün Silme</MenuItem>
                <MenuItem value="category_create">Kategori Ekleme</MenuItem>
                <MenuItem value="category_update">Kategori Güncelleme</MenuItem>
                <MenuItem value="category_delete">Kategori Silme</MenuItem>
                <MenuItem value="recipe_create">Tarif Ekleme</MenuItem>
                <MenuItem value="recipe_update">Tarif Güncelleme</MenuItem>
                <MenuItem value="recipe_delete">Tarif Silme</MenuItem>
                <MenuItem value="menu_create">Menü Ekleme</MenuItem>
                <MenuItem value="menu_update">Menü Güncelleme</MenuItem>
                <MenuItem value="menu_delete">Menü Silme</MenuItem>
                <MenuItem value="menu_consumption">Menü Tüketimi</MenuItem>
                <MenuItem value="menu_consumption_undo">Menü Tüketimi Geri Alma</MenuItem>
                <MenuItem value="personnel_create">Personel Ekleme</MenuItem>
                <MenuItem value="personnel_update">Personel Güncelleme</MenuItem>
                <MenuItem value="personnel_delete">Personel Silme</MenuItem>
                <MenuItem value="expense_create">Gider Ekleme</MenuItem>
                <MenuItem value="expense_update">Gider Güncelleme</MenuItem>
                <MenuItem value="expense_delete">Gider Silme</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="user-filter-label">Kullanıcı</InputLabel>
              <Select
                labelId="user-filter-label"
                value={userFilter}
                label="Kullanıcı"
                onChange={handleUserFilterChange}
              >
                <MenuItem value="all">Tüm Kullanıcılar</MenuItem>
                {uniqueUsers.map(user => (
                  <MenuItem key={user} value={user}>
                    {user}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredActivities.length === 0 ? (
          <Alert severity="info">
            {activities.length === 0
              ? 'Henüz etkinlik kaydı bulunmuyor.'
              : 'Filtrelere uygun etkinlik kaydı bulunamadı.'}
          </Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width="5%"></TableCell>
                  <TableCell width="15%">Tarih/Saat</TableCell>
                  <TableCell width="15%">Kullanıcı</TableCell>
                  <TableCell width="15%">İşlem</TableCell>
                  <TableCell width="50%">Açıklama</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      <Tooltip title={getEntityTypeLabel(activity.entity_type)}>
                        {getEntityIcon(activity.entity_type)}
                      </Tooltip>
                    </TableCell>
                    <TableCell>{formatDate(activity.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {activity.user_email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getActivityTypeLabel(activity.action_type)}</TableCell>
                    <TableCell>{activity.action_description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default Activities; 