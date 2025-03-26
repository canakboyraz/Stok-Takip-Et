import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      setProducts(data || []);

      // Calculate statistics
      const totalProducts = data?.length || 0;
      const lowStock = data?.filter(
        (p) => p.stock_quantity <= p.min_stock_level
      ).length || 0;
      const totalValue =
        data?.reduce((sum, p) => sum + p.price * p.stock_quantity, 0) || 0;

      setStats({
        totalProducts,
        lowStock,
        totalValue,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Toplam Ürün
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalProducts}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="error" gutterBottom>
              Kritik Stok
            </Typography>
            <Typography component="p" variant="h4">
              {stats.lowStock}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="success.main" gutterBottom>
              Toplam Değer
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalValue.toLocaleString('tr-TR')} TL
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Kritik Stok Seviyesindeki Ürünler
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ürün Kodu</TableCell>
                <TableCell>Ürün Adı</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell align="right">Mevcut Stok</TableCell>
                <TableCell align="right">Min. Stok</TableCell>
                <TableCell align="right">Fiyat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products
                .filter((p) => p.stock_quantity <= p.min_stock_level)
                .map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell align="right">{product.stock_quantity}</TableCell>
                    <TableCell align="right">{product.min_stock_level}</TableCell>
                    <TableCell align="right">{product.price} TL</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Dashboard; 