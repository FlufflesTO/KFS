/**
 * Input validation utilities
 * Provides comprehensive input validation for security hardening
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  } else if (email.length > 254) {
    errors.push({ field: 'email', message: 'Email too long' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates phone number format
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: ValidationError[] = [];
  // South African phone number format validation
  const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
  
  if (phone && !phoneRegex.test(phone.replace(/\s+/g, ''))) {
    errors.push({ field: 'phone', message: 'Invalid South African phone number format' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates name format
 */
export function validateName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
  } else if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    errors.push({ field: 'name', message: 'Name contains invalid characters' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates message content
 */
export function validateMessage(message: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!message) {
    errors.push({ field: 'message', message: 'Message is required' });
  } else if (message.length < 10) {
    errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
  } else if (message.length > 2000) {
    errors.push({ field: 'message', message: 'Message must be less than 2000 characters' });
  } else if (containsSuspiciousContent(message)) {
    errors.push({ field: 'message', message: 'Message contains suspicious content' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates subject
 */
export function validateSubject(subject: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!subject) {
    errors.push({ field: 'subject', message: 'Subject is required' });
  } else if (subject.length < 3) {
    errors.push({ field: 'subject', message: 'Subject must be at least 3 characters' });
  } else if (subject.length > 100) {
    errors.push({ field: 'subject', message: 'Subject must be less than 100 characters' });
  } else if (containsSuspiciousContent(subject)) {
    errors.push({ field: 'subject', message: 'Subject contains suspicious content' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string): ValidationResult {
  const errors: ValidationError[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    errors.push({ field: 'id', message: 'Invalid ID format' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates financial amounts
 */
export function validateAmount(amount: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (amount < 0) {
    errors.push({ field: 'amount', message: 'Amount cannot be negative' });
  } else if (isNaN(amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number' });
  } else if (amount > 10000000) { // 10 million ZAR max
    errors.push({ field: 'amount', message: 'Amount exceeds maximum limit' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates date format
 */
export function validateDate(dateString: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!dateString) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      errors.push({ field: 'date', message: 'Invalid date format' });
    } else {
      // Check if date is not too far in the past or future
      const now = new Date();
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - 10); // Allow dates up to 10 years ago
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() + 2); // Allow dates up to 2 years in future
      
      if (date < minDate || date > maxDate) {
        errors.push({ field: 'date', message: 'Date is outside valid range' });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Checks for suspicious content patterns
 */
function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /eval\(/i,
    /expression\(/i,
    /alert\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /__proto__/i,
    /constructor/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Validates an entire form submission
 */
export function validateContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  consent: boolean;
  popia_consent: boolean;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate each field
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) errors.push(...nameValidation.errors);
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) errors.push(...emailValidation.errors);
  
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) errors.push(...phoneValidation.errors);
  }
  
  const subjectValidation = validateSubject(data.subject);
  if (!subjectValidation.isValid) errors.push(...subjectValidation.errors);
  
  const messageValidation = validateMessage(data.message);
  if (!messageValidation.isValid) errors.push(...messageValidation.errors);
  
  // Validate consent checkboxes
  if (!data.consent) {
    errors.push({ field: 'consent', message: 'General consent is required' });
  }
  
  if (!data.popia_consent) {
    errors.push({ field: 'popia_consent', message: 'POPIA consent is required' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}