import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types/database';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    code: '',
    category_id: 0,
    price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        console.error('Proje ID bulunamadı');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        console.error('Proje ID bulunamadı');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpen = () => {
    setEditMode(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      code: '',
      category_id: 0,
      price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
    });
    setOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditMode(true);
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      code: product.code,
      category_id: product.category_id,
      price: product.price,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level || 0,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      code: '',
      category_id: 0,
      price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
    });
  };

  const handleSubmit = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        console.error('Proje ID bulunamadı');
        return;
      }

      const productData = {
        ...newProduct,
        project_id: parseInt(currentProjectId)
      };

      if (editMode && editingProduct) {
        // Güncelleme işlemi
        const { data, error } = await supabase
          .from('products')
          .update({
            name: productData.name,
            code: productData.code,
            category_id: productData.category_id,
            price: productData.price,
            stock_quantity: productData.stock_quantity,
            min_stock_level: productData.min_stock_level,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id)
          .select(`
            *,
            categories:category_id (
              id,
              name
            )
          `);

        if (error) throw error;

        // Listeyi güncelle
        setProducts(products.map((p: Product) => 
          p.id === editingProduct.id ? data[0] : p
        ));
      } else {
        // Yeni ürün ekleme işlemi
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select(`
            *,
            categories:category_id (
              id,
              name
            )
          `);

        if (error) throw error;

        setProducts([data[0], ...products]);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ürünler</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Yeni Ürün Ekle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ürün Kodu</TableCell>
              <TableCell>Ürün Adı</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Fiyat</TableCell>
              <TableCell align="right">Stok Miktarı</TableCell>
              <TableCell align="right">Min. Stok Seviyesi</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.code}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.categories?.name || 'Kategori yok'}</TableCell>
                <TableCell align="right">{product.price} TL</TableCell>
                <TableCell align="right">{product.stock_quantity}</TableCell>
                <TableCell align="right">{product.min_stock_level || 0}</TableCell>
                <TableCell align="center">
                  <IconButton 
                    onClick={() => handleEdit(product)}
                    color="primary"
                    title="Düzenle"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ürün Adı"
            fullWidth
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Ürün Kodu"
            fullWidth
            value={newProduct.code}
            onChange={(e) =>
              setNewProduct({ ...newProduct, code: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Kategori</InputLabel>
            <Select
              value={newProduct.category_id || ''}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category_id: Number(e.target.value) })
              }
              label="Kategori"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Fiyat"
            type="number"
            fullWidth
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: Number(e.target.value) })
            }
          />
          <TextField
            margin="dense"
            label="Stok Miktarı"
            type="number"
            fullWidth
            value={newProduct.stock_quantity}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                stock_quantity: Number(e.target.value),
              })
            }
          />
          <TextField
            margin="dense"
            label="Min. Stok Seviyesi"
            type="number"
            fullWidth
            value={newProduct.min_stock_level}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                min_stock_level: Number(e.target.value),
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Products; 