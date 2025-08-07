import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Personnel } from '../types/database';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const PersonnelList = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPersonnel, setEditPersonnel] = useState<Personnel | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form state'leri
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [hireDate, setHireDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  useEffect(() => {
    fetchPersonnel();
  }, []);
  
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('full_name');
      
      if (error) throw error;
      
      // Verileri state'e kaydet
      setPersonnel(data || []);
      
    } catch (error: any) {
      console.error('Personel listesi alınırken hata:', error);
      setAlert({
        show: true,
        message: `Personel yüklenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (person: Personnel) => {
    setEditPersonnel(person);
    setFullName(person.full_name);
    setPosition(person.position);
    setSalary(person.salary);
    setHireDate(person.hire_date.split('T')[0]);
    setBirthDate(person.birth_date.split('T')[0]);
    setLocation(person.location || '');
    setNotes(person.notes || '');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditPersonnel(null);
  };
  
  const handleSaveEdit = async () => {
    if (!editPersonnel) return;
    
    try {
      setLoading(true);
      
      // Form doğrulama
      if (!fullName.trim() || !position.trim() || salary === '' || !hireDate || !birthDate) {
        setAlert({
          show: true,
          message: 'Lütfen gerekli alanları doldurun',
          type: 'error'
        });
        return;
      }
      
      // Güncelleme işlemi
      const { error } = await supabase
        .from('personnel')
        .update({
          full_name: fullName.trim(),
          position: position.trim(),
          salary: Number(salary),
          hire_date: hireDate,
          birth_date: birthDate,
          location: location.trim(),
          notes: notes.trim() || null,
        })
        .eq('id', editPersonnel.id);
      
      if (error) throw error;
      
      // Başarılı güncelleme
      setAlert({
        show: true,
        message: 'Personel başarıyla güncellendi',
        type: 'success'
      });
      
      // Listeyi güncelle
      handleCloseDialog();
      fetchPersonnel();
      
    } catch (error: any) {
      console.error('Personel güncelleme hatası:', error);
      setAlert({
        show: true,
        message: `Personel güncellenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeletePersonnel = async (id: number) => {
    if (!window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('personnel')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Başarılı silme
      setAlert({
        show: true,
        message: 'Personel başarıyla silindi',
        type: 'success'
      });
      
      // Listeyi güncelle
      fetchPersonnel();
      
    } catch (error: any) {
      console.error('Personel silme hatası:', error);
      setAlert({
        show: true,
        message: `Personel silinirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };
  
  // Para birimini formatlayan yardımcı fonksiyon
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Personel Listesi
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/personnel-add')}
          >
            Yeni Personel Ekle
          </Button>
        </Box>
        
        {/* Personel tablosu */}
        {loading && personnel.length === 0 ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : personnel.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Kayıtlı personel bulunmamaktadır. Yeni personel eklemek için "Yeni Personel Ekle" butonunu kullanabilirsiniz.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.lightgrey' }}>
                  <TableCell>Ad Soyad</TableCell>
                  <TableCell>Pozisyon</TableCell>
                  <TableCell>Maaş</TableCell>
                  <TableCell>İşe Giriş</TableCell>
                  <TableCell>Doğum Tarihi</TableCell>
                  <TableCell>Lokasyon</TableCell>
                  <TableCell>Notlar</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>{person.full_name}</TableCell>
                    <TableCell>{person.position}</TableCell>
                    <TableCell>{formatCurrency(person.salary)}</TableCell>
                    <TableCell>{formatDate(person.hire_date)}</TableCell>
                    <TableCell>{formatDate(person.birth_date)}</TableCell>
                    <TableCell>{person.location || '-'}</TableCell>
                    <TableCell>{person.notes || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton onClick={() => handleEditClick(person)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton 
                          onClick={() => handleDeletePersonnel(person.id)} 
                          size="small" 
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Düzenleme Diyaloğu */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Personel Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unvan / Pozisyon"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maaş (₺)"
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                margin="normal"
                required
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İşe Giriş Tarihi"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Doğum Tarihi"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lokasyon"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                margin="normal"
                required
                placeholder="Şehir, Bölge, Ülke"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bilgilendirme Snackbar */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, show: false })}
          severity={alert.type}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PersonnelList; 