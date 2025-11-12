import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Category } from '../types/database';
import { capitalizeFirstLetter } from '../lib/formatHelpers';
import { logActivity } from '../lib/activityLogger';
import { DB_TABLES } from '../utils/constants';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        return;
      }
      
      setLoading(true);
      
      const { data, error } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .order('name');

      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setNewCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setNewCategoryName('');
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setNewCategoryName('');
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    try {
      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        alert('Proje bilgisi bulunamadı. Lütfen tekrar proje seçin.');
        return;
      }
      
      // Kategori adı boş kontrolü
      if (!newCategoryName.trim()) {
        alert('Kategori adı boş olamaz');
        return;
      }

      // İlk harfi büyük geri kalanı küçük harfe çevir
      const formattedCategoryName = capitalizeFirstLetter(newCategoryName);

      // Kategori mevcut mu kontrol et - sadece bilgilendirme için
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', formattedCategoryName)
        .eq('project_id', parseInt(currentProjectId));
      
      // Kategori düzenleniyorsa ve aynı isimde başka kategoriler varsa bilgilendir
      if (existingCategories && existingCategories.length > 0 && 
          (!editingCategory || (editingCategory && existingCategories.some(c => c.id !== editingCategory.id)))) {
        const confirmMessage = editingCategory 
          ? `"${formattedCategoryName}" isimli başka kategoriler de var. Yine de bu ismi kullanmak istiyor musunuz?`
          : `"${formattedCategoryName}" isimli bir kategori zaten var. Aynı isimde yeni bir kategori eklemek istiyor musunuz?`;
        
        if (!window.confirm(confirmMessage)) {
          return; // Kullanıcı iptal ederse işlemi durdur
        }
      }

      // İşlemi gerçekleştir
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formattedCategoryName })
          .eq('id', editingCategory.id);

        if (error) {
          console.error('Kategori güncelleme hatası:', error);
          throw error;
        }
        
        // Etkinlik kaydı ekle
        try {
          const activityLogged = await logActivity(
            'category_update',
            `"${formattedCategoryName}" kategorisi güncellendi.`,
            'category',
            editingCategory.id
          );
          console.log('Category update activity logged:', activityLogged);
        } catch (activityError) {
          console.error('Failed to log category update activity:', activityError);
        }
        
        alert(`Kategori başarıyla güncellendi: ${formattedCategoryName}`);
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert([{ 
            name: formattedCategoryName,
            project_id: parseInt(currentProjectId),
            created_at: new Date().toISOString()
          }])
          .select();

        if (error) {
          console.error('Kategori ekleme hatası:', error);
          throw error;
        }
        
        // Etkinlik kaydı ekle
        if (data && data.length > 0) {
          try {
            const activityLogged = await logActivity(
              'category_create',
              `"${formattedCategoryName}" kategorisi eklendi.`,
              'category',
              data[0].id
            );
            console.log('Category creation activity logged:', activityLogged);
          } catch (activityError) {
            console.error('Failed to log category creation activity:', activityError);
          }
        }
        
        alert(`Yeni kategori başarıyla eklendi: ${formattedCategoryName}`);
      }

      handleCloseDialog();
      await fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      
      // Daha detaylı hata mesajı göster
      if (error.message && error.message.includes('duplicate key value')) {
        alert('Bu isimde bir kategori zaten mevcut. Lütfen farklı bir isim kullanın.');
      } else {
        alert(`Kategori kaydedilemedi: ${error.message || 'Bilinmeyen hata'}`);
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Kategori bilgilerini al
      const { data: categoryData, error: fetchError } = await supabase
        .from('categories')
        .select('name')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Kategori bilgisi alınamadı:', fetchError);
      }
      
      const categoryName = categoryData?.name || 'Bilinmeyen kategori';
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Etkinlik kaydı ekle
      try {
        const activityLogged = await logActivity(
          'category_delete',
          `"${categoryName}" kategorisi silindi.`,
          'category',
          id
        );
        console.log('Category deletion activity logged:', activityLogged);
      } catch (activityError) {
        console.error('Failed to log category deletion activity:', activityError);
      }

      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Kategori silinemedi. Bu kategoriye ait ürünler olabilir.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Kategoriler</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Kategori
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography>Yükleniyor...</Typography>
        </Box>
      ) : categories.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Henüz kategori bulunmamaktadır.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Paper>
                <Typography variant="h6" sx={{ p: 2 }}>{category.name}</Typography>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenDialog(category)}
                  sx={{ position: 'absolute', top: 5, right: 5 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteCategory(category.id)}
                  sx={{ position: 'absolute', top: 5, right: 40 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* New/Edit Category Dialog */}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kategori Adı"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSaveCategory} color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Categories; 