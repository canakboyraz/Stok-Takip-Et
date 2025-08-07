import { createClient } from '@supabase/supabase-js';

// Güvenli environment variables okuma
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Zorunlu environment variables kontrolü
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables eksik!');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Tanımlı' : '❌ Tanımsız');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Tanımlı' : '❌ Tanımsız');
  throw new Error(
    'Supabase URL ve Anon Key environment variables (.env) dosyasında tanımlanmalıdır!\n' +
    'Lütfen .env dosyası oluşturun ve gerekli değerleri ekleyin.'
  );
}

// Debug: Sadece development'ta environment variables durumunu göster
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Debug: Environment Variables Status');
  console.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Loaded' : '❌ Missing');
}

console.log('✅ Supabase initialized successfully');
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 