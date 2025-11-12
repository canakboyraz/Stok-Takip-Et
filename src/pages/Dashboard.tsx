import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { handleError, getErrorMessage } from '../utils/errorHandler';
import { UI_CONSTANTS, DB_TABLES, CURRENCY } from '../utils/constants';
import useLocalStorage from '../hooks/useLocalStorage';

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    expiringProducts: 0,
    totalValue: 0,
  });

  // localStorage hook kullanımı
  const [currentProjectId] = useLocalStorage<string | null>('currentProjectId', null);

  const isExpiringProduct = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= UI_CONSTANTS.EXPIRY_WARNING_DAYS;
  };

  const getExpiryDateColor = (expiryDate: string | null) => {
    if (!expiryDate) return 'inherit';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= UI_CONSTANTS.EXPIRY_CRITICAL_DAYS) return 'error.main';
    if (diffDays <= UI_CONSTANTS.EXPIRY_WARNING_DAYS) return 'warning.main';
    return 'inherit';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(CURRENCY.LOCALE);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString(CURRENCY.LOCALE)} ${CURRENCY.SYMBOL}`;
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentProjectId) {
        throw new Error('Proje seçilmemiş. Lütfen bir proje seçin.');
      }

      console.log(`Fetching products for project ID: ${currentProjectId}`);

      const { data, error: supabaseError } = await supabase
        .from(DB_TABLES.PRODUCTS)
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('project_id', parseInt(currentProjectId))
        .order('expiry_date', { ascending: true });

      if (supabaseError) throw supabaseError;

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
      const totalValue = productsWithCategory.reduce(
        (sum, p) => sum + p.price * p.stock_quantity,
        0
      );

      setStats({
        totalProducts,
        expiringProducts,
        totalValue,
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Dashboard error:', handleError(err));
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
              {formatCurrency(stats.totalValue)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Son Kullanma Tarihi Yaklaşan Ürünler ({UI_CONSTANTS.EXPIRY_WARNING_DAYS} Gün)
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
                      <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                      <TableCell sx={{ color: getExpiryDateColor(product.expiry_date) }}>
                        {formatDate(product.expiry_date)}
                      </TableCell>
                      <TableCell sx={{ color: getExpiryDateColor(product.expiry_date) }}>
                        {diffDays} gün
                      </TableCell>
                    </TableRow>
                  );
                })}
              {products.filter((p) => isExpiringProduct(p.expiry_date)).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Son kullanma tarihi yaklaşan ürün bulunmuyor.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Dashboard; 