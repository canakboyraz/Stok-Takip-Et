import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { capitalizeFirstLetter } from '../lib/formatHelpers';

interface ProductTemplate {
  id: number;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  created_at?: string;
  project_id?: number;
}

interface Category {
  id: number;
  name: string;
}

const ProductTemplates = () => {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('Yeni Ürün Şablonu Ekle');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<ProductTemplate, 'id' | 'created_at' | 'project_id'>>({
    name: '',
    category: '',
    description: '',
    unit: 'kg'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    checkUserSession();
    fetchTemplates();
    fetchBaseCategories();
  }, [reloadKey]);

  useEffect(() => {
    if (open) {
      fetchBaseCategories();
    }
  }, [open]);

  const checkUserSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Oturum kontrolünde hata:', error);
        return;
      }
      
      if (!session) {
        console.error('Aktif oturum bulunamadı!');
        setSnackbar({
          open: true,
          message: 'Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.',
          severity: 'error'
        });
        return;
      }
      
      console.log('Aktif kullanıcı:', session.user.id);
    } catch (error) {
      console.error('Oturum kontrolünde beklenmeyen hata:', error);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        return;
      }
      
      console.log(`Fetching templates for project ID: ${currentProjectId}`);
      
      // Sadece mevcut projeye ait şablonları getir
      const { data, error } = await supabase
        .from('product_templates')
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .order('name');

      if (error) {
        console.error('Error fetching templates:', error);
        console.error('Error details:', JSON.stringify(error));
        setSnackbar({
          open: true,
          message: 'Ürün şablonları yüklenirken bir hata oluştu.',
          severity: 'error'
        });
        return;
      }

      console.log('Fetched templates for current project:', data);
      console.log('Template count for current project:', data ? data.length : 0);
      
      if (data && data.length === 0) {
        console.log('Hiç şablon bulunamadı. Sorgu ve proje ID kontrol edilmeli.');
        console.log('Current query:', `project_id = ${parseInt(currentProjectId)}`);
      }
      
      setTemplates(data || []);
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setSnackbar({
        open: true,
        message: 'Ürün şablonları yüklenirken bir hata oluştu.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseCategories = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage for base categories');
        setFetchedCategories([]);
        return;
      }
      
      console.log('🔍 Base categories (categories table only) loading. Project ID:', currentProjectId);
      
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('project_id', parseInt(currentProjectId))
        .order('name');

      if (error) {
        console.error('❌ Base category loading error:', error);
        setFetchedCategories([]);
        throw error;
      }
      
      console.log('✅ Base categories from DB (categories table):', data);
      
      const categoryNames = data ? data.map(category => capitalizeFirstLetter(category.name)) : [];
      console.log('📋 Base category names (categories table):', categoryNames);
      
      setFetchedCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching base categories:', error);
      setFetchedCategories([]);
    }
  };

  const handleOpenDialog = (template?: ProductTemplate) => {
    if (template) {
      setDialogTitle('Ürün Şablonunu Düzenle');
      setEditingId(template.id);
      setFormData({
        name: template.name,
        category: template.category,
        description: template.description || '',
        unit: template.unit
      });
    } else {
      setDialogTitle('Yeni Ürün Şablonu Ekle');
      setEditingId(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        unit: 'kg'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Ürün adı gereklidir.',
          severity: 'error'
        });
        return;
      }

      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        setSnackbar({
          open: true,
          message: 'Proje ID bulunamadı. Lütfen bir proje seçin.',
          severity: 'error'
        });
        return;
      }

      const formattedName = capitalizeFirstLetter(formData.name);
      const formattedCategory = capitalizeFirstLetter(formData.category);

      if (editingId) {
        const { error } = await supabase
          .from('product_templates')
          .update({
            name: formattedName,
            category: formattedCategory,
            description: formData.description,
            unit: formData.unit,
          })
          .eq('id', editingId);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: 'Ürün şablonu başarıyla güncellendi.',
          severity: 'success'
        });
      } else {
        console.log('Eklenecek şablon:', {
          name: formattedName,
          category: formattedCategory,
          description: formData.description,
          unit: formData.unit,
          project_id: parseInt(currentProjectId)
        });
        
        try {
          const { data, error } = await supabase.rpc('insert_product_template', {
            p_name: formattedName,
            p_category: formattedCategory,
            p_description: formData.description,
            p_unit: formData.unit,
            p_project_id: parseInt(currentProjectId)
          });
          
          if (error) {
            console.log('RPC hatası, normal insert deneniyor:', error);
            const { data: insertData, error: insertError } = await supabase
              .from('product_templates')
              .insert([{
                name: formattedName,
                category: formattedCategory,
                description: formData.description,
                unit: formData.unit,
                project_id: parseInt(currentProjectId)
              }])
              .select();
              
            if (insertError) throw insertError;
            console.log('Normal insert başarılı:', insertData);
            if (insertData && insertData.length > 0) {
              setTemplates(prevTemplates => [...prevTemplates, ...insertData]);
            }
          } else {
            console.log('RPC başarılı:', data);
            if (data) {
              if (typeof data === 'number') {
                const newTemplate = {
                  id: data,
                  name: formattedName,
                  category: formattedCategory,
                  description: formData.description,
                  unit: formData.unit,
                  project_id: parseInt(currentProjectId)
                };
                setTemplates(prevTemplates => [...prevTemplates, newTemplate]);
              } else if (Array.isArray(data)) {
                setTemplates(prevTemplates => [...prevTemplates, ...data]);
              }
            }
          }

          await fetchTemplates();
          
        } catch (insertError) {
          console.error('Şablon ekleme hatası:', insertError);
          throw insertError;
        }
        
        setSnackbar({
          open: true,
          message: 'Yeni ürün şablonu başarıyla eklendi.',
          severity: 'success'
        });
      }

      setOpen(false);
      reloadPage();
    } catch (error) {
      console.error('Error saving product template:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setSnackbar({
        open: true,
        message: 'Ürün şablonu kaydedilirken bir hata oluştu.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu ürün şablonunu silmek istediğinizden emin misiniz?')) return;

    try {
      setIsDeleting(id);
      const { error } = await supabase
        .from('product_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: 'Ürün şablonu başarıyla silindi.',
        severity: 'success'
      });
      
      setTimeout(() => {
        reloadPage();
      }, 500);
    } catch (error) {
      console.error('Error deleting product template:', error);
      setSnackbar({
        open: true,
        message: 'Ürün şablonu silinirken bir hata oluştu.',
        severity: 'error'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const reloadPage = () => {
    setReloadKey(prevKey => prevKey + 1);
  };

  const combinedCategoriesForAutocomplete = useMemo(() => {
    const templateCategories = templates.map(t => capitalizeFirstLetter(t.category));
    
    const allCats = [...fetchedCategories, ...templateCategories];
    
    const uniqueCategories: string[] = [];
    const seen: Record<string, boolean> = {};
    allCats.forEach(category => {
      const trimmedCat = category ? category.trim() : '';
      if (trimmedCat && !seen[trimmedCat]) {
        seen[trimmedCat] = true;
        uniqueCategories.push(trimmedCat);
      }
    });
    
    console.log('🔄 Combined unique categories for Autocomplete:', uniqueCategories);
    return uniqueCategories.sort();
  }, [templates, fetchedCategories]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Ürün Şablonları
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Şablon Ekle
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell>Ürün Adı</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Birim</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {searchTerm ? 'Arama kriterlerine uygun şablon bulunamadı.' : 'Henüz bir ürün şablonu eklenmemiş.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.category}</TableCell>
                      <TableCell>{template.unit}</TableCell>
                      <TableCell>{template.description || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(template)}
                          disabled={isDeleting !== null}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(template.id)}
                          disabled={isDeleting !== null}
                        >
                          {isDeleting === template.id ? <CircularProgress size={24} /> : <DeleteIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ürün Adı"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                value={formData.category}
                onChange={(_event, newValue) => {
                  const categoryValue = newValue ? String(newValue).trim() : 'Diğer';
                  setFormData({ ...formData, category: categoryValue || 'Diğer' });
                }}
                options={combinedCategoriesForAutocomplete}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kategori"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Birim"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                helperText="Örn: kg, adet, demet"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductTemplates; 