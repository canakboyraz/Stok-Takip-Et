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
import { supabase } from '../lib/supabase';
import { Expense } from '../types/database';
import { format, parseISO } from 'date-fns';

const ExpenseList = () => {
  // State değişkenleri
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Form state'leri
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState('');
  
  const fetchExpenses = useCallback(async (start?: string | null, end?: string | null) => {
    try {
      setLoading(true);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('date', { ascending: false });
      
      // Tarih filtresi ekle
      if (start && start.trim() !== '') {
        const startStr = new Date(start).toISOString().split('T')[0];
        query = query.gte('date', startStr);
      }
      
      if (end && end.trim() !== '') {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        const endStr = endDate.toISOString();
        query = query.lte('date', endStr);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Verileri state'e kaydet
      if (data) {
        // Arama terimini uygula (client-side filtering)
        let filteredData = data;
        
        if (searchTerm && searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase().trim();
          filteredData = data.filter(expense => 
            (expense.name && expense.name.toLowerCase().includes(term)) || 
            (expense.notes && expense.notes.toLowerCase().includes(term))
          );
        }
        
        setExpenses(filteredData);
        
        // Toplam tutarı hesapla
        const total = filteredData.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalAmount(total);
      }
    } catch (error: any) {
      console.error('Gider listesi alınırken hata:', error);
      setAlert({
        show: true,
        message: `Giderler yüklenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);
  
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
    setExpenseName(expense.name);
    setExpenseAmount(expense.amount);
    setExpenseDate(expense.date ? expense.date.split('T')[0] : '');
    setExpenseNotes(expense.notes || '');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditExpense(null);
  };
  
  const handleSaveEdit = async () => {
    if (!editExpense) return;
    
    try {
      setLoading(true);
      
      // Form doğrulama
      if (!expenseName.trim() || !expenseAmount || !expenseDate) {
        setAlert({
          show: true,
          message: 'Lütfen gerekli alanları doldurun',
          type: 'error'
        });
        return;
      }
      
      // Formatlanmış tarih
      const formattedDate = new Date(expenseDate).toISOString();
      
      // Güncelleme işlemi
      const { error } = await supabase
        .from('expenses')
        .update({
          name: expenseName.trim(),
          amount: Number(expenseAmount),
          date: formattedDate,
          notes: expenseNotes.trim() || null,
        })
        .eq('id', editExpense.id)
        .select();

      if (error) throw error;
      
      // Başarılı güncelleme
      setAlert({
        show: true,
        message: 'Gider başarıyla güncellendi',
        type: 'success'
      });
      
      // Listeyi güncelle
      handleCloseDialog();
      fetchExpenses(startDate, endDate);
      
    } catch (error: any) {
      console.error('Gider güncelleme hatası:', error);
      setAlert({
        show: true,
        message: `Gider güncellenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Başarılı silme
      setAlert({
        show: true,
        message: 'Gider başarıyla silindi',
        type: 'success'
      });
      
      // Listeyi güncelle
      fetchExpenses(startDate, endDate);
      
    } catch (error: any) {
      console.error('Gider silme hatası:', error);
      setAlert({
        show: true,
        message: `Gider silinirken hata oluştu: ${error.message}`,
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
        <Typography variant="h5" component="h1" gutterBottom>
          Gider Listesi
        </Typography>
        
        {/* Filtre bölümü */}
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
                label="Gider Adı veya Not Ara"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // İsim araması anlık olarak uygulanabilir (tarih arama için butona basma gerekiyor)
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
        
        {/* Toplam tutar kısmı */}
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
        
        {/* Gider tablosu */}
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
                  <TableCell>Gider Adı</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Notlar</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.name}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{expense.notes || '-'}</TableCell>
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
      
      {/* Düzenleme Diyaloğu */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Gider Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gider Adı"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
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
                label="Notlar"
                multiline
                rows={3}
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
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

export default ExpenseList; 