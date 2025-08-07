import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  RestaurantMenu as RestaurantMenuIcon,
  ArrowForward as ArrowForwardIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Menu, Recipe } from '../types/database';

interface MenuWithRecipeCount extends Menu {
  recipe_count?: number;
}

// Malzeme bilgilerini içeren bir interface oluştur (RecipeIngredient'a benzer)
interface DetailedIngredient {
  product_id: number;
  quantity: number;
  unit: string;
  product_name: string;
  product_price: number;
}

// Recipe alanlarını koruyarak ingredients'ı kendi versiyonumuz ile özelleştir
interface DetailedRecipe extends Omit<Recipe, 'ingredients'> {
  ingredients?: DetailedIngredient[];
  // Menü içindeki tarif için miktar - yeni eklendi
  quantity?: number;
  menu_recipe_id?: number; // menu_recipes tablosundaki id
}

interface ProductNeed {
  product_id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total_price: number;
  categories?: { name: string };
}

const Menus = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuWithRecipeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Menü detayları için state'ler
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuWithRecipeCount | null>(null);
  const [menuRecipes, setMenuRecipes] = useState<DetailedRecipe[]>([]);
  const [guestCount, setGuestCount] = useState<number>(10); // Genel kişi sayısı (Default)
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [productNeeds, setProductNeeds] = useState<ProductNeed[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  // Miktar değişikliklerini kaydetme
  const [quantitySaving, setQuantitySaving] = useState(false);
  
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
    fetchMenus();
  }, []);
  
  const calculateProductNeeds = useCallback(() => {
    // Tüm malzemeleri birleştir
    const allProducts: ProductNeed[] = [];
    
    menuRecipes.forEach(recipe => {
      if (!recipe.ingredients) return;
      
      // Tarifin menüdeki miktarını kullan
      const recipeQuantity = recipe.quantity || 1;
      
      recipe.ingredients.forEach(ingredient => {
        // Her tarif için kendi miktarını ve porsiyon sayısını kullan
        const neededQuantity = ingredient.quantity * recipeQuantity / (recipe.serving_size || 1);
        
        // Ürün zaten listeye eklenmişse miktarını güncelle
        const existingProduct = allProducts.find(p => p.product_id === ingredient.product_id);
        
        if (existingProduct) {
          existingProduct.quantity += neededQuantity;
          existingProduct.total_price = existingProduct.quantity * existingProduct.price;
        } else {
          // Yeni ürün ekle
          allProducts.push({
            product_id: ingredient.product_id,
            name: ingredient.product_name,
            quantity: neededQuantity,
            unit: ingredient.unit,
            price: ingredient.product_price,
            total_price: neededQuantity * ingredient.product_price
          });
        }
      });
    });
    
    // Toplam maliyeti hesapla
    const menuTotalCost = allProducts.reduce((sum, item) => sum + item.total_price, 0);
    
    setProductNeeds(allProducts);
    setTotalCost(menuTotalCost);
  }, [menuRecipes]);

  useEffect(() => {
    if (menuRecipes.length > 0) {
      calculateProductNeeds();
    }
  }, [menuRecipes, calculateProductNeeds]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      // Önce menüleri al
      const { data: menusData, error: menusError } = await supabase
        .from('menus')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('name');
      
      if (menusError) throw menusError;
      
      if (!menusData || menusData.length === 0) {
        setMenus([]);
        setLoading(false);
        return;
      }
      
      // Her menü için tarif sayısını alarak menü verilerini zenginleştir
      const menusWithRecipeCounts = await Promise.all(menusData.map(async (menu) => {
        const { count, error: countError } = await supabase
          .from('menu_recipes')
          .select('id', { count: 'exact', head: true })
          .eq('menu_id', menu.id);
          
        if (countError) {
          console.error(`Menü ${menu.id} için tarif sayısı alınırken hata:`, countError);
          return { ...menu, recipe_count: 0 };
        }
        
        return { ...menu, recipe_count: count || 0 };
      }));
      
      setMenus(menusWithRecipeCounts);
    } catch (error: any) {
      console.error('Menüler alınırken hata:', error);
      setError(`Menüler yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMenuDetails = async (menuId: number) => {
    try {
      setDetailsLoading(true);
      
      // Menüye ait tarifleri ve miktarlarını al
      const { data: menuRecipesData, error: menuRecipesError } = await supabase
        .from('menu_recipes')
        .select(`
          id,
          recipe_id,
          quantity
        `)
        .eq('menu_id', menuId);
      
      if (menuRecipesError) throw menuRecipesError;
      
      if (!menuRecipesData || menuRecipesData.length === 0) {
        setMenuRecipes([]);
        setDetailsLoading(false);
        return;
      }
      
      const recipeIds = menuRecipesData.map(item => item.recipe_id);
      
      // Tariflerin detaylarını al
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *
        `)
        .in('id', recipeIds);
      
      if (recipesError) throw recipesError;
      
      if (!recipesData) {
        setMenuRecipes([]);
        setDetailsLoading(false);
        return;
      }
      
      // Her tarif için malzeme bilgilerini al
      const recipesWithIngredients = await Promise.all(recipesData.map(async (recipe) => {
        // Tarifin menüdeki miktarını bul
        const menuRecipe = menuRecipesData.find(mr => mr.recipe_id === recipe.id);
        const quantity = menuRecipe?.quantity || 1; // Varsayılan miktar 1
        const menu_recipe_id = menuRecipe?.id;
        
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .select(`
            id,
            recipe_id,
            product_id,
            quantity,
            unit,
            products:products (
              id,
              name,
              price
            )
          `)
          .eq('recipe_id', recipe.id);
        
        if (ingredientsError) {
          console.error(`Tarif ${recipe.id} için malzemeler alınırken hata:`, ingredientsError);
          return { ...recipe, quantity, menu_recipe_id } as DetailedRecipe;
        }
        
        return {
          ...recipe,
          quantity,
          menu_recipe_id,
          ingredients: ingredients?.map(item => {
            // TypeScript'in ürün bilgisini doğru şekilde anlaması için 
            // önce ürün bilgisini açıkça alıyoruz
            const product = item.products as unknown as { 
              id: number; 
              name: string; 
              price: number;
            };
            
            return {
              product_id: item.product_id,
              quantity: item.quantity,
              unit: item.unit,
              product_name: product?.name || 'Bilinmeyen Ürün',
              product_price: product?.price || 0
            };
          }) || []
        } as DetailedRecipe;
      }));
      
      setMenuRecipes(recipesWithIngredients);
    } catch (error: any) {
      console.error('Menü detayları alınırken hata:', error);
      setAlert({
        show: true,
        message: `Menü detayları alınırken hata oluştu: ${error.message}`,
        type: 'error',
      });
    } finally {
      setDetailsLoading(false);
    }
  };
  
  const handleRecipeQuantityChange = (recipeId: number, value: number) => {
    // Miktar değeri 1'den küçük olmamalı
    const quantity = Math.max(1, value);
    
    setMenuRecipes(prev => 
      prev.map(recipe => 
        recipe.id === recipeId ? { ...recipe, quantity } : recipe
      )
    );
  };
  
  const saveRecipeQuantities = async () => {
    if (!selectedMenu) return;
    
    try {
      setQuantitySaving(true);
      
      // Menüdeki tarifler için güncellenmiş miktarları hazırla
      const updates = menuRecipes.map(recipe => ({
        id: recipe.menu_recipe_id,
        quantity: recipe.quantity || 1
      }));
      
      // menu_recipes tablosuna güncellemeleri gönder
      for (const update of updates) {
        const { error } = await supabase
          .from('menu_recipes')
          .update({ quantity: update.quantity })
          .eq('id', update.id);
          
        if (error) {
          console.error(`Tarif miktarı güncellenirken hata: recipe_id=${update.id}`, error);
          throw error;
        }
      }
      
      setAlert({
        show: true,
        message: 'Tarif miktarları başarıyla güncellendi',
        type: 'success',
      });
      
      // Yeniden hesapla
      calculateProductNeeds();
      
    } catch (error: any) {
      console.error('Tarif miktarları güncellenirken hata:', error);
      setAlert({
        show: true,
        message: `Tarif miktarları güncellenirken hata: ${error.message}`,
        type: 'error',
      });
    } finally {
      setQuantitySaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };
  
  const formatQuantity = (quantity: number) => {
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return '#f5f5f5'; // Gri
      case 'planned': return '#e3f2fd'; // Mavi
      case 'active': return '#e8f5e9'; // Yeşil
      case 'completed': return '#fff8e1'; // Sarı
      default: return '#f5f5f5';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'draft': return 'Taslak';
      case 'planned': return 'Planlandı';
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const handleEdit = (menuId: number) => {
    // İleride düzenleme işlevselliği için
    console.log(`Menü düzenle: ${menuId}`);
    navigate(`/menu-add?edit=${menuId}`);
  };

  const handleDeleteClick = (menuId: number) => {
    setMenuToDelete(menuId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setMenuToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    setDeleteLoading(true);
    try {
      // Önce menu_recipes tablosundan ilgili verileri sil
      const { error: recipesError } = await supabase
        .from('menu_recipes')
        .delete()
        .eq('menu_id', menuToDelete);

      if (recipesError) {
        console.error('Menü tariflerini silerken hata:', recipesError);
        throw new Error(`Menü tariflerini silerken hata: ${recipesError.message}`);
      }

      // Sonra menünün kendisini sil
      const { error: menuError } = await supabase
        .from('menus')
        .delete()
        .eq('id', menuToDelete);

      if (menuError) {
        console.error('Menüyü silerken hata:', menuError);
        throw new Error(`Menüyü silerken hata: ${menuError.message}`);
      }

      // Silme işlemi başarılı
      setAlert({
        show: true,
        message: 'Menü başarıyla silindi',
        type: 'success',
      });

      // Menüleri yeniden yükle
      fetchMenus();
    } catch (error: any) {
      console.error('Menüyü silerken hata:', error);
      setAlert({
        show: true,
        message: `Menüyü silerken hata oluştu: ${error.message}`,
        type: 'error',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };
  
  const handleDetailsClick = (menu: MenuWithRecipeCount) => {
    setSelectedMenu(menu);
    setDetailsDialogOpen(true);
    fetchMenuDetails(menu.id);
  };
  
  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
    setSelectedMenu(null);
    setMenuRecipes([]);
    setProductNeeds([]);
  };
  
  const handleGuestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setGuestCount(value);
      
      // Her tarif için otomatik olarak kişi sayısını güncelle
      setMenuRecipes(prev => 
        prev.map(recipe => ({ ...recipe, quantity: value }))
      );
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Menüler
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/menu-add')}
          >
            Yeni Menü Oluştur
          </Button>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : menus.length === 0 ? (
          <Alert severity="info">
            Kayıtlı menü bulunmamaktadır. Yeni menü eklemek için "Yeni Menü Oluştur" butonunu kullanabilirsiniz.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {menus.map((menu) => (
              <Grid item xs={12} sm={6} md={4} key={menu.id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderLeft: `4px solid ${getStatusColor(menu.status)}`,
                    position: 'relative' 
                  }}
                >
                  <CardContent>
                    <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex' }}>
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => handleEdit(menu.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(menu.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <RestaurantMenuIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" noWrap>
                        {menu.name}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      label={getStatusLabel(menu.status)} 
                      size="small" 
                      sx={{ mb: 2, bgcolor: getStatusColor(menu.status) }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {menu.description || 'Açıklama yok'}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Oluşturulma Tarihi:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(menu.date)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Kişi Başı Fiyat:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(menu.price_per_person || 0)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        icon={<RestaurantMenuIcon fontSize="small" />} 
                        label={`${menu.recipe_count || 0} Tarif`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Tooltip title="Detaylar">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 'auto' }}
                          onClick={() => handleDetailsClick(menu)}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Silme onay dialogu */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Menüyü sil
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Bu menüyü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve menüye ait tüm tarifler de silinecektir.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            İptal
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteLoading}
            autoFocus
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Menü detayları dialogu */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleDetailsClose}
        maxWidth="lg"
        fullWidth
        aria-labelledby="menu-details-title"
      >
        <DialogTitle id="menu-details-title">
          <Box display="flex" alignItems="center">
            <RestaurantMenuIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              {selectedMenu?.name} - Detaylar
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Menü Bilgileri
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Tarih:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedMenu?.date ? formatDate(selectedMenu.date) : '-'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Durum:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedMenu?.status ? getStatusLabel(selectedMenu.status) : '-'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Açıklama:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedMenu?.description || 'Açıklama yok'}
                      </Typography>
                    </Box>
                    
                    <TextField
                      label="Varsayılan Kişi Sayısı"
                      type="number"
                      value={guestCount}
                      onChange={handleGuestCountChange}
                      fullWidth
                      inputProps={{ min: 1 }}
                      margin="normal"
                      helperText="Tüm tariflere otomatik uygulayacağınız kişi sayısı"
                    />
                    
                    <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                      <Typography variant="body2" color="text.secondary">
                        Kişi Başı Maliyet:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedMenu?.price_per_person || 0)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Toplam Maliyet:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(totalCost)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Tarifler ve Miktarlar
                    </Typography>
                    
                    {menuRecipes.length === 0 ? (
                      <Alert severity="info">
                        Bu menüde tarif bulunmamaktadır.
                      </Alert>
                    ) : (
                      <>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            Her tarif için üretilecek adedi aşağıda ayarlayabilirsiniz:
                          </Typography>
                          
                          <List>
                            {menuRecipes.map((recipe) => (
                              <ListItem key={recipe.id} divider sx={{ py: 2 }}>
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center">
                                      <Typography variant="body1" fontWeight="bold">
                                        {recipe.name}
                                      </Typography>
                                      <Chip 
                                        label={recipe.category} 
                                        size="small" 
                                        sx={{ ml: 1 }} 
                                      />
                                    </Box>
                                  }
                                  secondary={`Porsiyon Adedi: ${recipe.serving_size} · Porsiyon Maliyeti: ${formatCurrency(recipe.cost_per_serving || 0)}`}
                                />
                                <ListItemSecondaryAction>
                                  <TextField
                                    label="Miktar"
                                    type="number"
                                    value={recipe.quantity || 1}
                                    onChange={(e) => handleRecipeQuantityChange(recipe.id, parseInt(e.target.value))}
                                    inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                    size="small"
                                    sx={{ width: 100 }}
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                          
                          <Box display="flex" justifyContent="flex-end" mt={2}>
                            <Button 
                              variant="contained" 
                              color="primary"
                              onClick={saveRecipeQuantities}
                              disabled={quantitySaving}
                            >
                              {quantitySaving ? <CircularProgress size={24} /> : 'Miktarları Kaydet'}
                            </Button>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 3 }} />
                        
                        <Typography variant="h6" gutterBottom>
                          Malzeme İhtiyaçları
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <ShoppingCartIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Tarif miktarlarına göre gereken malzemeler:
                          </Typography>
                        </Box>
                        
                        {productNeeds.length === 0 ? (
                          <Alert severity="info">
                            Bu menüde tarif veya malzeme bulunmamaktadır.
                          </Alert>
                        ) : (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Malzeme</TableCell>
                                  <TableCell align="right">Miktar</TableCell>
                                  <TableCell align="right">Birim</TableCell>
                                  <TableCell align="right">Birim Fiyat</TableCell>
                                  <TableCell align="right">Toplam</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {productNeeds.map((product) => (
                                  <TableRow key={product.product_id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell align="right">{formatQuantity(product.quantity)}</TableCell>
                                    <TableCell align="right">{product.unit}</TableCell>
                                    <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                                    <TableCell align="right">{formatCurrency(product.total_price)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                                    Genel Toplam:
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(totalCost)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim snackbar'ı */}
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

export default Menus;