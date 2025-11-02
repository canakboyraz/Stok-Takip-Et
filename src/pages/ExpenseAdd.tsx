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
import { logger } from '../utils/logger';
import { ExpenseService } from '../services/expenseService';
import { useErrorHandler } from '../hooks/useErrorHandler';

const ExpenseAdd = () => {
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { error, showError, clearError } = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!expenseCategory.trim()) {
      showError('Lütfen gider kategorisini girin');
      return;
    }

    if (!expenseAmount || expenseAmount <= 0) {
      showError('Lütfen geçerli bir tutar girin');
      return;
    }

    if (!expenseDate) {
      showError('Lütfen gider tarihini seçin');
      return;
    }

    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje bilgisi bulunamadı. Lütfen proje seçin.');
        return;
      }

      const formattedDate = new Date(expenseDate).toISOString();

      await ExpenseService.create({
        category: expenseCategory.trim(),
        amount: Number(expenseAmount),
        date: formattedDate,
        description: expenseDescription.trim() || undefined,
        project_id: parseInt(currentProjectId),
      });

      setSuccessMessage('Gider başarıyla eklendi');

      // Reset form
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseDescription('');
    } catch (err) {
      showError(err);
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Gider Kategorisi"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                disabled={loading}
                margin="normal"
                placeholder="Örn: Kira, Maaş, Elektrik"
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
                label="Açıklama"
                multiline
                rows={3}
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                disabled={loading}
                margin="normal"
                placeholder="Gider detayları..."
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

export default ExpenseAdd;
