import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { Menu, Recipe } from '../types/database';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/activityLogger';

interface DetailedIngredient {
  product_id: number;
  quantity: number;
  unit: string;
  product_name: string;
  product_price: number;
  current_stock: number;
}

interface DetailedRecipe extends Omit<Recipe, 'ingredients'> {
  ingredients?: DetailedIngredient[];
  quantity?: number; // Menüdeki miktar
}

interface ConsumptionItem {
  product_id: number;
  product_name: string;
  total_needed: number;
  unit: string;
  current_stock: number;
  sufficient: boolean;
  cost: number;
}

const MenuConsumption = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [consumptionItems, setConsumptionItems] = useState<ConsumptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Menüleri yükle
  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        setError('Proje seçilmemiş');
        return;
      }

      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (err: any) {
      setError(`Menüler yüklenirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateConsumption = async () => {
    if (!selectedMenu || guestCount <= 0) {
      setError('Lütfen menü seçin ve geçerli kişi sayısı girin');
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      // Menünün tariflerini al
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('recipe_id, quantity')
        .eq('menu_id', selectedMenu.id);

      if (menuItemsError) throw menuItemsError;

      if (!menuItemsData || menuItemsData.length === 0) {
        setError('Bu menüde tarif bulunamadı');
        return;
      }

      // Her tarif için detayları al
      const recipesWithDetails = await Promise.all(
        menuItemsData.map(async (menuItem) => {
          // Tarif bilgilerini al
          const { data: recipeData, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', menuItem.recipe_id)
            .single();

          if (recipeError) throw recipeError;

          // Tarif malzemelerini al
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .select(`
              product_id,
              quantity,
              unit,
              products:products (
                id,
                name,
                price,
                stock_quantity
              )
            `)
            .eq('recipe_id', menuItem.recipe_id);

          if (ingredientsError) throw ingredientsError;

          const ingredients: DetailedIngredient[] = ingredientsData?.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit: item.unit,
            product_name: item.products?.name || 'Bilinmeyen Ürün',
            product_price: item.products?.price || 0,
            current_stock: item.products?.stock_quantity || 0,
          })) || [];

          return {
            ...recipeData,
            quantity: menuItem.quantity,
            ingredients,
          } as DetailedRecipe;
        })
      );

      // Recipes processed for consumption calculation

      // Tüketim hesaplaması yap
      const consumptionMap = new Map<number, ConsumptionItem>();

      recipesWithDetails.forEach((recipe) => {
        const recipeMultiplier = recipe.quantity || 1; // Menüdeki tarif miktarı
        const servingMultiplier = guestCount / recipe.serving_size; // Kişi sayısına göre çarpan

        recipe.ingredients?.forEach((ingredient) => {
          const totalNeeded = ingredient.quantity * recipeMultiplier * servingMultiplier;
          
          if (consumptionMap.has(ingredient.product_id)) {
            const existing = consumptionMap.get(ingredient.product_id)!;
            existing.total_needed += totalNeeded;
            existing.cost += totalNeeded * ingredient.product_price;
          } else {
            consumptionMap.set(ingredient.product_id, {
              product_id: ingredient.product_id,
              product_name: ingredient.product_name,
              total_needed: totalNeeded,
              unit: ingredient.unit,
              current_stock: ingredient.current_stock,
              sufficient: ingredient.current_stock >= totalNeeded,
              cost: totalNeeded * ingredient.product_price,
            });
          }
        });
      });

      const consumptionList = Array.from(consumptionMap.values());
      setConsumptionItems(consumptionList);
      
      const total = consumptionList.reduce((sum, item) => sum + item.cost, 0);
      setTotalCost(total);

    } catch (err: any) {
      setError(`Hesaplama hatası: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  };

  const executeConsumption = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) throw new Error('Proje ID bulunamadı');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Kullanıcı bilgisi alınamadı');

      // Yetersiz stok kontrolü
      const insufficientItems = consumptionItems.filter(item => !item.sufficient);
      if (insufficientItems.length > 0) {
        setError(`Yetersiz stok: ${insufficientItems.map(item => item.product_name).join(', ')}`);
        return;
      }

      // Bulk ID oluştur (numeric format for bulk_movements table)
      const bulkId = Math.floor(Date.now() / 1000); // Unix timestamp as number

      // Bulk movement kaydını oluştur
      const { error: bulkError } = await supabase
        .from('bulk_movements')
        .insert({
          id: bulkId,
          date: new Date().toISOString(),
          notes: `Menü tüketimi: ${selectedMenu?.name} - ${guestCount} kişi (Toplam: ${totalCost.toFixed(2)} ₺)`,
          type: 'out',
          project_id: parseInt(currentProjectId),
          user_id: userData.user.id,
          operation_type: 'menu_consumption',
          can_be_reversed: true,
        });

      if (bulkError) throw bulkError;

      // Her ürün için stok hareketi oluştur ve stok güncelle
      for (const item of consumptionItems) {
        // Stok hareketini kaydet
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            type: 'out',
            quantity: item.total_needed,
            date: new Date().toISOString(),
            notes: `Menü tüketimi: ${selectedMenu?.name} - ${guestCount} kişi`,
            user_id: userData.user.id,
            is_bulk: true,
            bulk_id: bulkId.toString(),
            project_id: parseInt(currentProjectId),
          });

        if (movementError) throw movementError;

        // Ürün stok miktarını güncelle
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: item.current_stock - item.total_needed,
          })
          .eq('id', item.product_id);

        if (updateError) throw updateError;
      }

      // Etkinlik kaydı ekle
      await logActivity(
        'menu_consumption',
        `${selectedMenu?.name} menüsü - ${guestCount} kişi (${consumptionItems.length} ürün tüketildi, Toplam: ${totalCost.toFixed(2)} ₺)`,
        'bulk_movement',
        bulkId
      );

      setSuccess(`Menü tüketimi başarıyla kaydedildi! ${guestCount} kişilik ${selectedMenu?.name} menüsü için stoklar güncellendi.`);
      setConfirmDialog(false);
      
      // Sayfayı temizle
      setSelectedMenu(null);
      setGuestCount(1);
      setConsumptionItems([]);

    } catch (err: any) {
      setError(`Tüketim kaydı hatası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            🍽️ Menü Tüketim Sistemi
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => navigate('/menu-consumption-undo')}
            startIcon={<span>🔄</span>}
          >
            Geri Alma
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Hazırladığınız menülerden birini seçin, kişi sayısını girin ve otomatik olarak 
          gerekli malzeme miktarlarını hesaplayıp stoktan düşürün.
        </Typography>

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
          <Typography variant="h6" gutterBottom>
            1. Menü Seçimi
          </Typography>
          
          <Autocomplete
            options={menus}
            getOptionLabel={(option) => `${option.name} - ${option.date}`}
            value={selectedMenu}
            onChange={(_, newValue) => setSelectedMenu(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Menü Seçin"
                variant="outlined"
                fullWidth
              />
            )}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Kişi Sayısı"
            type="number"
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1 }}
            sx={{ mb: 2, width: 200 }}
          />

          <Button
            variant="contained"
            onClick={calculateConsumption}
            disabled={!selectedMenu || guestCount <= 0 || calculating}
            sx={{ ml: 2 }}
          >
            {calculating ? <CircularProgress size={20} /> : 'Hesapla'}
          </Button>
        </Box>

        {consumptionItems.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              2. Tüketim Hesaplaması
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">
                  📊 Özet: {selectedMenu?.name} - {guestCount} Kişi
                </Typography>
                <Typography variant="h6" color="primary">
                  Toplam Maliyet: {totalCost.toFixed(2)} ₺
                </Typography>
              </CardContent>
            </Card>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ürün</TableCell>
                    <TableCell align="right">Gerekli Miktar</TableCell>
                    <TableCell align="right">Mevcut Stok</TableCell>
                    <TableCell align="right">Durum</TableCell>
                    <TableCell align="right">Maliyet</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consumptionItems.map((item) => (
                    <TableRow
                      key={item.product_id}
                      sx={{
                        backgroundColor: item.sufficient ? 'inherit' : 'error.light',
                        opacity: item.sufficient ? 1 : 0.7,
                      }}
                    >
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="right">
                        {item.total_needed.toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        {item.current_stock.toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        {item.sufficient ? (
                          <Typography color="success.main">✅ Yeterli</Typography>
                        ) : (
                          <Typography color="error.main">❌ Yetersiz</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.cost.toFixed(2)} ₺
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => setConfirmDialog(true)}
                disabled={consumptionItems.some(item => !item.sufficient)}
              >
                🍽️ Menü Tüketimini Gerçekleştir
              </Button>
            </Box>
          </>
        )}

        {/* Onay Dialogu */}
        <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
          <DialogTitle>Menü Tüketimi Onayı</DialogTitle>
          <DialogContent>
            <Typography>
              <strong>{selectedMenu?.name}</strong> menüsü için <strong>{guestCount} kişilik</strong> tüketim gerçekleştirilecek.
            </Typography>
            <Typography sx={{ mt: 2 }}>
              Toplam maliyet: <strong>{totalCost.toFixed(2)} ₺</strong>
            </Typography>
            <Typography sx={{ mt: 1 }} color="warning.main">
              Bu işlem geri alınamaz! Stoklar güncellenecek.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(false)}>İptal</Button>
            <Button
              onClick={executeConsumption}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Onayla'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default MenuConsumption;
