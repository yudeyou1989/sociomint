/**
 * 输入验证Hook
 * 提供实时输入验证和表单验证功能
 */

import { useState, useCallback, useEffect } from 'react';
import { ValidationRule, ValidationResult, validateField, validateForm } from '@/utils/validation';

// 字段验证状态
interface FieldValidation {
  value: any;
  isValid: boolean;
  errors: string[];
  touched: boolean;
  sanitizedValue?: any;
}

// 表单验证状态
interface FormValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  sanitizedData: Record<string, any>;
}

// 验证配置
interface ValidationConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

// 单字段验证Hook
export const useFieldValidation = (
  initialValue: any = '',
  rules: ValidationRule,
  config: ValidationConfig = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = config;

  const [field, setField] = useState<FieldValidation>({
    value: initialValue,
    isValid: true,
    errors: [],
    touched: false,
    sanitizedValue: initialValue
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // 验证函数
  const validateValue = useCallback((value: any, shouldTouch = false) => {
    const result: ValidationResult = validateField(value, rules);
    
    setField(prev => ({
      ...prev,
      value,
      isValid: result.isValid,
      errors: result.errors,
      touched: shouldTouch || prev.touched,
      sanitizedValue: result.sanitizedValue
    }));

    return result;
  }, [rules]);

  // 防抖验证
  const debouncedValidate = useCallback((value: any, shouldTouch = false) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      validateValue(value, shouldTouch);
    }, debounceMs);

    setDebounceTimer(timer);
  }, [validateValue, debounceMs, debounceTimer]);

  // 处理值变化
  const handleChange = useCallback((value: any) => {
    setField(prev => ({ ...prev, value }));

    if (validateOnChange) {
      if (debounceMs > 0) {
        debouncedValidate(value);
      } else {
        validateValue(value);
      }
    }
  }, [validateOnChange, validateValue, debouncedValidate, debounceMs]);

  // 处理失焦
  const handleBlur = useCallback(() => {
    if (validateOnBlur) {
      validateValue(field.value, true);
    } else {
      setField(prev => ({ ...prev, touched: true }));
    }
  }, [validateOnBlur, validateValue, field.value]);

  // 手动验证
  const validate = useCallback(() => {
    return validateValue(field.value, true);
  }, [validateValue, field.value]);

  // 重置字段
  const reset = useCallback(() => {
    setField({
      value: initialValue,
      isValid: true,
      errors: [],
      touched: false,
      sanitizedValue: initialValue
    });
  }, [initialValue]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    ...field,
    handleChange,
    handleBlur,
    validate,
    reset,
    // 便捷属性
    hasError: !field.isValid && field.touched,
    errorMessage: field.touched ? field.errors[0] : undefined
  };
};

// 表单验证Hook
export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  rules: Record<keyof T, ValidationRule>,
  config: ValidationConfig = {}
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [validation, setValidation] = useState<FormValidation>({
    isValid: true,
    errors: {},
    touched: {},
    sanitizedData: initialData
  });

  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = config;

  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // 验证整个表单
  const validateForm = useCallback(() => {
    const result = validateForm(formData, rules);
    
    setValidation(prev => ({
      ...prev,
      isValid: result.isValid,
      errors: result.errors,
      sanitizedData: result.sanitizedData
    }));

    return result;
  }, [formData, rules]);

  // 验证单个字段
  const validateField = useCallback((fieldName: keyof T, value: any, shouldTouch = false) => {
    const rule = rules[fieldName];
    if (!rule) return { isValid: true, errors: [], sanitizedValue: value };

    const result = validateField(value, rule);
    
    setValidation(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: result.errors
      },
      touched: {
        ...prev.touched,
        [fieldName]: shouldTouch || prev.touched[fieldName as string]
      },
      sanitizedData: {
        ...prev.sanitizedData,
        [fieldName]: result.sanitizedValue
      },
      isValid: Object.keys(prev.errors).every(key => 
        key === fieldName ? result.isValid : (prev.errors[key]?.length || 0) === 0
      )
    }));

    return result;
  }, [rules]);

  // 防抖验证字段
  const debouncedValidateField = useCallback((fieldName: keyof T, value: any, shouldTouch = false) => {
    // 清除之前的定时器
    if (debounceTimers[fieldName as string]) {
      clearTimeout(debounceTimers[fieldName as string]);
    }

    const timer = setTimeout(() => {
      validateField(fieldName, value, shouldTouch);
    }, debounceMs);

    setDebounceTimers(prev => ({
      ...prev,
      [fieldName as string]: timer
    }));
  }, [validateField, debounceMs, debounceTimers]);

  // 处理字段变化
  const handleFieldChange = useCallback((fieldName: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    if (validateOnChange) {
      if (debounceMs > 0) {
        debouncedValidateField(fieldName, value);
      } else {
        validateField(fieldName, value);
      }
    }
  }, [validateOnChange, validateField, debouncedValidateField, debounceMs]);

  // 处理字段失焦
  const handleFieldBlur = useCallback((fieldName: keyof T) => {
    if (validateOnBlur) {
      validateField(fieldName, formData[fieldName], true);
    } else {
      setValidation(prev => ({
        ...prev,
        touched: {
          ...prev.touched,
          [fieldName as string]: true
        }
      }));
    }
  }, [validateOnBlur, validateField, formData]);

  // 重置表单
  const reset = useCallback(() => {
    setFormData(initialData);
    setValidation({
      isValid: true,
      errors: {},
      touched: {},
      sanitizedData: initialData
    });
  }, [initialData]);

  // 设置字段错误
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setValidation(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: [error]
      },
      isValid: false
    }));
  }, []);

  // 清除字段错误
  const clearFieldError = useCallback((fieldName: keyof T) => {
    setValidation(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldName as string];
      
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  // 获取字段验证状态
  const getFieldValidation = useCallback((fieldName: keyof T) => {
    const errors = validation.errors[fieldName as string] || [];
    const touched = validation.touched[fieldName as string] || false;
    
    return {
      isValid: errors.length === 0,
      errors,
      touched,
      hasError: errors.length > 0 && touched,
      errorMessage: touched ? errors[0] : undefined
    };
  }, [validation]);

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

  return {
    formData,
    validation,
    handleFieldChange,
    handleFieldBlur,
    validateForm,
    validateField,
    reset,
    setFieldError,
    clearFieldError,
    getFieldValidation,
    // 便捷属性
    isValid: validation.isValid,
    hasErrors: Object.keys(validation.errors).length > 0,
    sanitizedData: validation.sanitizedData
  };
};

export default {
  useFieldValidation,
  useFormValidation
};
