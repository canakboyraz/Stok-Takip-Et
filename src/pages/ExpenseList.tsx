import React, { useState, useEffect, useCallback } from 'react';
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
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { logger } from '../utils/logger';
import { ExpenseService, Expense } from '../services/expenseService';
import { useErrorHandler } from '../hooks/useErrorHandler';

const ExpenseList = () => {
  // State variables
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { error, showError, clearError } = useErrorHandler();

  // Form states
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const fetchExpenses = useCallback(async (start?: string | null, end?: string | null) => {
    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı. Lütfen proje seçin.');
        return;
      }

      const data = await ExpenseService.getAll({
        projectId: parseInt(currentProjectId),
        startDate: start && start.trim() !== '' ? start : undefined,
        endDate: end && end.trim() !== '' ? end : undefined,
      });

      // Apply search term (client-side filtering)
      let filteredData = data;

      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        filteredData = data.filter(expense =>
          (expense.category && expense.category.toLowerCase().includes(term)) ||
          (expense.description && expense.description.toLowerCase().includes(term))
        );
      }

      setExpenses(filteredData);

      // Calculate total amount
      const total = filteredData.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalAmount(total);

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showError]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFilter = () => {
    fetchExpenses(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    fetchExpenses();
  };

  const handleEditClick = (expense: Expense) => {
    setEditExpense(expense);
    setExpenseCategory(expense.category);
    setExpenseAmount(expense.amount);
    setExpenseDate(expense.date ? expense.date.split('T')[0] : '');
    setExpenseDescription(expense.description || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditExpense(null);
    clearError();
  };

  const handleSaveEdit = async () => {
    if (!editExpense) return;

    try {
      setLoading(true);

      // Form validation
      if (!expenseCategory.trim() || !expenseAmount || !expenseDate) {
        showError('Lütfen gerekli alanları doldurun (Kategori, Tutar, Tarih)');
        return;
      }

      if (Number(expenseAmount) <= 0) {
        showError('Tutar sıfırdan büyük olmalıdır');
        return;
      }

      // Update operation
      await ExpenseService.update({
        id: editExpense.id,
        category: expenseCategory.trim(),
        amount: Number(expenseAmount),
        date: expenseDate,
        description: expenseDescription.trim() || undefined,
      });

      // Success
      setSuccessMessage('Gider başarıyla güncellendi');
      handleCloseDialog();
      fetchExpenses(startDate, endDate);

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı');
        return;
      }

      await ExpenseService.delete(id, parseInt(currentProjectId));

      // Success
      setSuccessMessage('Gider başarıyla silindi');
      fetchExpenses(startDate, endDate);

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  // Helper function to format currency
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
        <Typography variant="h5" component="h1" gutterBottom>
          Gider Listesi
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error.message}
          </Alert>
        )}

        {/* Filter section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Başlangıç Tarihi"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bitiş Tarihi"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleFilter}
                  sx={{ mt: 1 }}
                >
                  Filtrele
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilter}
                  sx={{ mt: 1 }}
                >
                  Temizle
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kategori veya Açıklama Ara"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Search is applied instantly with debounce
                  setTimeout(() => fetchExpenses(startDate, endDate), 300);
                }}
                margin="normal"
                InputProps={{
                  endAdornment: searchTerm ? (
                    <IconButton size="small" onClick={() => {
                      setSearchTerm('');
                      fetchExpenses(startDate, endDate);
                    }}>
                      <ClearIcon />
                    </IconButton>
                  ) : null
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Total amount section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6">
            Toplam Gider: {formatCurrency(totalAmount)}
          </Typography>
          <Typography variant="caption">
            {startDate && endDate
              ? `${startDate} - ${endDate} arası`
              : startDate
              ? `${startDate} tarihinden itibaren`
              : endDate
              ? `${endDate} tarihine kadar`
              : 'Tüm zamanlar'}
            {searchTerm && ` | Arama: "${searchTerm}"`}
          </Typography>
        </Box>

        {/* Expense table */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : expenses.length === 0 ? (
          <Alert severity="info">
            Seçilen tarih aralığında gider bulunmamaktadır.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.lightgrey' }}>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{expense.description || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton onClick={() => handleEditClick(expense)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          onClick={() => handleDeleteExpense(expense.id)}
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

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Gider Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kategori"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tutar (₺)"
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
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
                label="Tarih"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                margin="normal"
                required
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

      {/* Success Snackbar */}
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

export default ExpenseList;
