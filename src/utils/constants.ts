// API ve Database sabitleri
export const DB_TABLES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  STOCK_MOVEMENTS: 'stock_movements',
  PROJECTS: 'projects',
  PERSONNEL: 'personnel',
  EXPENSES: 'expenses',
  RECIPES: 'recipes',
  MENUS: 'menus',
  CUSTOMERS: 'customers',
  EVENTS: 'events',
  TIMESHEETS: 'timesheets'
} as const;

// Stok hareket tipleri
export const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out'
} as const;

// Kullanıcı rolleri
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff'
} as const;

// Menü kategorileri
export const RECIPE_CATEGORIES = {
  STARTER: 'starter',
  MAIN: 'main',
  DESSERT: 'dessert',
  BEVERAGE: 'beverage',
  SIDE: 'side'
} as const;

// Event durumları
export const EVENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// Personel durumları
export const TIMESHEET_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half_day',
  LEAVE: 'leave',
  HOLIDAY: 'holiday'
} as const;

// UI sabitleri
export const UI_CONSTANTS = {
  ITEMS_PER_PAGE: 10,
  EXPIRY_WARNING_DAYS: 14,
  EXPIRY_CRITICAL_DAYS: 7,
  DEBOUNCE_DELAY: 300,
  MIN_STOCK_LEVEL: 10
} as const;

// Tarih formatları
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd.MM.yyyy HH:mm'
} as const;

// Para birimi
export const CURRENCY = {
  SYMBOL: '₺',
  CODE: 'TRY',
  LOCALE: 'tr-TR'
} as const; 