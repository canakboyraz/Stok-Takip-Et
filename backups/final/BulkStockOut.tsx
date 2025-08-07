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
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('name');

      if (error) throw error;

      const productsWithSelection = (data || []).map(product => ({
        ...product,
        category_name: product.categories?.name,
        quantity: 0,
        selected: false
      }));

      setProducts(productsWithSelection);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Ürünler yüklenirken bir hata oluştu');
    }
  };

  const handleQuantityChange = (id: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setProducts(products.map(product => 
      product.id === id ? { ...product, quantity } : product
    ));
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

      const selectedProducts = products.filter(p => p.selected && p.quantity > 0);
      
      if (selectedProducts.length === 0) {
        setError('Lütfen en az bir ürün seçin ve miktar girin');
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
          bulk_id: bulkId
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

        // Ürün stoğunu güncelle
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - product.quantity })
          .eq('id', product.id);

        if (updateError) {
          console.error('Stok güncelleme hatası:', updateError);
          throw updateError;
        }
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>Ürün Adı</TableCell>
              <TableCell>Kategori</TableCell>
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
              <TableCell colSpan={6} align="right">
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
    </Container>
  );
};

export default BulkStockOut; 