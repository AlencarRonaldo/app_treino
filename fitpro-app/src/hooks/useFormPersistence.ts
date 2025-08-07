import { useState, useEffect } from 'react';

interface UseFormPersistenceOptions {
  key: string;
  excludeFields?: string[]; // Campos que não devem ser salvos (ex: senhas)
  autoSave?: boolean; // Se deve salvar automaticamente
  clearOnSuccess?: boolean; // Se deve limpar após sucesso
}

export function useFormPersistence<T extends Record<string, any>>(
  initialState: T,
  options: UseFormPersistenceOptions
) {
  const { key, excludeFields = [], autoSave = true, clearOnSuccess = true } = options;
  
  const [formData, setFormData] = useState<T>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar dados salvos do localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } catch (error) {
      console.error(`Erro ao carregar dados salvos para ${key}:`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Salvar dados no localStorage
  useEffect(() => {
    if (!isLoaded) return; // Não salvar durante o carregamento inicial

    if (autoSave) {
      try {
        // Filtrar campos que não devem ser salvos
        const dataToSave = { ...formData };
        excludeFields.forEach(field => {
          delete dataToSave[field];
        });
        
        localStorage.setItem(key, JSON.stringify(dataToSave));
      } catch (error) {
        console.error(`Erro ao salvar dados para ${key}:`, error);
      }
    }
  }, [formData, key, autoSave, excludeFields, isLoaded]);

  const updateField = (name: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateForm = (updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const clearForm = () => {
    setFormData(initialState);
    localStorage.removeItem(key);
  };

  const clearOnSubmit = () => {
    if (clearOnSuccess) {
      clearForm();
    }
  };

  return {
    formData,
    updateField,
    updateForm,
    clearForm,
    clearOnSubmit,
    isLoaded
  };
}

// Hook específico para formulários de login
export function useLoginFormPersistence() {
  const { formData, updateField, clearForm, clearOnSubmit } = useFormPersistence(
    { email: '', password: '' },
    {
      key: 'loginFormData',
      excludeFields: ['password'], // Não salvar senha por segurança
      autoSave: true,
      clearOnSuccess: true
    }
  );

  return {
    email: formData.email,
    password: formData.password,
    setEmail: (email: string) => updateField('email', email),
    setPassword: (password: string) => updateField('password', password),
    clearForm,
    clearOnSubmit
  };
}

// Hook específico para formulários de cadastro
export function useSignupFormPersistence() {
  const { formData, updateField, updateForm, clearForm, clearOnSubmit } = useFormPersistence(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'personal',
      phone: ''
    },
    {
      key: 'signupFormData',
      excludeFields: ['password', 'confirmPassword'], // Não salvar senhas
      autoSave: true,
      clearOnSuccess: true
    }
  );

  return {
    formData,
    updateField,
    updateForm,
    clearForm,
    clearOnSubmit
  };
} 