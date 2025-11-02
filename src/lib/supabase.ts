import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Güvenli environment variables okuma
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Zorunlu environment variables kontrolü
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('❌ Supabase environment variables eksik!');
  logger.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Tanımlı' : '❌ Tanımsız');
  logger.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Tanımlı' : '❌ Tanımsız');
  throw new Error(
    'Supabase URL ve Anon Key environment variables (.env) dosyasında tanımlanmalıdır!\n' +
    'Lütfen .env dosyası oluşturun ve gerekli değerleri ekleyin.'
  );
}

// Debug: Sadece development'ta environment variables durumunu göster
logger.log('🔍 Debug: Environment Variables Status');
logger.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing');
logger.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Loaded' : '❌ Missing');

logger.log('✅ Supabase initialized successfully');
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 