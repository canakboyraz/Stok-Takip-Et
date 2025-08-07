import React, { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Alert,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  ExitToApp as LogoutIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Project } from '../types/database';
import ProjectPermissions from '../components/ProjectPermissions';

const ProjectSelection = () => {
  console.log('[ProjectSelection] Bileşen yükleniyor...');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [userEmail, setUserEmail] = useState<string>('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'warning' | 'info' | 'success'
  });
  const navigate = useNavigate();

  // Proje izinleri için yeni durum değişkenleri
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sharedProjects, setSharedProjects] = useState<any[]>([]); // SharedProject interface removed

  // Kullanıcıyı kontrol et ve projelerini getir
  const checkUserAndFetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      
      // Kullanıcı bilgisini al
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error("Kullanıcı bilgisi alınamadı - Lütfen tekrar giriş yapın");
      }
      
      // Kullanıcı e-posta bilgisini kaydet
      setUserEmail(userData.user.email || 'E-posta bulunamadı');
      
      console.log(`Kullanıcı: ${userData.user.email} (${userData.user.id}) için projeler getiriliyor`);

      // Direkt sorgu yöntemi - UUID tip dönüşümü ile
      try {
        // 1. Kullanıcının kendi projeleri
        const { data: ownProjects, error: ownProjectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
          
        if (ownProjectsError) throw ownProjectsError;
        
        // 2. Kullanıcının izin verilmiş olduğu projeler
        const { data: sharedProjectsData, error: sharedProjectsError } = await supabase
          .from('project_users')
          .select(`
            id,
            project_id,
            permission_level,
            granted_by
          `)
          .eq('user_id', userData.user.id);
          
        if (sharedProjectsError) throw sharedProjectsError;
        
        // Paylaşılan projelerin detaylarını ayrı bir sorgu ile al
        const projectIds = sharedProjectsData?.map(item => item.project_id) || [];
        
        // Eğer izin verilen projeler varsa detaylarını al
        let sharedProjectDetails: Project[] = [];
        if (projectIds.length > 0) {
          const { data: projectDetails, error: projectDetailsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds);
            
          if (projectDetailsError) throw projectDetailsError;
          sharedProjectDetails = projectDetails || [];
        }
        
        console.log('Direkt sorgu başarılı - Kendi projeleri:', ownProjects);
        console.log('Direkt sorgu başarılı - Paylaşılan projeler:', sharedProjectsData);
        console.log('Direkt sorgu başarılı - Paylaşılan proje detayları:', sharedProjectDetails);
        
        // Kendi projelerini ayarla
        setProjects(ownProjects || []);
        
        // Paylaşılan projeleri formatlayıp ayarla
        const formattedSharedProjects = sharedProjectsData?.map(item => {
          // Bu proje için detayları bul
          const projectDetail = sharedProjectDetails.find(p => p.id === item.project_id);
          return {
            permission_id: item.id,
            project_id: item.project_id,
            project_name: projectDetail?.name || 'İsimsiz Proje',
            permission_level: item.permission_level,
            granted_by_email: null // Bu bilgi şu an için mevcut değil
          };
        }) || [];
        
        console.log('Formatlanmış paylaşılan projeler:', formattedSharedProjects);
        setSharedProjects(formattedSharedProjects);
      } catch (error: any) {
        console.error('Projeler yüklenirken hata:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setSnackbar({
        open: true,
        message: `Projeler yüklenirken hata oluştu: ${error.message}`,
        severity: 'error'
      });
      
      // Kullanıcı doğrulama hatası varsa giriş sayfasına yönlendir
      if (error.message?.includes('JWT expired') || error.message?.includes('not authenticated')) {
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    console.log('[ProjectSelection] useEffect tetiklendi, projeler getiriliyor...');
    checkUserAndFetchProjects();
  }, [checkUserAndFetchProjects]);

  const handleOpenProject = (projectId: number) => {
    try {
      console.log(`[ProjectSelection] Proje seçildi, ID: ${projectId}`);
      
      // Projenin mevcut kullanıcı için erişilebilir olduğunu kontrol et
      const isOwnProject = projects.some(p => p.id === projectId);
      const isSharedProject = sharedProjects.some(p => p.project_id === projectId);
      
      if (!isOwnProject && !isSharedProject) {
        console.error(`[ProjectSelection] Proje erişim hatası: ID ${projectId} için yetki yok`);
        throw new Error('Bu projeye erişim yetkiniz yok!');
      }
      
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('currentProjectId');
      navigate('/');
    } catch (error: any) {
      console.error('Çıkış hatası:', error);
      setSnackbar({
        open: true,
        message: `Çıkış yapılırken hata oluştu: ${error.message}`,
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
        const { error } = await supabase
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
      checkUserAndFetchProjects();
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
      setLoading(true);
      // İlişkili verileri silme sırası çok önemli
      console.log(`Proje ID: ${projectId} siliniyor, ilişkili tüm veriler temizleniyor...`);
      
      // 1. Menü tarifleri - menüler silinmeden önce bunlar silinmeli
      const { error: menuRecipesError } = await supabase
        .from('menu_recipes')
        .delete()
        .eq('menu_id', projectId);
      
      if (menuRecipesError) {
        console.error("Menü tarifleri silinemedi:", menuRecipesError);
      }
      
      // 2. Menüler
      const { error: menuError } = await supabase
        .from('menus')
        .delete()
        .eq('project_id', projectId);
      
      if (menuError) {
        console.error("Menüler silinemedi:", menuError);
      }
      
      // 3. Tarif malzemeleri - tarifler silinmeden önce bunlar silinmeli
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id')
        .eq('project_id', projectId);
        
      if (recipes && recipes.length > 0) {
        const recipeIds = recipes.map(r => r.id);
        
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .in('recipe_id', recipeIds);
          
        if (ingredientsError) {
          console.error("Tarif malzemeleri silinemedi:", ingredientsError);
          throw ingredientsError;
        }
      }

      // 4. Tarifler
      const { error: recipesError } = await supabase
        .from('recipes')
        .delete()
        .eq('project_id', projectId);
      
      if (recipesError) {
        console.error("Tarifler silinemedi:", recipesError);
        throw recipesError;
      }
      
      // 5. Stok hareketleri
      const { error: moveError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('project_id', projectId);
      
      if (moveError) {
        console.error("Stok hareketleri silinemedi:", moveError);
        throw moveError;
      }
      
      // 6. Personel
      const { error: personnelError } = await supabase
        .from('personnel')
        .delete()
        .eq('project_id', projectId);
        
      if (personnelError) {
        console.error("Personel kayıtları silinemedi:", personnelError);
      }
      
      // 7. Ürünler
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('project_id', projectId);
      
      if (productError) {
        console.error("Ürünler silinemedi:", productError);
        throw productError;
      }
      
      // 8. Kategoriler
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .eq('project_id', projectId);
      
      if (categoryError) {
        console.error("Kategoriler silinemedi:", categoryError);
        throw categoryError;
      }
      
      // 9. Proje izinleri
      const { error: permissionsError } = await supabase
        .from('project_users')
        .delete()
        .eq('project_id', projectId);
        
      if (permissionsError) {
        console.error("Proje izinleri silinemedi:", permissionsError);
      }
      
      // 10. Son olarak projeyi sil
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error("Proje silinemedi:", error);
        throw error;
      }

      setSnackbar({
        open: true,
        message: 'Proje başarıyla silindi',
        severity: 'success'
      });
      
      checkUserAndFetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setSnackbar({
        open: true,
        message: `Proje silinirken hata oluştu: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
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

  // Proje izinleri dialog'unu açma işlevi
  const handleOpenPermissions = (project: Project) => {
    setSelectedProject(project);
    setPermissionsOpen(true);
  };

  // Proje izinleri dialog'unu kapatma işlevi 
  const handleClosePermissions = () => {
    setPermissionsOpen(false);
    setSelectedProject(null);
    // İzinler değişmiş olabileceği için projeleri tekrar yükle
    checkUserAndFetchProjects();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Debug işlemi burada yapılıyor */}
      <Paper elevation={3} sx={{ mt: 4, mb: 2, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Hoş Geldiniz</Typography>
              <Box display="flex" alignItems="center">
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {userEmail}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Projeler</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni Proje
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Henüz bir projeniz bulunmuyor. Yeni bir proje oluşturabilirsiniz.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Proje Oluştur
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {project.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description || 'Açıklama yok'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, fontSize: 'small', color: 'primary.main' }} />
                    <Typography variant="caption">
                      Sahip: Siz
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Oluşturulma: {formatDate(project.created_at)}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                  <Box>
                    <Button 
                      size="small" 
                      onClick={() => handleOpenDialog(project)}
                      startIcon={<EditIcon />}
                    >
                      Düzenle
                    </Button>
                    <Button 
                      size="small" 
                      color="secondary"
                      onClick={() => handleOpenPermissions(project)}
                      startIcon={<PersonAddIcon />}
                    >
                      İzinler
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteProject(project.id)}
                      startIcon={<DeleteIcon />}
                    >
                      Sil
                    </Button>
                  </Box>
                  <Box>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => handleOpenProject(project.id)}
                    >
                      Aç
                    </Button>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Paylaşılmış projeler bölümü */}
      {sharedProjects.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Sizinle Paylaşılan Projeler
          </Typography>
          
          <Grid container spacing={3}>
            {sharedProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.permission_id}>
                <Card 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    borderLeft: '4px solid',
                    borderLeftColor: project.permission_level === 'owner' ? 'primary.main' : 
                                    project.permission_level === 'editor' ? 'secondary.main' : 'info.main'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                      {project.project_name}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={project.permission_level === 'owner' ? 'Sahip' : 
                              project.permission_level === 'editor' ? 'Düzenleyici' : 'Görüntüleyici'} 
                        size="small" 
                        color={project.permission_level === 'owner' ? 'primary' : 
                              project.permission_level === 'editor' ? 'secondary' : 'default'}
                      />
                    </Box>
                    
                    {project.granted_by_email && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, fontSize: 'small', color: 'primary.main' }} />
                        <Typography variant="caption">
                          İzin veren: {project.granted_by_email}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => handleOpenProject(project.project_id)}
                    >
                      Aç
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Yeni ve düzenleme modalı */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Proje Adı"
            fullWidth
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <TextField
            margin="dense"
            id="description"
            label="Açıklama (İsteğe bağlı)"
            fullWidth
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSaveProject} variant="contained" color="primary">
            {editingProject ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proje izinleri modalı */}
      {selectedProject && (
        <ProjectPermissions
          open={permissionsOpen}
          onClose={handleClosePermissions}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProjectSelection; 