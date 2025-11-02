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
  CircularProgress,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Category } from '../types/database';
import { capitalizeFirstLetter } from '../lib/formatHelpers';
import { logActivity } from '../lib/activityLogger';
import { logger } from '../utils/logger';
import { CategoryService } from '../services/categoryService';
import { useErrorHandler } from '../hooks/useErrorHandler';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const { error, showError, clearError } = useErrorHandler();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');

      if (!currentProjectId) {
        showError('Proje bulunamadı. Lütfen proje seçin.');
        return;
      }

      setLoading(true);
      const data = await CategoryService.getAll(parseInt(currentProjectId));
      setCategories(data);
    } catch (err) {
      showError(err);
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
      const currentProjectId = localStorage.getItem('currentProjectId');

      if (!currentProjectId) {
        showError('Proje bulunamadı. Lütfen proje seçin.');
        return;
      }

      if (!newCategoryName.trim()) {
        showError('Kategori adı boş olamaz');
        return;
      }

      const formattedCategoryName = capitalizeFirstLetter(newCategoryName);

      // Check if name exists (excluding current category if editing)
      const nameExists = await CategoryService.nameExists(
        formattedCategoryName,
        parseInt(currentProjectId),
        editingCategory?.id
      );

      if (nameExists) {
        const confirmMessage = editingCategory
          ? `"${formattedCategoryName}" isimli başka kategoriler de var. Yine de bu ismi kullanmak istiyor musunuz?`
          : `"${formattedCategoryName}" isimli bir kategori zaten var. Aynı isimde yeni bir kategori eklemek istiyor musunuz?`;

        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      if (editingCategory) {
        await CategoryService.update({
          id: editingCategory.id,
          name: formattedCategoryName,
        });

        try {
          await logActivity(
            'category_update',
            `"${formattedCategoryName}" kategorisi güncellendi.`,
            'category',
            editingCategory.id
          );
        } catch (activityError) {
          logger.error('Failed to log activity:', activityError);
        }

        setSuccessMessage(`Kategori başarıyla güncellendi: ${formattedCategoryName}`);
      } else {
        const created = await CategoryService.create({
          name: formattedCategoryName,
          project_id: parseInt(currentProjectId),
        });

        try {
          await logActivity(
            'category_create',
            `"${formattedCategoryName}" kategorisi eklendi.`,
            'category',
            created.id
          );
        } catch (activityError) {
          logger.error('Failed to log activity:', activityError);
        }

        setSuccessMessage(`Yeni kategori başarıyla eklendi: ${formattedCategoryName}`);
      }

      handleCloseDialog();
      await fetchCategories();
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const currentProjectId = localStorage.getItem('currentProjectId');

      if (!currentProjectId) {
        showError('Proje bulunamadı');
        return;
      }

      // Get category name before deletion for activity log
      const category = categories.find(c => c.id === id);
      const categoryName = category?.name || 'Bilinmeyen kategori';

      await CategoryService.delete(id, parseInt(currentProjectId));

      try {
        await logActivity(
          'category_delete',
          `"${categoryName}" kategorisi silindi.`,
          'category',
          id
        );
      } catch (activityError) {
        logger.error('Failed to log activity:', activityError);
      }

      setSuccessMessage('Kategori başarıyla silindi');
      await fetchCategories();
    } catch (err) {
      showError(err);
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error.message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Henüz kategori bulunmamaktadır.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Paper sx={{ p: 2, position: 'relative' }}>
                <Typography variant="h6">{category.name}</Typography>
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSaveCategory} color="primary" variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

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

export default Categories;
