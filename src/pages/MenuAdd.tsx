import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  TextField as MuiTextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Recipe, Menu } from '../types/database';
import { alpha } from '@mui/material/styles';
import { logger } from '../utils/logger';
// import { enqueueSnackbar } from 'notistack';

// Extend the Menu interface to include price_per_person
interface ExtendedMenu extends Omit<Menu, 'menu_items'> {
  price_per_person: number;
  menu_items?: any[]; // Use proper type here if needed
  guest_count: number; // Add guest_count to track number of people
}

const MenuAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Array<Recipe & { selected: boolean; quantity: number }>>([]);
  const [recipeSelectValue, setRecipeSelectValue] = useState<number | ''>('');
  const [menuFormData, setMenuFormData] = useState<Partial<ExtendedMenu>>({
    name: '',
    description: '',
    price_per_person: 0,
    date: new Date().toISOString().split('T')[0], // Bugünün tarihi (YYYY-MM-DD)
    guest_count: 1, // Default to 1 guest
  });
  
  // URL'den edit parametresini al
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  const editMenuId = searchParams.get('edit') ? parseInt(searchParams.get('edit') as string) : null;
  const isEditMode = !!editMenuId;
  
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Calculate total cost based on selected recipes and their quantities
  const calculateTotalCost = useCallback(() => {
    const selectedRecipesList = selectedRecipes.filter(recipe => recipe.selected);
    
    if (selectedRecipesList.length === 0) {
      setMenuFormData(prev => ({
        ...prev,
        price_per_person: 0,
      }));
      return;
    }

    // Calculate cost using individual recipe quantities
    let cost = 0;
    selectedRecipesList.forEach(recipe => {
      const recipeCost = (recipe.cost_per_serving || 0) * recipe.quantity;
      cost += recipeCost;
    });

    setMenuFormData(prev => ({
      ...prev,
      price_per_person: parseFloat(cost.toFixed(2)),
    }));
  }, [selectedRecipes]);

  useEffect(() => {
    // Selected recipes değiştiğinde toplam maliyeti hesapla
    calculateTotalCost();
  }, [selectedRecipes, calculateTotalCost]);

  useEffect(() => {
    // Load current project ID when component mounts
    const projectId = localStorage.getItem('currentProjectId');
    if (projectId) {
      setCurrentProjectId(parseInt(projectId, 10));
    }
  }, []);
  
  // Düzenleme modu için menü bilgilerini yükle
  useEffect(() => {
    if (isEditMode && editMenuId) {
      fetchMenu(editMenuId);
    }
  }, [isEditMode, editMenuId]);
  
  // Menü bilgilerini getir
  const fetchMenu = async (menuId: number) => {
    try {
      setLoading(true);
      
      // Menü bilgilerini getir
      const { data: menuData, error: menuError } = await supabase
        .from('menus')
        .select('*')
        .eq('id', menuId)
        .single();
      
      if (menuError) throw menuError;
      
      if (!menuData) {
        setAlert({
          show: true,
          message: 'Menü bulunamadı',
          type: 'error',
        });
        return;
      }
      
      // Form verilerini güncelle
      setMenuFormData({
        name: menuData.name,
        description: menuData.description || '',
        price_per_person: menuData.price_per_person || 0,
        date: menuData.date ? new Date(menuData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        guest_count: menuData.guest_count || 1,
      });
      
      // Menüye ait tarifleri getir
      const { data: menuRecipesData, error: menuRecipesError } = await supabase
        .from('menu_recipes')
        .select('recipe_id, quantity')
        .eq('menu_id', menuId);
      
      if (menuRecipesError) throw menuRecipesError;
      
      if (menuRecipesData && menuRecipesData.length > 0) {
        // Tarif ID'lerini al
        const recipeIds = menuRecipesData.map(item => item.recipe_id);
        
        // İlgili tarif bilgilerini getir
        const { data: menuRecipes, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .in('id', recipeIds);
        
        if (recipesError) throw recipesError;
        
        if (menuRecipes) {
          // Seçili tarifleri güncelle
          setSelectedRecipes(prevRecipes => {
            return prevRecipes.map(recipe => {
              // Bu tarif menüde var mı kontrol et
              const menuRecipe = menuRecipesData.find(mr => mr.recipe_id === recipe.id);
              if (menuRecipe) {
                return { 
                  ...recipe, 
                  selected: true,
                  quantity: menuRecipe.quantity || 1
                };
              }
              return recipe;
            });
          });
        }
      }
    } catch (error: any) {
      logger.error('Menü bilgileri alınırken hata:', error);
      setAlert({
        show: true,
        message: `Menü bilgileri yüklenirken hata oluştu: ${error.message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      // Get current project ID directly from localStorage
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        setAlert({
          show: true,
          message: 'Proje bulunamadı',
          type: 'error',
        });
        return;
      }
      
      logger.log('Fetching recipes for project ID:', projectId);
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('project_id', projectId)
        .order('name');
      
      if (error) throw error;
      
      logger.log('Fetched recipes:', data?.length || 0);
      
      // Transform regular recipes to SelectedRecipe type with selected=false
      const recipesWithSelection = data?.map(recipe => ({
        ...recipe,
        selected: false,
        quantity: 1 // Default quantity is 1
      })) || [];

      setRecipes(data || []);
      setSelectedRecipes(recipesWithSelection);
    } catch (error: any) {
      logger.error('Tarifler alınırken hata:', error);
      setAlert({
        show: true,
        message: `Tarifler yüklenirken hata oluştu: ${error.message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price_per_person') {
      // Sadece sayısal değerler için
      setMenuFormData({
        ...menuFormData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setMenuFormData({
        ...menuFormData,
        [name]: value,
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Tarihi değiştir ve tarihten oluşan bir isim oluştur
    const formattedDate = new Date(value).toLocaleDateString('tr-TR');
    const newName = `${formattedDate} Tarihli Menü`;
    
    setMenuFormData({
      ...menuFormData,
      date: value,
      name: newName
    });
    
    logger.log('Menü adı otomatik oluşturuldu:', newName);
  };

  const handleRecipeSelectChange = (e: SelectChangeEvent<number | string>) => {
    setRecipeSelectValue(e.target.value as number | '');
  };

  const handleSelectRecipeChange = useCallback((recipeId: number, isSelected: boolean) => {
    setSelectedRecipes(prevSelectedRecipes => {
      return prevSelectedRecipes.map(recipe => {
        if (recipe.id === recipeId) {
          return { ...recipe, selected: isSelected, quantity: isSelected ? 1 : 0 };
        }
        return recipe;
      });
    });
  }, []);

  const handleQuantityChange = useCallback((recipeId: number, quantity: number) => {
    setSelectedRecipes(prevSelectedRecipes => {
      return prevSelectedRecipes.map(recipe => {
        if (recipe.id === recipeId) {
          return { ...recipe, quantity: quantity < 1 ? 1 : quantity };
        }
        return recipe;
      });
    });
  }, []);



  const handleSaveMenu = async () => {
    setSaving(true);
    
    try {
      // Eğer isim boş ise ve tarih seçilmişse, tarihe göre otomatik isim oluştur
      let menuName = menuFormData.name;
      if ((!menuName || menuName.trim() === '') && menuFormData.date) {
        const formattedDate = new Date(menuFormData.date).toLocaleDateString('tr-TR');
        menuName = `${formattedDate} Tarihli Menü`;
        setMenuFormData({
          ...menuFormData,
          name: menuName
        });
      }
      
      // Validate menu name
      if (!menuName || menuName.trim() === '') {
        setAlert({
          show: true,
          message: 'Menü adı girilmelidir',
          type: 'error',
        });
        setSaving(false);
        return;
      }
      
      // Validate if any recipes are selected
      const selectedRecipesData = selectedRecipes.filter(r => r.selected);
      if (selectedRecipesData.length === 0) {
        setAlert({
          show: true,
          message: 'En az bir tarif seçilmelidir',
          type: 'error',
        });
        setSaving(false);
        return;
      }
      
      // Mevcut kullanıcının ID'sini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAlert({
          show: true,
          message: 'Oturum bilgisi alınamadı',
          type: 'error',
        });
        setSaving(false);
        return;
      }
      
      let menuId: number;
      
      // Düzenleme modu kontrolü
      if (isEditMode && editMenuId) {
        // Mevcut menüyü güncelle
        const { data: updatedMenu, error: updateError } = await supabase
          .from('menus')
          .update({
            name: menuName,
            description: menuFormData.description || '',
            price_per_person: menuFormData.price_per_person || 0,
            guest_count: menuFormData.guest_count || 1,
            date: menuFormData.date
          })
          .eq('id', editMenuId)
          .select('id')
          .single();
          
        if (updateError) {
          logger.error('Error updating menu:', updateError);
          setAlert({
            show: true,
            message: 'Menü güncellenirken bir hata oluştu',
            type: 'error',
          });
          setSaving(false);
          return;
        }
        
        menuId = editMenuId;
        
        // Önce mevcut menu_recipes kayıtlarını sil
        const { error: deleteError } = await supabase
          .from('menu_recipes')
          .delete()
          .eq('menu_id', menuId);
          
        if (deleteError) {
          logger.error('Error deleting menu recipes:', deleteError);
          setAlert({
            show: true,
            message: 'Menü tarifleri güncellenirken bir hata oluştu',
            type: 'error',
          });
          setSaving(false);
          return;
        }
      } else {
        // Yeni menü ekle
        const { data: newMenu, error: menuError } = await supabase
          .from('menus')
          .insert([
            {
              name: menuName,
              description: menuFormData.description || '',
              price_per_person: menuFormData.price_per_person || 0,
              project_id: currentProjectId,
              user_id: user.id, // Kullanıcı ID'sini ekle
              guest_count: menuFormData.guest_count || 1,
              date: menuFormData.date
            }
          ])
          .select('id')
          .single();
          
        if (menuError) {
          logger.error('Error inserting menu:', menuError);
          setAlert({
            show: true,
            message: 'Menü kaydedilirken bir hata oluştu',
            type: 'error',
          });
          setSaving(false);
          return;
        }
        
        menuId = newMenu.id;
      }
      
      // Menü tarifleri için veriyi hazırla
      const menuRecipesData = selectedRecipesData.map(recipe => ({
        menu_id: menuId,
        recipe_id: recipe.id,
        quantity: recipe.quantity
      }));
      
      // menu_recipes tablosuna ekle
      const { error: menuRecipesError } = await supabase
        .from('menu_recipes')
        .insert(menuRecipesData);
        
      if (menuRecipesError) {
        logger.error('Error inserting menu recipes:', menuRecipesError);
        setAlert({
          show: true,
          message: 'Menü tarifleri kaydedilirken bir hata oluştu',
          type: 'error',
        });
        setSaving(false);
        return;
      }
      
      setAlert({
        show: true,
        message: isEditMode ? 'Menü başarıyla güncellendi' : 'Menü başarıyla kaydedildi',
        type: 'success',
      });
      navigate('/menus');
    } catch (error) {
      logger.error('Error saving menu:', error instanceof Error ? error.message : String(error));
      setAlert({
        show: true,
        message: 'Menü kaydedilirken bir hata oluştu',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };
  
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'starter': return '#e3f2fd'; // Açık mavi
      case 'main': return '#ffebee';    // Açık kırmızı
      case 'dessert': return '#fff8e1'; // Açık sarı
      case 'beverage': return '#e8f5e9'; // Açık yeşil
      case 'side': return '#f3e5f5';    // Açık mor
      default: return '#f5f5f5';        // Açık gri
    }
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'starter': return 'Başlangıç';
      case 'main': return 'Ana Yemek';
      case 'dessert': return 'Tatlı';
      case 'beverage': return 'İçecek';
      case 'side': return 'Yan Yemek';
      default: return category;
    }
  };
  
  // Add a handler for guest count changes
  const handleGuestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 1;
    setMenuFormData({
      ...menuFormData,
      guest_count: count < 1 ? 1 : count
    });
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Menü Düzenle' : 'Yeni Menü Oluştur'}
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/menus')}
          >
            Menülere Dön
          </Button>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Menü Bilgileri
                  </Typography>
                  
                  <Box component="form" noValidate autoComplete="off">
                    <TextField
                      fullWidth
                      required
                      label="Tarih"
                      name="date"
                      type="date"
                      value={menuFormData.date}
                      onChange={handleDateChange}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      helperText="Menünün uygulanacağı tarihi seçin"
                    />
                    
                    <TextField
                      fullWidth
                      label="Açıklama"
                      name="description"
                      value={menuFormData.description}
                      onChange={handleInputChange}
                      margin="normal"
                      variant="outlined"
                      multiline
                      rows={4}
                    />
                    
                    <TextField
                      fullWidth
                      disabled
                      label="Kişi Başı Fiyat"
                      name="price_per_person"
                      value={menuFormData.price_per_person}
                      margin="normal"
                      variant="outlined"
                      helperText="Bu değer eklenen tariflere göre otomatik hesaplanır"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₺</InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      required
                      label="Misafir Sayısı"
                      name="guest_count"
                      type="number"
                      value={menuFormData.guest_count}
                      onChange={handleGuestCountChange}
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                      helperText="Menünün kaç kişi için hazırlanacağını belirtin"
                    />
                    
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tarifler ekledikçe, kişi başı fiyat otomatik olarak hesaplanacaktır.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Menü Tarifleri
                  </Typography>
                  
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <FormControl fullWidth sx={{ mr: 1 }}>
                      <InputLabel id="recipe-select-label">Tarif Seç</InputLabel>
                      <Select
                        labelId="recipe-select-label"
                        value={recipeSelectValue}
                        onChange={handleRecipeSelectChange}
                        label="Tarif Seç"
                      >
                        <MenuItem value="">
                          <em>Tarif seçiniz</em>
                        </MenuItem>
                        {recipes.map((recipe) => (
                          <MenuItem key={recipe.id} value={recipe.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1">{recipe.name}</Typography>
                              <Chip
                                label={getCategoryLabel(recipe.category)}
                                size="small"
                                sx={{ ml: 1, bgcolor: getCategoryColor(recipe.category) }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Porsiyon başı maliyet: {formatCurrency(recipe.cost_per_serving || 0)}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        if (recipeSelectValue) {
                          handleSelectRecipeChange(Number(recipeSelectValue), true);
                          setRecipeSelectValue('');
                        }
                      }}
                      startIcon={<AddIcon />}
                    >
                      Ekle
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {selectedRecipes.length === 0 ? (
                    <Alert severity="info">
                      Henüz menüye tarif eklenmedi. Lütfen en az bir tarif ekleyin.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell>Tarif Adı</TableCell>
                            <TableCell>Kategori</TableCell>
                            <TableCell align="right">Porsiyon</TableCell>
                            <TableCell align="right">Maliyet</TableCell>
                            <TableCell align="center">Miktar</TableCell>
                            <TableCell align="right">Toplam</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedRecipes.map((recipe) => {
                            const isSelected = recipe.selected;
                            const recipeCost = (recipe.cost_per_serving || 0) * recipe.quantity;
                            
                            return (
                              <TableRow
                                key={recipe.id}
                                hover
                                selected={isSelected}
                                sx={{ 
                                  '&.Mui-selected': { 
                                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) 
                                  } 
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={(e) => handleSelectRecipeChange(recipe.id, e.target.checked)}
                                  />
                                </TableCell>
                                <TableCell>{recipe.name}</TableCell>
                                <TableCell>{recipe.category}</TableCell>
                                <TableCell align="right">{recipe.serving_size}</TableCell>
                                <TableCell align="right">{formatCurrency(recipe.cost_per_serving || 0)}</TableCell>
                                <TableCell align="center">
                                  <MuiTextField
                                    type="number"
                                    value={recipe.quantity}
                                    onChange={(e) => handleQuantityChange(recipe.id, parseInt(e.target.value))}
                                    disabled={!isSelected}
                                    inputProps={{ 
                                      min: 1,
                                      style: { textAlign: 'center' }
                                    }}
                                    size="small"
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {isSelected ? formatCurrency(recipeCost) : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid rgba(0,0,0,0.1)' } }}>
                            <TableCell colSpan={5} align="right">
                              Toplam Maliyet:
                            </TableCell>
                            <TableCell align="center">
                              {selectedRecipes.filter(r => r.selected).length} tarif
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(menuFormData.price_per_person || 0)}
                            </TableCell>
                          </TableRow>
                          <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                            <TableCell colSpan={5} align="right">
                              Kişi Başı Maliyet:
                            </TableCell>
                            <TableCell align="center">
                              {menuFormData.guest_count} kişi
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(menuFormData.price_per_person || 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveMenu}
                  disabled={saving || !menuFormData.date || selectedRecipes.length === 0}
                >
                  {saving ? <CircularProgress size={24} /> : (isEditMode ? 'Menüyü Güncelle' : 'Menüyü Kaydet')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>
      
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

export default MenuAdd; 