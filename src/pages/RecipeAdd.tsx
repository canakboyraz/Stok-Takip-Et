import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  SelectChangeEvent,
  Autocomplete
} from '@mui/material';
import { Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { logger } from '../utils/logger';

interface Ingredient {
  product_id: number;
  quantity: number;
  unit: string;
  product_name: string;
  price: number;
}

interface RecipeData {
  name: string;
  description: string;
  preparation_time: number;
  cooking_time: number;
  serving_size: number;
  instructions: string;
  category: string;
}

const RecipeAdd = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Refs to prevent infinite loops
  const recipeLoadedRef = useRef<boolean>(false);
  const currentRecipeIdRef = useRef<string | undefined>(undefined);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  
  // Data states
  const [uniqueProducts, setUniqueProducts] = useState<{
    id: number;
    name: string;
    weightedPrice: number;
  }[]>([]);
  
  // Form states
  const [recipeData, setRecipeData] = useState<RecipeData>({
    name: '',
    description: '',
    preparation_time: 0,
    cooking_time: 0,
    serving_size: 4,
    instructions: '',
    category: 'main',
  });
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Add ingredient form states
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    weightedPrice: number;
  } | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('adet');
  
  // Alert state
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Fetch products - basit fonksiyon
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje ID bulunamadı');
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('name');
      
      if (error) throw error;
      
      // Calculate unique products with weighted average prices
      if (data && data.length > 0) {
        const groupedByName: Record<string, Product[]> = {};
        
        data.forEach(product => {
          if (!groupedByName[product.name]) {
            groupedByName[product.name] = [];
          }
          groupedByName[product.name].push(product);
        });
        
        const uniqueProductsData = Object.entries(groupedByName).map(([name, products]) => {
          // Calculate weighted average price
          const totalQuantity = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
          const weightedPrice = totalQuantity > 0 
            ? products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0) / totalQuantity
            : products[0]?.price || 0;
          
          return {
            id: products[0].id,
            name: name,
            weightedPrice: weightedPrice
          };
        });
        
        setUniqueProducts(uniqueProductsData);
      }
      
    } catch (error: any) {
      logger.error('Ürünler yüklenirken hata:', error);
      setAlert({
        show: true,
        message: `Ürünler yüklenirken hata oluştu: ${error.message}`,
        type: 'error',
      });
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch recipe data for edit mode - Tamamen yeniden yazıldı
  const fetchRecipe = useCallback(async () => {
    if (!isEditMode || !id || recipeLoadedRef.current || currentRecipeIdRef.current === id) {
      logger.log('fetchRecipe atlandı - koşullar:', { 
        isEditMode, 
        id, 
        recipeLoadedRef: recipeLoadedRef.current,
        currentRecipeIdRef: currentRecipeIdRef.current 
      });
      return;
    }
    
    logger.log('fetchRecipe başlatılıyor, ID:', id);
    
    try {
      setLoading(true);
      recipeLoadedRef.current = true; // Hemen başta set et ki tekrar çağrılmasın
      currentRecipeIdRef.current = id;
      
      // Fetch recipe data
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (recipeError) throw recipeError;
      if (!recipeData) throw new Error('Tarif bulunamadı');
      
      // Set recipe form data
      setRecipeData({
        name: recipeData.name || '',
        description: recipeData.description || '',
        preparation_time: recipeData.preparation_time || 0,
        cooking_time: recipeData.cooking_time || 0,
        serving_size: recipeData.serving_size || 4,
        instructions: recipeData.instructions || '',
        category: recipeData.category || 'main',
      });
      
      // Fetch recipe ingredients - SADECE BİR KEZ
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          *,
          products (
            id, name, price
          )
        `)
        .eq('recipe_id', id);
        
      if (ingredientsError) throw ingredientsError;
      
      // Format ingredients data - QUANTITY MERGE LOGIC
      if (ingredientsData && ingredientsData.length > 0) {
        const formattedIngredients: Ingredient[] = ingredientsData.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit,
          product_name: item.products?.name || 'Bilinmeyen Ürün',
          price: item.products?.price || 0
        }));
        
        logger.log('Tarif malzemeleri yüklendi:', formattedIngredients.length, 'adet');
        
        // DUPLICATE PRODUCT_ID'LERİ MERGE ET - QUANTITY'LERİ TOPLA
        const mergedIngredients = new Map<number, Ingredient>();
        
        formattedIngredients.forEach(ingredient => {
          const existingIngredient = mergedIngredients.get(ingredient.product_id);
          
          if (existingIngredient) {
            // Aynı ürün varsa, miktarları topla
            existingIngredient.quantity += ingredient.quantity;
            logger.log(`Duplicate malzeme birleştirildi: ${ingredient.product_name}, toplam miktar: ${existingIngredient.quantity}`);
          } else {
            // Yeni ürün, direkt ekle
            mergedIngredients.set(ingredient.product_id, { ...ingredient });
          }
        });
        
        const finalIngredients = Array.from(mergedIngredients.values());
        logger.log('Birleştirilmiş malzemeler:', finalIngredients.length, 'adet');
        
        // State'i direkt set et - setTimeout gereksiz
        setIngredients(finalIngredients);
      } else {
        logger.log('Tarif için malzeme bulunamadı');
        setIngredients([]);
      }
      
      logger.log('Tarif başarıyla yüklendi');
      
    } catch (error: any) {
      logger.error('Tarif yüklenirken hata:', error);
      recipeLoadedRef.current = false; // Hata durumunda tekrar deneyebilsin
      currentRecipeIdRef.current = undefined;
      setAlert({
        show: true,
        message: `Tarif yüklenirken hata oluştu: ${error.message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode]);

  // Effects - Daha stabil yaklaşım
  useEffect(() => {
    logger.log('RecipeAdd component mounting, fetching products...');
    fetchProducts();
  }, []); // fetchProducts dependency'sini kaldırdık

  // ID değiştiğinde state'leri sıfırla - sadece ID gerçekten değiştiğinde
  useEffect(() => {
    logger.log('Recipe ID değişti, state sıfırlanıyor:', id);
    recipeLoadedRef.current = false;
    currentRecipeIdRef.current = undefined;
    setIngredients([]);
    setRecipeData({
      name: '',
      description: '',
      preparation_time: 0,
      cooking_time: 0,
      serving_size: 4,
      instructions: '',
      category: 'main',
    });
  }, [id]);

  // Edit mode için tarif yükleme - sadece gerekli koşullarda
  useEffect(() => {
    if (isEditMode && id && !productsLoading && !recipeLoadedRef.current) {
      logger.log('Tarif yükleme koşulları sağlandı, fetchRecipe çağrılıyor');
      fetchRecipe();
    }
  }, [isEditMode, id, productsLoading, fetchRecipe]);

  // Event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecipeData(prev => ({
      ...prev,
      [name]: name.includes('time') || name === 'serving_size' ? Number(value) : value
    }));
  };

  const handleCategoryChange = (e: SelectChangeEvent) => {
    setRecipeData(prev => ({
      ...prev,
      category: e.target.value
    }));
  };

  const addIngredient = () => {
    if (!selectedProduct || quantity <= 0) {
      setAlert({
        show: true,
        message: 'Lütfen geçerli bir ürün ve miktar seçin',
        type: 'error',
      });
      return;
    }

    // Check if product already exists
    const existingIngredientIndex = ingredients.findIndex(ing => ing.product_id === selectedProduct.id);
    if (existingIngredientIndex !== -1) {
      logger.log('Ürün zaten mevcut:', selectedProduct.name);
      
      // Mevcut malzemenin miktarını artır
      setIngredients(prev => prev.map((ingredient, index) => 
        index === existingIngredientIndex 
          ? { ...ingredient, quantity: ingredient.quantity + quantity }
          : ingredient
      ));
      
      setAlert({
        show: true,
        message: `"${selectedProduct.name}" zaten listede vardı. Miktarı ${quantity} ${unit} artırıldı.`,
        type: 'success',
      });
      
      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setUnit('adet');
      return;
    }

    const newIngredient: Ingredient = {
      product_id: selectedProduct.id,
      quantity: quantity,
      unit: unit,
      product_name: selectedProduct.name,
      price: selectedProduct.weightedPrice
    };

    setIngredients(prev => [...prev, newIngredient]);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setUnit('adet');
  };

  const cleanDuplicateIngredients = () => {
    logger.log('Duplicate malzemeler temizleniyor...');
    
    setIngredients(prev => {
      const uniqueIngredients = prev.reduce((acc: Ingredient[], current) => {
        const existingIndex = acc.findIndex(item => item.product_id === current.product_id);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Eğer aynı ürün varsa, miktarları topla
          acc[existingIndex].quantity += current.quantity;
          logger.log(`Duplicate malzeme birleştirildi: ${current.product_name}, toplam miktar: ${acc[existingIndex].quantity}`);
        }
        return acc;
      }, []);
      
      logger.log('Temizleme öncesi:', prev.length, 'sonrası:', uniqueIngredients.length);
      return uniqueIngredients;
    });
    
    setAlert({
      show: true,
      message: 'Duplicate malzemeler temizlendi ve birleştirildi',
      type: 'success',
    });
  };

  const removeIngredientByProductId = (productId: number, productName: string) => {
    logger.log('Malzeme siliniyor, product_id:', productId, 'Mevcut malzemeler:', ingredients.length);
    
    setIngredients(prev => {
      const newIngredients = prev.filter(ingredient => ingredient.product_id !== productId);
      logger.log('Silme sonrası malzeme sayısı:', newIngredients.length);
      return newIngredients;
    });
    
    setAlert({
      show: true,
      message: `"${productName}" malzemesi silindi`,
      type: 'success',
    });
  };

  const removeIngredient = (index: number) => {
    logger.log('Malzeme siliniyor, index:', index, 'Mevcut malzemeler:', ingredients.length);
    
    if (index < 0 || index >= ingredients.length) {
      logger.error('Geçersiz index:', index);
      setAlert({
        show: true,
        message: 'Malzeme silinirken hata oluştu',
        type: 'error',
      });
      return;
    }
    
    const ingredientToRemove = ingredients[index];
    logger.log('Silinecek malzeme:', ingredientToRemove);
    
    // Product ID ile silme işlemini yap
    removeIngredientByProductId(ingredientToRemove.product_id, ingredientToRemove.product_name);
  };

  const updateIngredientQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setIngredients(prev => prev.map((ingredient, i) => 
      i === index ? { ...ingredient, quantity: newQuantity } : ingredient
    ));
  };

  const updateIngredientUnit = (index: number, newUnit: string) => {
    setIngredients(prev => prev.map((ingredient, i) => 
      i === index ? { ...ingredient, unit: newUnit } : ingredient
    ));
  };

  const calculateCostPerServing = () => {
    const totalCost = ingredients.reduce((sum, ingredient) => {
      return sum + (ingredient.quantity * ingredient.price);
    }, 0);

    return totalCost / recipeData.serving_size;
  };

  const handleSaveRecipe = async () => {
    try {
      // Validation
      if (!recipeData.name.trim()) {
        setAlert({
          show: true,
          message: 'Lütfen tarif adını girin',
          type: 'error',
        });
        return;
      }

      if (ingredients.length === 0) {
        setAlert({
          show: true,
          message: 'Lütfen en az bir malzeme ekleyin',
          type: 'error',
        });
        return;
      }

      setSaving(true);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        throw new Error('Proje bulunamadı');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const costPerServing = calculateCostPerServing();

      if (isEditMode && id) {
        // Update existing recipe
        const { error: recipeError } = await supabase
          .from('recipes')
          .update({
            name: recipeData.name.trim(),
            description: recipeData.description.trim(),
            preparation_time: recipeData.preparation_time,
            cooking_time: recipeData.cooking_time,
            serving_size: recipeData.serving_size,
            instructions: recipeData.instructions.trim(),
            category: recipeData.category,
            cost_per_serving: costPerServing,
          })
          .eq('id', id);

        if (recipeError) throw recipeError;

        // RLS restriction: Delete & Insert ingredients instead of upsert
        // 1) Delete existing rows
        const { error: deleteErr } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', id);

        if (deleteErr) throw deleteErr;

        // 2) Insert current ingredient list
        if (ingredients.length > 0) {
          const mergedMap = new Map<number, typeof ingredients[0]>();
          ingredients.forEach(ing => {
            const existing = mergedMap.get(ing.product_id);
            if (existing) {
              existing.quantity += ing.quantity;
            } else {
              mergedMap.set(ing.product_id, { ...ing });
            }
          });

          const ingredientRows = Array.from(mergedMap.values()).map(ingredient => ({
            recipe_id: Number(id),
            product_id: ingredient.product_id,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          }));

          const { error: upErr } = await supabase
            .from('recipe_ingredients')
            .upsert(ingredientRows, { onConflict: 'recipe_id,product_id' });

          if (upErr) throw upErr;
        }

        setAlert({
          show: true,
          message: 'Tarif başarıyla güncellendi',
          type: 'success',
        });
      } else {
        // Create new recipe
        const { data: insertedRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert([
            {
              name: recipeData.name.trim(),
              description: recipeData.description.trim(),
              preparation_time: recipeData.preparation_time,
              cooking_time: recipeData.cooking_time,
              serving_size: recipeData.serving_size,
              instructions: recipeData.instructions.trim(),
              category: recipeData.category,
              cost_per_serving: costPerServing,
              project_id: parseInt(currentProjectId),
              user_id: user.id,
            },
          ])
          .select('id')
          .single();

        if (recipeError) throw recipeError;

        if (!insertedRecipe?.id) {
          throw new Error('Tarif eklenirken bir hata oluştu');
        }

        // Insert ingredients (no update needed on create)
        if (ingredients.length > 0) {
          const mergedMapC = new Map<number, typeof ingredients[0]>();
          ingredients.forEach(ing => {
            const existing = mergedMapC.get(ing.product_id);
            if (existing) {
              existing.quantity += ing.quantity;
            } else {
              mergedMapC.set(ing.product_id, { ...ing });
            }
          });

          const ingredientRows = Array.from(mergedMapC.values()).map(ingredient => ({
            recipe_id: insertedRecipe.id,
            product_id: ingredient.product_id,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          }));

          const { error: insErr } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientRows);

          if (insErr) throw insErr;
        }

        setAlert({
          show: true,
          message: 'Tarif başarıyla kaydedildi',
          type: 'success',
        });
      }

      // Navigate back to recipes after short delay
      setTimeout(() => {
        navigate('/recipes');
      }, 1500);
    } catch (error: any) {
      logger.error('Tarif kaydedilirken hata:', error);
      setAlert({
        show: true,
        message: `Tarif kaydedilirken hata oluştu: ${error.message}`,
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

  const commonUnits = ['adet', 'gram', 'kg', 'litre', 'ml', 'çay kaşığı', 'tatlı kaşığı', 'yemek kaşığı', 'su bardağı', 'fincan'];

  const categoryOptions = [
    { value: 'starter', label: 'Başlangıç' },
    { value: 'main', label: 'Ana Yemek' },
    { value: 'side', label: 'Yan Yemek' },
    { value: 'dessert', label: 'Tatlı' },
    { value: 'beverage', label: 'İçecek' },
    { value: 'soup', label: 'Çorba' },
    { value: 'salad', label: 'Salata' },
    { value: 'breakfast', label: 'Kahvaltı' }
  ];

  if (productsLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Ürünler yükleniyor...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Tarif Düzenle' : 'Yeni Tarif Ekle'}
          </Typography>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/recipes')}
          >
            Tariflere Dön
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Tarif yükleniyor...</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {/* Recipe Basic Info */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Temel Bilgiler
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Tarif Adı"
                    name="name"
                    value={recipeData.name}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Açıklama"
                    name="description"
                    value={recipeData.description}
                    onChange={handleInputChange}
                    margin="normal"
                    multiline
                    rows={3}
                  />
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={recipeData.category}
                      onChange={handleCategoryChange}
                      label="Kategori"
                    >
                      {categoryOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Hazırlama Süresi (dk)"
                        name="preparation_time"
                        type="number"
                        value={recipeData.preparation_time}
                        onChange={handleInputChange}
                        margin="normal"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Pişirme Süresi (dk)"
                        name="cooking_time"
                        type="number"
                        value={recipeData.cooking_time}
                        onChange={handleInputChange}
                        margin="normal"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Porsiyon Sayısı"
                    name="serving_size"
                    type="number"
                    value={recipeData.serving_size}
                    onChange={handleInputChange}
                    margin="normal"
                    inputProps={{ min: 1 }}
                  />
                </Paper>
              </Grid>

              {/* Instructions */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Yapılış
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Tarif Yapılışı"
                    name="instructions"
                    value={recipeData.instructions}
                    onChange={handleInputChange}
                    margin="normal"
                    multiline
                    rows={10}
                    placeholder="Tarif yapılışını adım adım yazın..."
                  />
                </Paper>
              </Grid>

              {/* Add Ingredients */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Malzeme Ekle
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        value={selectedProduct}
                        onChange={(_, newValue) => setSelectedProduct(newValue)}
                        options={uniqueProducts}
                        getOptionLabel={(option) => option.name}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Ürün Seçin"
                            fullWidth
                          />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Miktar"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        inputProps={{ min: 0.1, step: 0.1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Birim</InputLabel>
                        <Select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          label="Birim"
                        >
                          {commonUnits.map(unitOption => (
                            <MenuItem key={unitOption} value={unitOption}>
                              {unitOption}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={addIngredient}
                        disabled={!selectedProduct || quantity <= 0}
                      >
                        Malzeme Ekle
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Ingredients List */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Malzemeler ({ingredients.length})
                    </Typography>
                    {ingredients.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={cleanDuplicateIngredients}
                      >
                        Duplicate Temizle
                      </Button>
                    )}
                  </Box>
                  
                  {ingredients.length === 0 ? (
                    <Alert severity="info">
                      Henüz malzeme eklenmemiş. Yukarıdaki formdan malzeme ekleyebilirsiniz.
                    </Alert>
                  ) : (
                    <List>
                      {ingredients.map((ingredient, index) => (
                        <ListItem key={`ingredient-${ingredient.product_id}-${index}`} divider>
                                                     <ListItemText
                             primary={ingredient.product_name}
                             secondary={
                               <>
                                 {formatCurrency(ingredient.price)} / birim
                                 <br />
                                 Toplam: {formatCurrency(ingredient.quantity * ingredient.price)}
                               </>
                             }
                           />
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={ingredient.quantity}
                              onChange={(e) => updateIngredientQuantity(index, Number(e.target.value))}
                              inputProps={{ min: 0.1, step: 0.1 }}
                              sx={{ width: 80 }}
                            />
                            
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <Select
                                value={ingredient.unit}
                                onChange={(e) => updateIngredientUnit(index, e.target.value)}
                              >
                                {commonUnits.map(unitOption => (
                                  <MenuItem key={unitOption} value={unitOption}>
                                    {unitOption}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                          
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => removeIngredient(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  {ingredients.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="h6">
                        Toplam Maliyet: {formatCurrency(ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.price), 0))}
                      </Typography>
                      <Typography variant="body1">
                        Porsiyon Başına Maliyet: {formatCurrency(calculateCostPerServing())}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Save Button */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/recipes')}
                    disabled={saving}
                  >
                    İptal
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveRecipe}
                    disabled={saving || !recipeData.name.trim() || ingredients.length === 0}
                  >
                    {saving ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
      
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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

export default RecipeAdd; 