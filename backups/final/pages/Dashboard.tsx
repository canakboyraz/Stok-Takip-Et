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
    expiringProducts: 0,
    totalValue: 0,
  });

  const isExpiringProduct = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 14; // Son 2 hafta
  };

  const getExpiryDateColor = (expiryDate: string | null) => {
    if (!expiryDate) return 'inherit';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'error.main'; // Kırmızı
    if (diffDays <= 14) return 'warning.main'; // Sarı
    return 'inherit';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        return;
      }
      
      console.log(`Fetching products for project ID: ${currentProjectId}`);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('project_id', parseInt(currentProjectId))
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      
      const productsWithCategory = (data || []).map(product => ({
        ...product,
        category_name: product.categories?.name
      }));
      
      setProducts(productsWithCategory);

      // Calculate statistics
      const totalProducts = productsWithCategory.length;
      const expiringProducts = productsWithCategory.filter(
        (p) => isExpiringProduct(p.expiry_date)
      ).length;
      const totalValue =
        productsWithCategory.reduce((sum, p) => sum + p.price * p.stock_quantity, 0);

      setStats({
        totalProducts,
        expiringProducts,
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
              Son Kullanma Tarihi Yaklaşan
            </Typography>
            <Typography component="p" variant="h4">
              {stats.expiringProducts}
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
          Son Kullanma Tarihi Yaklaşan Ürünler (Son 2 Hafta)
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ürün Adı</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell align="right">Stok Miktarı</TableCell>
                <TableCell align="right">Fiyat</TableCell>
                <TableCell>Son Kullanım Tarihi</TableCell>
                <TableCell>Kalan Gün</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products
                .filter((p) => isExpiringProduct(p.expiry_date))
                .map((product) => {
                  const expiry = new Date(product.expiry_date || '');
                  const today = new Date();
                  const diffTime = expiry.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell align="right">{product.stock_quantity}</TableCell>
                      <TableCell align="right">{product.price} TL</TableCell>
                      <TableCell sx={{ color: getExpiryDateColor(product.expiry_date) }}>
                        {formatDate(product.expiry_date)}
                      </TableCell>
                      <TableCell sx={{ color: getExpiryDateColor(product.expiry_date) }}>
                        {diffDays} gün
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Dashboard; 