import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Typography,
  Box,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { logActivity } from '../lib/activityLogger';

interface SelectedProduct extends Product {
  quantity: number;
  selected: boolean;
}

const BulkStockOut = () => {
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [projectId, setProjectId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Check if there's a current project ID in localStorage
      const storedProjectId = localStorage.getItem('currentProjectId');
      if (!storedProjectId) {
        setError('Proje bulunamadı');
        setLoading(false);
        return;
      }

      setProjectId(parseInt(storedProjectId));

      console.log('Fetching products for project:', storedProjectId);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('project_id', storedProjectId)
        .gt('stock_quantity', 0) // Only fetch products with stock quantity > 0
        .order('name', { ascending: true }); // Ürün adına göre A-Z sıralama

      if (error) {
        console.error('Error fetching products:', error);
        setError('Ürünler yüklenirken bir hata oluştu');
        setLoading(false);
        return;
      }

      console.log('Fetched products:', data);

      // Map the products with additional fields for UI state
      const productsWithAddedFields = data.map(product => ({
        ...product,
        category_name: product.categories?.name || 'Kategorisiz',
        selected: false,
        quantity: 0
      }));

      setProducts(productsWithAddedFields);
      setLoading(false);
    } catch (error: any) {
      console.error('Unexpected error in fetchProducts:', error);
      setError('Ürünler yüklenirken beklenmeyen bir hata oluştu');
      setLoading(false);
    }
  }, []);

  // Initial project check
  useEffect(() => {
    const currentProjectId = localStorage.getItem('currentProjectId');
    if (!currentProjectId) {
      setError('Proje seçilmemiş! Lütfen önce bir proje seçin.');
      navigate('/projects');
      return;
    }
    
    const parsedProjectId = parseInt(currentProjectId);
    setProjectId(parsedProjectId);
    
    console.log('Current project ID:', parsedProjectId);
    fetchProducts();
  }, [fetchProducts, navigate]);

  // Listen for project changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentProjectId') {
        console.log('Project changed, refetching products');
        const newProjectId = e.newValue ? parseInt(e.newValue) : null;
        setProjectId(newProjectId);
        fetchProducts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchProducts]);

  // Safety check to ensure consistent project
  useEffect(() => {
    if (!products.length || !projectId) return;
    
    // Check if all products belong to the current project
    const wrongProjectProducts = products.filter(p => p.project_id !== projectId);
    
    if (wrongProjectProducts.length > 0) {
      console.error('Products from wrong project detected:', wrongProjectProducts);
      setError('Farklı projelere ait ürünler tespit edildi! Sayfa yenileniyor...');
      
      // Clear products and fetch again
      setProducts([]);
      setTimeout(() => {
        fetchProducts();
      }, 1000);
    }
  }, [products, projectId, fetchProducts]);

  const handleQuantityChange = (id: number, value: string) => {
    // Virgül ile yazılan ondalık sayıları nokta formatına çevir
    const formattedValue = value.replace(',', '.');
    
    // Sadece sayı ve nokta karakterlerine izin ver
    if (formattedValue !== '' && !/^\d*\.?\d{0,2}$/.test(formattedValue)) {
      return; // Geçersiz giriş ise işlemi durdur
    }
    
    const quantity = parseFloat(formattedValue) || 0;
    
    setProducts(products.map(product => {
      if (product.id === id) {
        // Limit quantity to stock quantity
        const limitedQuantity = Math.min(quantity, product.stock_quantity);
        return { ...product, quantity: limitedQuantity };
      }
      return product;
    }));
  };

  const handleSelectChange = (id: number) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, selected: !product.selected } : product
    ));
  };

  const handleBulkStockOut = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        setError('Proje seçilmemiş. Lütfen önce bir proje seçin.');
        return;
      }
      
      // Parse project ID
      const projectId = parseInt(currentProjectId);

      const selectedProducts = products.filter(p => p.selected && p.quantity > 0);
      
      if (selectedProducts.length === 0) {
        setError('Lütfen en az bir ürün seçin ve miktar girin');
        return;
      }

      // Double-check all selected products belong to the current project
      const nonProjectProducts = selectedProducts.filter(p => p.project_id !== projectId);
      if (nonProjectProducts.length > 0) {
        setError(`Seçilen ürünlerden bazıları bu projeye ait değil. Lütfen sayfayı yenileyin.`);
        console.error('Products from other projects detected:', nonProjectProducts);
        return;
      }

      // Stok kontrolü
      const insufficientStock = selectedProducts.find(p => p.quantity > p.stock_quantity);
      if (insufficientStock) {
        setError(`${insufficientStock.name} ürünü için yeterli stok yok`);
        return;
      }

      // Kullanıcı ID'sini al
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Benzersiz bir toplu çıkış ID'si oluştur
      const bulkId = Date.now();
      console.log('Generated bulk ID:', bulkId);
      
      let totalCost = 0;

      // Stok hareketleri oluştur
      for (const product of selectedProducts) {
        // Ürün birim fiyatını al
        const unitPrice = product.unit_price || product.price;
        
        // Bu ürün için toplam maliyeti hesapla
        const itemCost = product.quantity * unitPrice;
        totalCost += itemCost;

        console.log(`Processing product: ${product.name}, quantity: ${product.quantity}, unitPrice: ${unitPrice}, cost: ${itemCost}`);

        // Stok hareketini kaydet
        const stockMovementData = {
          product_id: product.id,
          type: 'out',
          quantity: product.quantity,
          date: new Date().toISOString(),
          notes: 'Toplu stok çıkışı',
          user_id: user.id,
          is_bulk: true,
          bulk_id: bulkId,
          project_id: projectId // Add project_id to stock movements
        };
        
        console.log('Inserting stock movement:', stockMovementData);
        
        const { data: movementData, error: movementError } = await supabase
          .from('stock_movements')
          .insert([stockMovementData])
          .select();

        if (movementError) {
          console.error('Stok hareketi hatası:', movementError);
          throw movementError;
        }
        
        console.log('Inserted movement data:', movementData);

        // Ürün stoğunu güncelle - proje kontrolü ile
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - product.quantity })
          .eq('id', product.id)
          .eq('project_id', projectId); // Double check project_id for safety

        if (updateError) {
          console.error('Stok güncelleme hatası:', updateError);
          throw updateError;
        }
      }

      // Create bulk movement record with project_id
      const { error: bulkMovementError } = await supabase
        .from('bulk_movements')
        .insert({
          id: bulkId,
          date: new Date().toISOString(),
          notes: 'Toplu stok çıkışı',
          type: 'out',
          project_id: projectId
        });
      
      if (bulkMovementError) {
        console.error('Bulk movement error:', bulkMovementError);
        throw bulkMovementError;
      }

      console.log(`Bulk stock out completed with ID ${bulkId} and total cost ${totalCost}`);
      
      // Etkinlik kaydı ekle - Hata olsa bile stok işlemi tamamlanmış olsun
      try {
        const productNames = selectedProducts.map(p => p.name).join(', ');
        console.log('🔍 BulkStockOut: Etkinlik kaydı ekleniyor...', {
          type: 'stock_bulk_out',
          description: `Toplu stok çıkışı - ${selectedProducts.length} ürün (${productNames}) - Toplam: ${totalCost.toFixed(2)} ₺`,
          entity_type: 'bulk_movement',
          entity_id: bulkId
        });
        
        const activityResult = await logActivity(
          'stock_bulk_out',
          `Toplu stok çıkışı - ${selectedProducts.length} ürün (${productNames}) - Toplam: ${totalCost.toFixed(2)} ₺`,
          'bulk_movement',
          bulkId
        );
        
        console.log('🔍 BulkStockOut: Etkinlik kaydı sonucu:', activityResult);
        
        if (!activityResult) {
          console.warn('⚠️ Etkinlik kaydı başarısız oldu ama stok işlemi tamamlandı');
        }
      } catch (activityError) {
        console.error('❌ Etkinlik kaydı hatası (stok işlemi başarılı):', activityError);
        // Etkinlik kaydı hatası stok işlemini etkilememeli
      }
      
      setSuccess('Stok çıkışı başarıyla tamamlandı');
      
      // Stok hareketleri sayfasına yönlendir
      setTimeout(() => {
        navigate('/stock-movements');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error in bulk stock out:', error);
      setError('Stok çıkışı sırasında bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Miktar gösterimi için helper fonksiyon
  const formatQuantity = (quantity: number): string => {
    // Tam sayı ise nokta sonrası gösterme
    if (Number.isInteger(quantity)) {
      return quantity.toString();
    }
    // Ondalıklı sayı ise virgülle göster, en fazla 2 basamak
    return quantity.toFixed(2).replace('.', ',');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Toplu Stok Çıkışı</Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => navigate('/stock-movements')}
            sx={{ mr: 2 }}
          >
            Stok Hareketleri
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleBulkStockOut}
            disabled={loading || !products.length}
          >
            Stok Çıkışı Yap
          </Button>
        </Box>
      </Box>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Bu proje için hiç ürün bulunamadı. Lütfen önce ürün ekleyin.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>Ürün Adı</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Marka</TableCell>
                <TableCell>Son Kul. Tarihi</TableCell>
                <TableCell align="right">Mevcut Stok</TableCell>
                <TableCell align="right">Birim Fiyat</TableCell>
                <TableCell align="right">Çıkış Miktarı</TableCell>
                <TableCell align="right">Toplam</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const unitPrice = product.unit_price || product.price;
                const total = product.quantity * unitPrice;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={product.selected}
                        onChange={() => handleSelectChange(product.id)}
                      />
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category_name}</TableCell>
                    <TableCell>{product.brand || '-'}</TableCell>
                    <TableCell>
                      {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell align="right">{product.stock_quantity}</TableCell>
                    <TableCell align="right">
                      {unitPrice.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="text"
                        size="small"
                        value={formatQuantity(product.quantity)}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        disabled={!product.selected}
                        inputProps={{ 
                          style: { textAlign: 'right' },
                          placeholder: '0,00'
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {total.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={8} align="right">
                  <strong>Genel Toplam:</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>
                    {products
                      .filter(p => p.selected && p.quantity > 0)
                      .reduce((sum, product) => {
                        const unitPrice = product.unit_price || product.price;
                        return sum + product.quantity * unitPrice;
                      }, 0)
                      .toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                  </strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default BulkStockOut; 