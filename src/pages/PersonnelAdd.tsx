import React, { useState, useEffect } from 'react';
import {
import { logger } from '../utils/logger';
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { Personnel } from '../types/database';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

const PersonnelAdd = () => {
  const navigate = useNavigate();
  
  // Form state'leri
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [hireDate, setHireDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state'leri
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  useEffect(() => {
    // Kullanıcı oturumunu kontrol et
    checkUserSession();
  }, []);
  
  const checkUserSession = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) {
      navigate('/login');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Form doğrulama
      if (!fullName.trim() || !position.trim() || salary === '' || !hireDate || !birthDate || !location.trim()) {
        setAlert({
          show: true,
          message: 'Lütfen zorunlu alanları doldurun',
          type: 'error'
        });
        return;
      }
      
      // Proje ID'sini al
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      // Kullanıcı bilgisini al
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      // Personel kaydını oluştur
      const { data, error } = await supabase
        .from('personnel')
        .insert({
          full_name: fullName.trim(),
          position: position.trim(),
          salary: Number(salary),
          hire_date: hireDate,
          birth_date: birthDate,
          location: location.trim(),
          notes: notes.trim() || null,
          project_id: projectId,
          user_id: userData.user.id,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Başarı mesajı göster
      setAlert({
        show: true,
        message: 'Personel başarıyla eklendi',
        type: 'success'
      });
      
      // Form alanlarını temizle
      resetForm();
      
    } catch (error: any) {
      logger.error('Personel ekleme hatası:', error);
      setAlert({
        show: true,
        message: `Personel eklenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFullName('');
    setPosition('');
    setSalary('');
    setHireDate('');
    setBirthDate('');
    setLocation('');
    setNotes('');
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Personel Ekle
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Unvan / Pozisyon"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Maaş (₺)"
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                margin="normal"
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="İşe Giriş Tarihi"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Doğum Tarihi"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Lokasyon"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                margin="normal"
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
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Temizle
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Personel Ekle'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
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

export default PersonnelAdd; 