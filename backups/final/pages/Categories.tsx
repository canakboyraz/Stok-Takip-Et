import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Category } from '../types/database';

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
        .from('categories')
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
      
      if (!newCategoryName.trim()) {
        alert('Kategori adı boş olamaz');
        return;
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: newCategoryName.trim() })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ 
            name: newCategoryName.trim(),
            project_id: parseInt(currentProjectId)
          }]);

        if (error) throw error;
      }

      handleCloseDialog();
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Kategori kaydedilemedi');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
              <Card>
                <CardContent>
                  <Typography variant="h6">{category.name}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
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