import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Chip
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Save as SaveIcon,
  Event as CalendarIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { format, parseISO, addMonths, subMonths, setDate, getDaysInMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { logger } from '../utils/logger';
import { PersonnelService, Personnel } from '../services/personnelService';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { supabase } from '../lib/supabase';

interface TimesheetRecord {
  id: number;
  personnel_id: number;
  date: string;
  status: string;
  project_id: number;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

const PersonnelTimesheet = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState('');

  const { error, showError, clearError } = useErrorHandler();

  // Updated timesheet data
  const [timesheetChanges, setTimesheetChanges] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (personnel.length > 0) {
      fetchTimesheets();
    }
  }, [personnel, currentMonth]);

  // Generate days in month
  const daysInMonth = useMemo(() => {
    const days = [];
    const daysCount = getDaysInMonth(currentMonth);

    for (let i = 1; i <= daysCount; i++) {
      const day = setDate(currentMonth, i);
      days.push(day);
    }

    return days;
  }, [currentMonth]);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı. Lütfen proje seçin.');
        return;
      }

      const data = await PersonnelService.getAll({
        projectId: parseInt(currentProjectId),
        isActive: true
      });

      setPersonnel(data);

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheets = async () => {
    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı');
        return;
      }

      // Month start and end dates
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('timesheet')
        .select('*')
        .eq('project_id', currentProjectId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) {
        logger.error('Timesheet fetch error:', error);
        showError(error.message);
        return;
      }

      setTimesheets(data || []);
      setTimesheetChanges({});

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const handleTimesheetChange = (personnelId: number, date: Date, status: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${personnelId}-${dateStr}`;

    setTimesheetChanges(prev => ({
      ...prev,
      [key]: {
        personnel_id: personnelId,
        date: dateStr,
        status
      }
    }));
  };

  const getTimesheetStatus = (personnelId: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${personnelId}-${dateStr}`;

    // Check if there are changes first
    if (timesheetChanges[key]) {
      return timesheetChanges[key].status;
    }

    // Otherwise return existing status
    const existingTimesheet = timesheets.find(
      t => t.personnel_id === personnelId && t.date.split('T')[0] === dateStr
    );

    return existingTimesheet ? existingTimesheet.status : '';
  };

  const handleSaveTimesheets = async () => {
    try {
      setSaving(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        showError('Proje ID bulunamadı');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        showError('Kullanıcı oturumu bulunamadı');
        return;
      }

      const timesheetEntries = Object.values(timesheetChanges);

      if (timesheetEntries.length === 0) {
        showError('Kaydedilecek değişiklik bulunmamaktadır');
        return;
      }

      // Loop through and add/update timesheet records
      for (const entry of timesheetEntries) {
        const { personnel_id, date, status } = entry;

        // Check if record exists for this date
        const existingTimesheet = timesheets.find(
          t => t.personnel_id === personnel_id && t.date.split('T')[0] === date
        );

        if (existingTimesheet) {
          // Update existing record
          const { error } = await supabase
            .from('timesheet')
            .update({
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTimesheet.id);

          if (error) {
            logger.error('Timesheet update error:', error);
            throw new Error(error.message);
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('timesheet')
            .insert({
              personnel_id,
              date,
              status,
              project_id: currentProjectId,
              user_id: userData.user.id,
              created_at: new Date().toISOString()
            });

          if (error) {
            logger.error('Timesheet insert error:', error);
            throw new Error(error.message);
          }
        }
      }

      // Show success message
      setSuccessMessage('Puantaj bilgileri başarıyla kaydedildi');

      // Refresh timesheet list
      fetchTimesheets();

    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'present':
        return { bg: '#e3f2fd', text: '#0d47a1' }; // Blue
      case 'absent':
        return { bg: '#ffebee', text: '#b71c1c' }; // Red
      case 'half_day':
        return { bg: '#fff8e1', text: '#f57f17' }; // Yellow
      case 'leave':
        return { bg: '#e8f5e9', text: '#1b5e20' }; // Green
      case 'holiday':
        return { bg: '#f3e5f5', text: '#7b1fa2' }; // Purple
      default:
        return { bg: '#f5f5f5', text: '#757575' }; // Gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'present': return 'Tam Gün';
      case 'absent': return 'Yok';
      case 'half_day': return 'Yarım Gün';
      case 'leave': return 'İzinli';
      case 'holiday': return 'Tatil';
      default: return '';
    }
  };

  const renderStatusChip = (status: string) => {
    if (!status) return '';

    const { bg, text } = getStatusColor(status);
    return (
      <Chip
        label={getStatusLabel(status)}
        size="small"
        sx={{
          bgcolor: bg,
          color: text,
          fontWeight: 'medium',
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const formatMonthYear = (date: Date) => {
    // Month and year format: "Ocak 2023"
    return format(date, 'MMMM yyyy', { locale: tr });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0: Sunday, 6: Saturday
  };

  const exportToExcel = () => {
    try {
      // Prepare data to convert to Excel format
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      // Header row: Personnel name and month days
      const headers = ['Personel Adı', 'Pozisyon'];
      daysInMonth.forEach(day => {
        headers.push(format(day, 'd MMM (EEE)', { locale: tr }));
      });

      // Add header row
      XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

      // Column widths for styling
      const wscols = [
        { wch: 20 }, // Personnel Name
        { wch: 15 }, // Position
      ];

      // Column widths for days
      daysInMonth.forEach(() => {
        wscols.push({ wch: 15 });
      });

      worksheet['!cols'] = wscols;

      // Data rows
      const data: string[][] = [];
      personnel.forEach((person, index) => {
        const row: string[] = [person.name, person.position];

        // Add status value for each day
        daysInMonth.forEach(day => {
          const status = getTimesheetStatus(person.id, day);
          row.push(status ? getStatusLabel(status) : '');
        });

        data.push(row);
      });

      // Add data rows
      XLSX.utils.sheet_add_aoa(worksheet, data, { origin: "A2" });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const sheetName = `Puantaj ${format(currentMonth, 'MMM yyyy', { locale: tr })}`;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Download Excel file
      const fileName = `Personel_Puantaj_${format(currentMonth, 'MMMM_yyyy', { locale: tr })}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setSuccessMessage('Puantaj verileri Excel dosyası olarak indirildi');
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Personel Puantaj
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handlePrevMonth}>
              <PrevIcon />
            </IconButton>

            <Box display="flex" alignItems="center">
              <CalendarIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                {formatMonthYear(currentMonth)}
              </Typography>
            </Box>

            <IconButton onClick={handleNextMonth}>
              <NextIcon />
            </IconButton>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveTimesheets}
              disabled={saving || Object.keys(timesheetChanges).length === 0}
            >
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
              disabled={loading || personnel.length === 0}
            >
              Excel Olarak İndir
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error.message}
          </Alert>
        )}

        {personnel.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Kayıtlı personel bulunamadı. Önce personel eklemelisiniz.
          </Alert>
        ) : loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>Personel</TableCell>
                  {daysInMonth.map(day => (
                    <TableCell
                      key={day.toISOString()}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: isWeekend(day) ? 'rgba(0,0,0,0.05)' : 'inherit'
                      }}
                    >
                      <Tooltip title={format(day, 'EEEE', { locale: tr })}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            {format(day, 'EEE', { locale: tr })}
                          </Typography>
                          <Typography variant="body2">
                            {format(day, 'd', { locale: tr })}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {personnel.map(person => (
                  <TableRow key={person.id}>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      <Box>
                        <Typography>{person.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {person.position}
                        </Typography>
                      </Box>
                    </TableCell>
                    {daysInMonth.map(day => {
                      const status = getTimesheetStatus(person.id, day);
                      return (
                        <TableCell
                          key={`${person.id}-${day.toISOString()}`}
                          align="center"
                          sx={{
                            bgcolor: isWeekend(day) ? 'rgba(0,0,0,0.05)' : 'inherit',
                            padding: '5px 10px',
                            minWidth: '100px'
                          }}
                        >
                          <FormControl fullWidth size="small">
                            <Select
                              value={status}
                              onChange={(e) => handleTimesheetChange(person.id, day, e.target.value)}
                              displayEmpty
                              sx={{
                                '.MuiSelect-select': {
                                  display: 'flex',
                                  justifyContent: 'center'
                                }
                              }}
                            >
                              <MenuItem value=""><em>Seçiniz</em></MenuItem>
                              <MenuItem value="present">Tam Gün</MenuItem>
                              <MenuItem value="half_day">Yarım Gün</MenuItem>
                              <MenuItem value="absent">Yok</MenuItem>
                              <MenuItem value="leave">İzinli</MenuItem>
                              <MenuItem value="holiday">Tatil</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Status descriptions */}
        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          <Typography variant="subtitle2">Durum Açıklamaları:</Typography>
          {renderStatusChip('present')}
          {renderStatusChip('half_day')}
          {renderStatusChip('absent')}
          {renderStatusChip('leave')}
          {renderStatusChip('holiday')}
        </Box>
      </Paper>

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

export default PersonnelTimesheet;
