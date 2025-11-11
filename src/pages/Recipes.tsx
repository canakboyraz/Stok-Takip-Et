import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Alert,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types/database';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

const Recipes = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  // const [products, setProducts] = useState<Product[]>([]); // Kullanılmıyor
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Define categories in a specific order
  const categoryOrder = [
    'starter',   // Başlangıç
    'main',      // Ana Yemek
    'side',      // Yan Yemek
    'dessert',   // Tatlı
    'beverage',  // İçecek
    'soup',      // Çorba
    'salad',     // Salata
    'breakfast'  // Kahvaltı
  ];

  // Filter recipes based on search term and selected category
  const filteredRecipes = recipes.filter(recipe => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by category
    const matchesCategory = selectedCategory === null || recipe.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort recipes by category order
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    const categoryIndexA = categoryOrder.indexOf(a.category);
    const categoryIndexB = categoryOrder.indexOf(b.category);
    
    // If both categories are in our order list, sort by that order
    if (categoryIndexA >= 0 && categoryIndexB >= 0) {
      return categoryIndexA - categoryIndexB;
    }
    // If only one is in our list, prioritize the one in our list
    if (categoryIndexA >= 0) return -1;
    if (categoryIndexB >= 0) return 1;
    
    // If neither is in our list, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *
        `)
        .eq('project_id', currentProjectId)
        .order('name');
      
      if (error) throw error;
      
      // Tarif listesini state'e kaydet
      setRecipes(data || []);
      
    } catch (error: any) {
      logger.error('Tarif listesi alınırken hata:', error);
      setAlert({
        show: true,
        message: `Tarifler yüklenirken hata oluştu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAllRecipePrices = async () => {
    try {
      setUpdating(true);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      // Fetch all active products to have latest prices
      const { data: latestProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('project_id', currentProjectId);
        
      if (productsError) throw productsError;
      
      // Create a map of product IDs to product data for quick lookup
      const productMap = new Map();
      latestProducts.forEach(product => {
        productMap.set(product.id, product);
      });
      
      // Get all recipes with ingredients
      const { data: allRecipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('project_id', currentProjectId);
        
      if (recipesError) throw recipesError;
      
      // Process each recipe
      for (const recipe of allRecipes) {
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .select('*')
          .eq('recipe_id', recipe.id);
          
        if (ingredientsError) throw ingredientsError;
        
        // Calculate total cost
        let totalCost = 0;
        
        for (const ingredient of ingredients) {
          const product = productMap.get(ingredient.product_id);
          if (product) {
            totalCost += (ingredient.quantity * product.price);
          }
        }
        
        // Calculate cost per serving
        const costPerServing = recipe.serving_size > 0 
          ? totalCost / recipe.serving_size 
          : 0;
          
        // Update recipe with new cost
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ cost_per_serving: costPerServing })
          .eq('id', recipe.id);
          
        if (updateError) throw updateError;
      }
      
      // Reload recipes to show updated prices
      await fetchRecipes();
      
      setAlert({
        show: true,
        message: 'Tüm tarif maliyetleri başarıyla hesaplandı',
        type: 'success'
      });
      
    } catch (error: any) {
      logger.error('Tariflerin maliyetleri hesaplanırken hata:', error);
      setAlert({
        show: true,
        message: `Tariflerin maliyetleri hesaplanırken hata: ${error.message}`,
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'starter': return 'Başlangıç';
      case 'main': return 'Ana Yemek';
      case 'dessert': return 'Tatlı';
      case 'beverage': return 'İçecek';
      case 'side': return 'Yan Yemek';
      case 'soup': return 'Çorba';
      case 'salad': return 'Salata';
      case 'breakfast': return 'Kahvaltı';
      case 'appetizer': return 'Aperatif';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'starter': 
      case 'appetizer': return '#e3f2fd'; // Açık mavi
      case 'main': return '#ffebee';      // Açık kırmızı
      case 'dessert': return '#fff8e1';   // Açık sarı
      case 'beverage': return '#e8f5e9';  // Açık yeşil
      case 'side': return '#f3e5f5';      // Açık mor
      case 'soup': return '#e0f7fa';      // Açık turkuaz
      case 'salad': return '#f1f8e9';     // Açık yeşil (farklı ton)
      case 'breakfast': return '#fff3e0';  // Açık turuncu
      default: return '#f5f5f5';          // Açık gri
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dk`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} sa ${remainingMinutes} dk` : `${hours} sa`;
  };
  
  // Tarif silme işlemi
  const handleDeleteRecipe = async (recipeId: number, recipeName: string) => {
    if (window.confirm(`"${recipeName}" tarifini silmek istediğinizden emin misiniz?`)) {
      try {
        // Önce ilişkili malzemeleri sil
        const { error: ingredientError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipeId);
          
        if (ingredientError) {
          logger.error('Malzemeler silinirken hata:', ingredientError);
          setAlert({
            show: true,
            message: 'Malzemeler silinirken bir hata oluştu.',
            type: 'error'
          });
          return;
        }
        
        // Sonra tarifi sil
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', recipeId);
          
        if (error) {
          logger.error('Tarif silinirken hata:', error);
          setAlert({
            show: true,
            message: 'Tarif silinirken bir hata oluştu.',
            type: 'error'
          });
          return;
        }
        
        // Başarılı silme mesajı göster
        setAlert({
          show: true,
          message: `"${recipeName}" tarifi başarıyla silindi.`,
          type: 'success'
        });
        
        // Tarif listesini güncelle
        fetchRecipes();
      } catch (error) {
        logger.error('Tarif silme hatası:', error);
        setAlert({
          show: true,
          message: 'Tarif silinirken bir hata oluştu.',
          type: 'error'
        });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tarifler
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={calculateAllRecipePrices}
            disabled={updating || loading}
            sx={{ mr: 1 }}
          >
            {updating ? <CircularProgress size={24} /> : 'Fiyatları Güncelle'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/recipe-add')}
          >
            Yeni Tarif
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', mb: 2 }}>
        {/* Search and Filter Bar */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Tariflerde Ara"
                placeholder="Tarif adı veya açıklamasına göre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip 
                  label="Tümü" 
                  color={selectedCategory === null ? "primary" : "default"}
                  onClick={() => setSelectedCategory(null)}
                  sx={{ fontWeight: selectedCategory === null ? 'bold' : 'normal' }}
                />
                {categoryOrder.map(category => (
                  <Chip 
                    key={category}
                    label={getCategoryLabel(category)}
                    color={selectedCategory === category ? "primary" : "default"}
                    onClick={() => setSelectedCategory(category)}
                    sx={{ 
                      backgroundColor: selectedCategory === category ? undefined : getCategoryColor(category),
                      fontWeight: selectedCategory === category ? 'bold' : 'normal' 
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : sortedRecipes.length === 0 ? (
          <Alert severity="info">
            {searchTerm || selectedCategory ? 
              'Arama kriterlerinize uygun tarif bulunamadı.' : 
              'Henüz tarif eklenmemiş'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {sortedRecipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderTop: `4px solid ${getCategoryColor(recipe.category)}`,
                    position: 'relative'
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <Tooltip title="Düzenle">
                      <IconButton size="small" onClick={() => navigate(`/recipe-edit/${recipe.id}`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2" noWrap>
                      {recipe.name}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={getCategoryLabel(recipe.category)} 
                    size="small" 
                    sx={{ mb: 1, alignSelf: 'flex-start', bgcolor: getCategoryColor(recipe.category) }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {recipe.description?.length > 80 
                      ? `${recipe.description.substring(0, 80)}...` 
                      : recipe.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between" mt="auto">
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Hazırlama: {formatTime(recipe.preparation_time)}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Pişirme: {formatTime(recipe.cooking_time)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Porsiyon: {recipe.serving_size}
                      </Typography>
                      <Typography variant="caption" display="block" fontWeight="bold">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        }).format(recipe.cost_per_serving || 0)}
                        /porsiyon
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
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

export default Recipes; 