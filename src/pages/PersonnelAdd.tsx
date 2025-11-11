import React, { useState, useEffect } from 'react';
import {
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
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { PersonnelService } from '../services/personnelService';
import { useErrorHandler } from '../hooks/useErrorHandler';

const PersonnelAdd = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [hireDate, setHireDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { error, showError, clearError } = useErrorHandler();

  useEffect(() => {
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

      // Form validation
      if (!name.trim() || !position.trim() || salary === '' || !hireDate) {
        showError('Lütfen zorunlu alanları doldurun (Ad, Pozisyon, Maaş, İşe Giriş Tarihi)');
        return;
      }

      if (Number(salary) <= 0) {
        showError('Maaş sıfırdan büyük olmalıdır');
        return;
      }

      // Get project ID
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        showError('Proje bulunamadı. Lütfen proje seçin.');
        return;
      }

      // Create personnel
      await PersonnelService.create({
        name: name.trim(),
        position: position.trim(),
        salary: Number(salary),
        hire_date: hireDate,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        project_id: parseInt(projectId),
        is_active: true,
      });

      setSuccessMessage('Personel başarıyla eklendi');
      resetForm();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPosition('');
    setSalary('');
    setHireDate('');
    setEmail('');
    setPhone('');
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Personel Ekle
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 2 }} onClose={clearError}>
            {error.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                disabled={loading}
                placeholder="ornek@email.com"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                disabled={loading}
                placeholder="0555 123 45 67"
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

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PersonnelAdd;
