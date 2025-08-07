interface CustomError {
  message: string;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export const handleError = (error: any): CustomError => {
  console.error('Error occurred:', error);

  // Supabase hatalarını işle
  if (error?.message) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }

  // Network hatalarını işle
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
      code: 'NETWORK_ERROR'
    };
  }

  // Genel hata
  return {
    message: 'Beklenmeyen bir hata oluştu.',
    code: 'UNKNOWN_ERROR',
    details: error
  };
};

export const getErrorMessage = (error: any): string => {
  const handledError = handleError(error);
  return handledError.message;
}; 