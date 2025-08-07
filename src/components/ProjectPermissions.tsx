import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

interface ProjectPermissionsProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

interface UserPermission {
  permission_id: number;
  user_id: string;
  user_email: string;
  permission_level: string;
  granted_by_email: string;
  created_at: string;
}

const ProjectPermissions = ({ open, onClose, projectId, projectName }: ProjectPermissionsProps) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newPermissionLevel, setNewPermissionLevel] = useState('viewer');
  const [addingUser, setAddingUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Mevcut kullanıcı bilgilerini al
  useEffect(() => {
    const getUserInfo = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getUserInfo();
  }, []);

  // Proje izinlerini getir
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Proje izinleri getiriliyor. Proje ID: ${projectId}`);

      // project_users_view'den izinleri getir
      const { data, error } = await supabase
        .from('project_users_view')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      console.log('Alınan izin kayıtları:', data);
      setPermissions(data || []);
    } catch (err: any) {
      console.error('İzinler yüklenirken hata:', err);
      setError('İzinler yüklenirken bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open && projectId) {
      fetchPermissions();
    }
  }, [open, projectId, fetchPermissions]);

  const handleAddUser = async () => {
    if (!newUserEmail || !newPermissionLevel) {
      setError('E-posta adresi ve izin seviyesi gereklidir');
      return;
    }

    try {
      setAddingUser(true);
      setError(null);
      setSuccess(null);

      // Supabase fonksiyonunu çağır
      const { error } = await supabase.rpc('grant_project_permission', {
        p_project_id: projectId,
        p_user_email: newUserEmail,
        p_permission_level: newPermissionLevel
      });

      if (error) throw error;

      // Başarılı mesajı göster
      setSuccess(`${newUserEmail} kullanıcısına ${newPermissionLevel} izni verildi`);
      setNewUserEmail('');
      
      // İzinleri yenile
      fetchPermissions();
    } catch (err: any) {
      console.error('Kullanıcı eklenirken hata:', err);
      setError('Kullanıcı eklenirken bir hata oluştu: ' + err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemovePermission = async (permissionId: number) => {
    setConfirmDelete(permissionId);
  };
  
  const confirmRemovePermission = async () => {
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Supabase fonksiyonunu çağır
      const { error } = await supabase.rpc('revoke_project_permission', {
        p_permission_id: confirmDelete
      });

      if (error) throw error;

      // Başarılı mesajı göster
      setSuccess('Kullanıcı izni başarıyla kaldırıldı');
      
      // İzinleri yenile
      fetchPermissions();
    } catch (err: any) {
      console.error('İzin kaldırılırken hata:', err);
      setError('İzin kaldırılırken bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };
  
  const cancelRemovePermission = () => {
    setConfirmDelete(null);
  };

  // Kullanıcının proje sahibi olup olmadığını kontrol et
  const isOwner = permissions.some(p => 
    p.user_id === currentUserId && p.permission_level === 'owner'
  );

  // Get user email for the confirmation dialog
  const getUserEmailToRemove = () => {
    if (!confirmDelete) return '';
    const permission = permissions.find(p => p.permission_id === confirmDelete);
    return permission ? permission.user_email : '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Proje İzinleri: {projectName}</Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Proje ID: {projectId} | Kullanıcı ID: {currentUserId}
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Yetkili Kullanıcılar
            </Typography>
            
            {permissions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>Bu proje için henüz izin verilmiş kullanıcı yok.</Alert>
            ) : (
              <List sx={{ mb: 3 }}>
                {permissions.map((perm) => (
                  <ListItem key={perm.permission_id} divider>
                    <ListItemText
                      primary={perm.user_email}
                      secondary={
                        <>
                          <Chip 
                            label={perm.permission_level === 'owner' ? 'Sahip' : 
                                  perm.permission_level === 'editor' ? 'Düzenleyici' : 'Görüntüleyici'} 
                            size="small" 
                            color={perm.permission_level === 'owner' ? 'primary' : 
                                  perm.permission_level === 'editor' ? 'secondary' : 'default'}
                            sx={{ mr: 1 }}
                          />
                          {perm.granted_by_email && perm.granted_by_email !== perm.user_email && 
                            `İzin veren: ${perm.granted_by_email}`}
                        </>
                      }
                    />
                    {/* Sahibi değilse ve kullanıcı sahibi ise silme butonu göster */}
                    {isOwner && perm.permission_level !== 'owner' && perm.user_id !== currentUserId && (
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleRemovePermission(perm.permission_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
            
            {/* Kullanıcı Ekleme Formu - sadece sahip ise göster */}
            {isOwner && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Kullanıcı Ekle
                </Typography>
                
                <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                  <TextField
                    label="E-posta Adresi"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    disabled={addingUser}
                  />
                  
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="permission-level-label">İzin Seviyesi</InputLabel>
                    <Select
                      labelId="permission-level-label"
                      value={newPermissionLevel}
                      onChange={(e) => setNewPermissionLevel(e.target.value)}
                      label="İzin Seviyesi"
                      disabled={addingUser}
                    >
                      <MenuItem value="owner">Sahip</MenuItem>
                      <MenuItem value="editor">Düzenleyici</MenuItem>
                      <MenuItem value="viewer">Görüntüleyici</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddUser}
                    disabled={addingUser || !newUserEmail}
                    startIcon={<PersonAddIcon />}
                  >
                    {addingUser ? 'Ekleniyor...' : 'Ekle'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Kapat
        </Button>
      </DialogActions>
      
      {/* Silme Onayı Dialog */}
      <Dialog open={confirmDelete !== null} onClose={cancelRemovePermission}>
        <DialogTitle>İzin Kaldırma Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            {getUserEmailToRemove()} kullanıcısının bu projeye erişim iznini kaldırmak istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRemovePermission} color="primary">
            İptal
          </Button>
          <Button onClick={confirmRemovePermission} color="error">
            İzni Kaldır
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ProjectPermissions; 