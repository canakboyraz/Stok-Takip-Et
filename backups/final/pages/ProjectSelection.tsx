import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Project } from '../types/database';

const ProjectSelection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'warning' | 'info' | 'success'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı bilgisini al
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error("Kullanıcı bilgisi alınamadı");
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setSnackbar({
        open: true,
        message: `Projeler yüklenirken hata oluştu: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: number) => {
    try {
      console.log(`[ProjectSelection] Proje seçildi, ID: ${projectId}`);
      
      // Önce localStorage'ı temizle ve sonra yeni proje ID'sini kaydet
      localStorage.removeItem('currentProjectId');
      localStorage.setItem('currentProjectId', projectId.toString());
      
      // localStorage'da değerin doğru ayarlandığını kontrol et
      const savedId = localStorage.getItem('currentProjectId');
      console.log(`[ProjectSelection] localStorage'a kaydedilen proje ID: ${savedId}`);
      
      if (savedId !== projectId.toString()) {
        console.error(`[ProjectSelection] localStorage'a kayıt hatası: ${savedId} != ${projectId}`);
        throw new Error('Proje ID localStorage\'a kaydedilemedi');
      }
      
      // Dashboard'a yönlendir
      setTimeout(() => {
        console.log(`[ProjectSelection] Dashboard'a yönlendiriliyor`);
        navigate('/dashboard');
      }, 100); // localStorage'un güncellenmesi için kısa bir gecikme
    } catch (error) {
      console.error('[ProjectSelection] Proje açma hatası:', error);
      setSnackbar({
        open: true,
        message: 'Proje açılırken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setNewProject({
        name: project.name,
        description: project.description || '',
      });
    } else {
      setEditingProject(null);
      setNewProject({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setNewProject({ name: '', description: '' });
  };

  const handleSaveProject = async () => {
    if (!newProject.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Proje adı boş olamaz',
        severity: 'error'
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error("Kullanıcı bilgisi alınamadı");
      }

      if (editingProject) {
        // Projeyi güncelle
        const { error } = await supabase
          .from('projects')
          .update({
            name: newProject.name,
            description: newProject.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProject.id);

        if (error) throw error;

        setSnackbar({
          open: true,
          message: 'Proje başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        // Yeni proje oluştur
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            name: newProject.name,
            description: newProject.description || null,
            user_id: userData.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();

        if (error) throw error;

        setSnackbar({
          open: true,
          message: 'Yeni proje başarıyla oluşturuldu',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      fetchProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      setSnackbar({
        open: true,
        message: `Proje kaydedilirken hata oluştu: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve projeye ait tüm veriler silinecektir!')) {
      return;
    }

    try {
      // İlgili kayıtları silme sırası:
      // 1. Stok hareketleri
      const { error: moveError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('project_id', projectId);
      
      if (moveError) throw moveError;
      
      // 2. Ürünler
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('project_id', projectId);
      
      if (productError) throw productError;
      
      // 3. Kategoriler
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .eq('project_id', projectId);
      
      if (categoryError) throw categoryError;
      
      // 4. Son olarak projeyi sil
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: 'Proje başarıyla silindi',
        severity: 'success'
      });
      
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setSnackbar({
        open: true,
        message: `Proje silinirken hata oluştu: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Projelerim
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni Proje
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Henüz hiç projeniz yok
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              "Yeni Proje" butonuna tıklayarak ilk projenizi oluşturun.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom noWrap>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}>
                      {project.description || 'Açıklama yok'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Oluşturulma: {formatDate(project.created_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Son güncelleme: {formatDate(project.updated_at)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenDialog(project)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => handleOpenProject(project.id)}
                    >
                      Aç
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Proje Ekleme/Düzenleme Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Proje Adı"
            fullWidth
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Açıklama"
            fullWidth
            multiline
            rows={4}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSaveProject} color="primary" variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProjectSelection; 