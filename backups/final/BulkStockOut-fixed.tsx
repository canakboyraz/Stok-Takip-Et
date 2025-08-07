import React, { useState, useEffect } from 'react';
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
  }, [navigate]);

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
  }, []);

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
  }, [products, projectId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        setError('Proje seçilmemiş. Lütfen önce bir proje seçin.');
        navigate('/projects');
        return;
      }
      
      // Parse project ID
      const projectId = parseInt(currentProjectId);
      setProjectId(projectId);
      
      console.log(`Fetching products for project ID: ${projectId}`);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('project_id', projectId) // Filter by current project ID
        .order('name');

      if (error) throw error;

      const productsWithSelection = (data || []).map(product => ({
        ...product,
        category_name: product.categories?.name,
        quantity: 0,
        selected: false
      }));

      console.log(`Loaded ${productsWithSelection.length} products for project ID: ${projectId}`);
      
      // Log the products for debugging
      productsWithSelection.forEach(p => {
        console.log(`Product: ${p.id} (${p.name}), Project: ${p.project_id}`);
      });

      setProducts(productsWithSelection);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id: number, value: string) => {
    const quantity = parseInt(value) || 0;
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
          note: 'Toplu stok çıkışı',
          type: 'out',
          project_id: projectId
        });
        
      if (bulkMovementError) {
        console.error('Bulk movement error:', bulkMovementError);
        throw bulkMovementError;
      }

      console.log(`Bulk stock out completed with ID ${bulkId} and total cost ${totalCost}`);
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
                        type="number"
                        size="small"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        disabled={!product.selected}
                        inputProps={{ min: 0, max: product.stock_quantity }}
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