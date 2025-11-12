import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { supabase } from '../lib/supabase';

const ExpenseAdd = () => {
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!expenseName.trim()) {
      setAlert({
        show: true,
        message: 'Lütfen gider adını girin',
        type: 'error'
      });
      return;
    }
    
    if (!expenseAmount) {
      setAlert({
        show: true,
        message: 'Lütfen gider tutarını girin',
        type: 'error'
      });
      return;
    }
    
    if (!expenseDate) {
      setAlert({
        show: true,
        message: 'Lütfen gider tarihini seçin',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Kullanıcı ve proje bilgisini al
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('Kullanıcı bilgisi alınamadı');
      }
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje bilgisi bulunamadı');
      }
      
      // Formatlanmış tarih (ISO formatı)
      const formattedDate = new Date(expenseDate).toISOString();
      
      console.log('Gider ekleniyor:', {
        name: expenseName.trim(),
        amount: Number(expenseAmount),
        date: formattedDate,
        notes: expenseNotes.trim() || null,
        project_id: parseInt(currentProjectId),
        user_id: userData.user.id,
      });
      
      // Yeni gider kaydı ekle
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            name: expenseName.trim(),
            amount: Number(expenseAmount),
            date: formattedDate,
            notes: expenseNotes.trim() || null,
            project_id: parseInt(currentProjectId),
            user_id: userData.user.id,
          },
        ])
        .select();

      if (error) throw error;
      
      // Başarılı kayıt
      setAlert({
        show: true,
        message: 'Gider başarıyla eklendi',
        type: 'success'
      });
      
      // Formu sıfırla
      setExpenseName('');
      setExpenseAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseNotes('');
      
    } catch (error: any) {
      console.error('Gider ekleme hatası:', error);
      setAlert({
        show: true,
        message: `Gider eklenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Gider Ekle
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Gider Adı"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                disabled={loading}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Tutar (₺)"
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={loading}
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
                label="Tarih"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={loading}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                multiline
                rows={3}
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                disabled={loading}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Gider Ekle'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
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

export default ExpenseAdd; 