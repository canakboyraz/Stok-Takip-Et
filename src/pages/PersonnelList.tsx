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
  Snackbar,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { PersonnelService, Personnel } from '../services/personnelService';
import { useErrorHandler } from '../hooks/useErrorHandler';

const PersonnelList = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPersonnel, setEditPersonnel] = useState<Personnel | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [hireDate, setHireDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const { error, showError, clearError } = useErrorHandler();

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı. Lütfen proje seçin.');
        return;
      }

      const data = await PersonnelService.getAll({
        projectId: parseInt(currentProjectId)
      });

      setPersonnel(data);

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (person: Personnel) => {
    setEditPersonnel(person);
    setName(person.name);
    setPosition(person.position);
    setSalary(person.salary);
    setHireDate(person.hire_date.split('T')[0]);
    setEmail(person.email || '');
    setPhone(person.phone || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditPersonnel(null);
    clearError();
  };

  const handleSaveEdit = async () => {
    if (!editPersonnel) return;

    try {
      setLoading(true);

      // Form validation
      if (!name.trim() || !position.trim() || salary === '' || !hireDate) {
        showError('Lütfen gerekli alanları doldurun (Ad, Pozisyon, Maaş, İşe Giriş Tarihi)');
        return;
      }

      if (Number(salary) <= 0) {
        showError('Maaş sıfırdan büyük olmalıdır');
        return;
      }

      // Update operation
      await PersonnelService.update({
        id: editPersonnel.id,
        name: name.trim(),
        position: position.trim(),
        salary: Number(salary),
        hire_date: hireDate,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // Success
      setSuccessMessage('Personel başarıyla güncellendi');
      handleCloseDialog();
      fetchPersonnel();

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePersonnel = async (id: number) => {
    if (!window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı');
        return;
      }

      await PersonnelService.delete(id, parseInt(currentProjectId));

      // Success
      setSuccessMessage('Personel başarıyla silindi');
      fetchPersonnel();

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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error.message}
          </Alert>
        )}

        {/* Personnel table */}
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
                  <TableCell>E-posta</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.position}</TableCell>
                    <TableCell>{formatCurrency(person.salary)}</TableCell>
                    <TableCell>{formatDate(person.hire_date)}</TableCell>
                    <TableCell>{person.email || '-'}</TableCell>
                    <TableCell>{person.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={person.is_active ? 'Aktif' : 'Pasif'}
                        color={person.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
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

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Personel Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                label="E-posta"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
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
                placeholder="0555 123 45 67"
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

export default PersonnelList;
