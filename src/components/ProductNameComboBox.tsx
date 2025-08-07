import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Box,
  Typography
} from '@mui/material';
import { supabase } from '../lib/supabase';

interface ProductTemplate {
  id: number;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  project_id?: number;
}

interface ProductNameComboBoxProps {
  value: string;
  onChange: (productName: string) => void;
  onCategoryChange?: (category: string, categoryId?: number) => void;
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

const ProductNameComboBox: React.FC<ProductNameComboBoxProps> = ({
  value,
  onChange,
  onCategoryChange,
  required = false,
  error = false,
  helperText = '',
  disabled = false
}) => {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchProductTemplates();
  }, []);

  useEffect(() => {
    if (value) {
      setInputValue(value);
      findAndUpdateCategory(value);
    }
  }, [value]);

  const findAndUpdateCategory = (productName: string) => {
    if (!onCategoryChange) return;

    const template = templates.find(t => t.name.toLowerCase() === productName.toLowerCase());
    if (template) {
      console.log(`📌 "${productName}" için kategori bulundu: ${template.category}`);
      // Capitalize the first letter of the category name
      const formattedCategory = capitalizeFirstLetter(template.category);
      onCategoryChange(formattedCategory);
    }
  };

  const fetchProductTemplates = async () => {
    try {
      setLoading(true);
      console.log("📋 Ürün şablonları yükleniyor...");
      
      // Get current project ID from localStorage
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        console.log("⚠️ Proje ID bulunamadı, şablonlar yüklenemedi");
        return;
      }
      
      // Hem genel şablonları (project_id null) hem de projeye özel şablonları getir
      const { data, error } = await supabase
        .from('product_templates')
        .select('*')
        .or(`project_id.is.null,project_id.eq.${parseInt(currentProjectId)}`);

      if (error) {
        console.error("❌ Ürün şablonları yüklenirken hata:", error);
        throw error;
      }
      
      console.log("✅ Yüklenen ürün şablonları:", data);
      setTemplates(data || []);
      
      const templateNames = (data || []).map(template => template.name);
      console.log("📝 Ürün isimleri:", templateNames);
      setOptions(templateNames);
    } catch (error) {
      console.error('Error fetching product templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (templates.length === 0 && !loading) {
      console.log("⚠️ Şablonlar yüklenemedi, artık varsayılan değerler kullanılmıyor");
      setOptions([]);
    }
  }, [templates, loading]);

  return (
    <Autocomplete
      freeSolo
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        console.log("🔄 Input değeri değişti:", newInputValue);
        // Capitalize the first letter and convert the rest to lowercase
        const formattedValue = capitalizeFirstLetter(newInputValue);
        setInputValue(formattedValue);
        onChange(formattedValue);
        
        findAndUpdateCategory(formattedValue);
      }}
      onChange={(_event, newValue, reason) => {
        if (newValue && reason === 'selectOption') {
          // Capitalize the first letter when a selection is made
          const formattedValue = capitalizeFirstLetter(newValue);
          onChange(formattedValue);
          findAndUpdateCategory(formattedValue);
        }
      }}
      options={options}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Ürün Adı"
          required={required}
          error={error}
          helperText={helperText}
          fullWidth
        />
      )}
      renderOption={(props, option) => {
        const template = templates.find(t => t.name === option);
        return (
          <Box component="li" {...props}>
            <Typography variant="body1">
              {option}
              {template && (
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  ({capitalizeFirstLetter(template.category)})
                </Typography>
              )}
            </Typography>
          </Box>
        );
      }}
      noOptionsText="Ürün şablonu bulunamadı"
      loadingText="Şablonlar yükleniyor..."
    />
  );
};

export default ProductNameComboBox; 