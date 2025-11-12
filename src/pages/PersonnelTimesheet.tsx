import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
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
import { supabase } from '../lib/supabase';
import { Personnel, Timesheet } from '../types/database';
import { format, addMonths, subMonths, setDate, getDaysInMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const PersonnelTimesheet = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Uyarı mesajları için state
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info' | 'warning'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Güncellenmiş puantaj verileri
  const [timesheetChanges, setTimesheetChanges] = useState<Record<string, any>>({});

  // Ayın günlerini oluştur
  const daysInMonth = useMemo(() => {
    const days = [];
    const daysCount = getDaysInMonth(currentMonth);

    for (let i = 1; i <= daysCount; i++) {
      const day = setDate(currentMonth, i);
      days.push(day);
    }

    return days;
  }, [currentMonth]);

  const fetchTimesheets = useCallback(async () => {
    try {
      setLoading(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }

      // Ay başlangıç ve bitiş tarihleri
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('timesheet')
        .select('*')
        .eq('project_id', currentProjectId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      setTimesheets(data || []);
      setTimesheetChanges({});

    } catch (error: any) {
      console.error('Puantaj listesi alınırken hata:', error);
      setAlert({
        show: true,
        message: `Puantaj yüklenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (personnel.length > 0) {
      fetchTimesheets();
    }
  }, [personnel, fetchTimesheets]);
  
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
    
    // Önce değişiklik varsa onu kontrol et
    if (timesheetChanges[key]) {
      return timesheetChanges[key].status;
    }
    
    // Aksi halde var olan durumu döndür
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
        throw new Error('Proje ID bulunamadı');
      }
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      const timesheetEntries = Object.values(timesheetChanges);
      
      if (timesheetEntries.length === 0) {
        setAlert({
          show: true,
          message: 'Kaydedilecek değişiklik bulunmamaktadır',
          type: 'info',
        });
        return;
      }
      
      // Puantaj kayıtlarını döngüyle ekle/güncelle
      for (const entry of timesheetEntries) {
        const { personnel_id, date, status } = entry;
        
        // İlgili tarih için kayıt var mı kontrol et
        const existingTimesheet = timesheets.find(
          t => t.personnel_id === personnel_id && t.date.split('T')[0] === date
        );
        
        if (existingTimesheet) {
          // Kayıt varsa güncelle
          const { error } = await supabase
            .from('timesheet')
            .update({
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTimesheet.id);
            
          if (error) throw error;
        } else {
          // Kayıt yoksa ekle
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
            
          if (error) throw error;
        }
      }
      
      // Başarılı mesajı göster
      setAlert({
        show: true,
        message: 'Puantaj bilgileri başarıyla kaydedildi',
        type: 'success'
      });
      
      // Puantaj listesini yenile
      fetchTimesheets();
      
    } catch (error: any) {
      console.error('Puantaj kaydetme hatası:', error);
      setAlert({
        show: true,
        message: `Puantaj kaydedilirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'present':
        return { bg: '#e3f2fd', text: '#0d47a1' }; // Mavi
      case 'absent':
        return { bg: '#ffebee', text: '#b71c1c' }; // Kırmızı
      case 'half_day':
        return { bg: '#fff8e1', text: '#f57f17' }; // Sarı
      case 'leave':
        return { bg: '#e8f5e9', text: '#1b5e20' }; // Yeşil
      case 'holiday':
        return { bg: '#f3e5f5', text: '#7b1fa2' }; // Mor
      default:
        return { bg: '#f5f5f5', text: '#757575' }; // Gri
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
    // Ay ve yıl formatı: "Ocak 2023"
    return format(date, 'MMMM yyyy', { locale: tr });
  };
  
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0: Pazar, 6: Cumartesi
  };
  
  const exportToExcel = () => {
    try {
      // Excel formatında dönüştürülecek veriyi hazırla
      // Worksheet oluştur
      const worksheet = XLSX.utils.aoa_to_sheet([]);
      
      // Başlık satırı: Personel adı ve ayın günleri
      const headers = ['Personel Adı', 'Pozisyon'];
      daysInMonth.forEach(day => {
        headers.push(format(day, 'd MMM (EEE)', { locale: tr }));
      });
      
      // Başlık satırını ekle
      XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
      
      // Stilendirme için kolon genişlikleri
      const wscols = [
        { wch: 20 }, // Personel Adı
        { wch: 15 }, // Pozisyon
      ];
      
      // Günler için kolon genişlikleri
      daysInMonth.forEach(() => {
        wscols.push({ wch: 15 });
      });
      
      worksheet['!cols'] = wscols;
      
      // Veri satırları
      const data: string[][] = [];
      personnel.forEach((person, index) => {
        const row: string[] = [person.full_name, person.position];
        
        // Her gün için durum değerini ekle
        daysInMonth.forEach(day => {
          const status = getTimesheetStatus(person.id, day);
          row.push(status ? getStatusLabel(status) : '');
        });
        
        data.push(row);
      });
      
      // Veri satırlarını ekle
      XLSX.utils.sheet_add_aoa(worksheet, data, { origin: "A2" });
      
      // Workbook oluştur
      const workbook = XLSX.utils.book_new();
      const sheetName = `Puantaj ${format(currentMonth, 'MMM yyyy', { locale: tr })}`;
      
      // Worksheet'i Workbook'a ekle
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Excel dosyasını indir
      const fileName = `Personel_Puantaj_${format(currentMonth, 'MMMM_yyyy', { locale: tr })}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setAlert({
        show: true,
        message: 'Puantaj verileri Excel dosyası olarak indirildi',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Excel indirme hatası:', error);
      setAlert({
        show: true,
        message: `Excel dosyası oluşturulurken hata oluştu: ${error.message}`,
        type: 'error'
      });
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
                        <Typography>{person.full_name}</Typography>
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
        
        {/* Durum açıklamaları */}
        <Box mt={3} display="flex" gap={2} flexWrap="wrap">
          <Typography variant="subtitle2">Durum Açıklamaları:</Typography>
          {renderStatusChip('present')}
          {renderStatusChip('half_day')}
          {renderStatusChip('absent')}
          {renderStatusChip('leave')}
          {renderStatusChip('holiday')}
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

export default PersonnelTimesheet; 