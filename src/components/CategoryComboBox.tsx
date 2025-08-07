import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Box,
  Typography
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { Category } from '../types/database';

interface CategoryComboBoxProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

// Helper function to capitalize the first letter and convert the rest to lowercase
const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const CategoryComboBox: React.FC<CategoryComboBoxProps> = ({
  value,
  onChange,
  required = false,
  error = false,
  helperText = '',
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Find selected category when value changes
  useEffect(() => {
    if (value !== null && categories.length > 0) {
      const category = categories.find(c => c.id === value);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [value, categories]);

  const fetchCategories = async () => {
    try {
      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        return;
      }
      
      setLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .order('name');

      if (error) throw error;
      
      // Kategorileri yükle
      setCategories(data || []);
      
      // Eğer aynı isimli kategoriler varsa, kategorileri yüklendikten sonra
      // Aynı isimli kategorileri tespit et
      const categoryNameCounts: Record<string, number> = {};
      data?.forEach(cat => {
        categoryNameCounts[cat.name] = (categoryNameCounts[cat.name] || 0) + 1;
      });
      
      // Loglama yap
      const duplicateCategories = Object.entries(categoryNameCounts)
        .filter(([_, count]) => count > 1)
        .map(([name]) => name);
      
      if (duplicateCategories.length > 0) {
        console.log('Aynı isimli kategoriler tespit edildi:', duplicateCategories);
      }
      
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: Category | null) => {
    setSelectedCategory(newValue);
    onChange(newValue ? newValue.id : null);
  };

  // Kategori adlarını görüntülerken ID ekleyerek benzer isimlileri ayırt et
  const getOptionLabel = (option: Category) => {
    const hasDuplicate = categories.filter(c => c.name === option.name).length > 1;
    const categoryName = capitalizeFirstLetter(option.name);
    return hasDuplicate 
      ? `${categoryName} (#${option.id})` 
      : categoryName;
  };

  return (
    <Autocomplete
      value={selectedCategory}
      onChange={handleChange}
      options={categories}
      getOptionLabel={getOptionLabel}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Kategori"
          required={required}
          error={error}
          helperText={helperText}
          fullWidth
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Typography variant="body1">
            {capitalizeFirstLetter(option.name)}
          </Typography>
          {categories.filter(c => c.name === option.name).length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (#{option.id})
            </Typography>
          )}
        </Box>
      )}
      noOptionsText="Kategori bulunamadı"
      loadingText="Kategoriler yükleniyor..."
    />
  );
};

export default CategoryComboBox; 