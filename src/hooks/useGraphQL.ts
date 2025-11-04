import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  GET_CUSTOMER,
  IS_EMAIL_AVAILABLE,
  GENERATE_CUSTOMER_TOKEN,
  CREATE_CUSTOMER,
  UPDATE_CUSTOMER,
  REVOKE_CUSTOMER_TOKEN,
  REQUEST_PASSWORD_RESET_EMAIL,
  RESET_PASSWORD,
  CHANGE_CUSTOMER_PASSWORD,
  CREATE_CUSTOMER_ADDRESS,
  UPDATE_CUSTOMER_ADDRESS,
  DELETE_CUSTOMER_ADDRESS,
  GET_SUBSCRIPTION_PLANS,
  GET_CUSTOMER_SUBSCRIPTION,
  CREATE_SUBSCRIPTION,
  CANCEL_SUBSCRIPTION,
  GET_STRIPE_CONFIGURATION,
  CUSTOMER_CART,
  ADD_SIMPLE_PRODUCTS_TO_CART,
  SET_BILLING_ADDRESS_ON_CART,
  SET_PAYMENT_METHOD_ON_CART,
  PLACE_ORDER,
  CREATE_CHECKOUT_SESSION,
  GET_SAVED_PAYMENT_METHODS,
  CHANGE_PAYMENT_METHOD,
  UPGRADE_SUBSCRIPTION,
} from '../graphql/queries';
import {
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerAddressInput,
  CustomerToken,
  CustomerOutput,
  IsEmailAvailableOutput,
} from '../types/graphql';

// Hook para obter dados do customer logado
export const useCustomer = (options?: { skip?: boolean }) => {
  const result = useQuery<{ customer: Customer }>(GET_CUSTOMER, {
    errorPolicy: 'all',
    skip: options?.skip || false,
  });

  // Usar useEffect para tratar erros (substitui onError deprecated)
  useEffect(() => {
    if (result.error) {
      console.error('Erro ao buscar dados do customer:', result.error);
    }
  }, [result.error]);

  return result;
};

// Hook para fazer query manual do customer (usado após login)
export const useLazyCustomer = () => {
  return useLazyQuery<{ customer: Customer }>(GET_CUSTOMER, {
    errorPolicy: 'all',
  });
};

// Hook para verificar se email está disponível
export const useIsEmailAvailable = () => {
  return useLazyQuery<{ isEmailAvailable: IsEmailAvailableOutput }>(
    IS_EMAIL_AVAILABLE,
    {
      errorPolicy: 'all',
    }
  );
};

// Hook para gerar token de autenticação
export const useGenerateCustomerToken = () => {
  return useMutation<
    { generateCustomerToken: CustomerToken },
    { email: string; password: string }
  >(GENERATE_CUSTOMER_TOKEN, {
    errorPolicy: 'none', // Não propagar erros para o errorLink global
    onCompleted: (data: any) => {
      if (data.generateCustomerToken.token) {
        localStorage.setItem('magento_customer_token', data.generateCustomerToken.token);
        toast.success('🎉 Login realizado com sucesso! Bem-vindo de volta!');
      }
    },
    onError: (error: any) => {
      console.error('Erro no login:', error);
      
      let errorMessage = '❌ Credenciais inválidas. Verifique seu email e senha.';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const graphQLError = error.graphQLErrors[0];
        
        if (graphQLError.message.includes('Invalid login or password')) {
          errorMessage = '🔐 Email ou senha incorretos. Tente novamente.';
        } else if (graphQLError.message.includes('account is locked')) {
          errorMessage = '🔒 Conta bloqueada. Entre em contato com o suporte.';
        } else if (graphQLError.message.includes('account is disabled')) {
          errorMessage = '⛔ Conta desabilitada. Entre em contato com o suporte.';
        }
      } else if (error.networkError) {
        errorMessage = '🌐 Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast.error(errorMessage);
    },
  });
};

// Hook para criar customer
export const useCreateCustomer = () => {
  return useMutation<
    { createCustomerV2: CustomerOutput },
    { input: CustomerCreateInput }
  >(CREATE_CUSTOMER, {
    errorPolicy: 'none', // Não propagar erros para o errorLink global
    onCompleted: (data: any) => {
      if (data.createCustomerV2.customer) {
        toast.success('🎉 Conta criada com sucesso! Fazendo login automático...');
      }
    },
    onError: (error: any) => {
      console.error('Erro ao criar customer:', error);
      
      // Extrair mensagem específica do erro GraphQL
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const graphQLError = error.graphQLErrors[0];
        
        // Tratar erros específicos de senha
        if (graphQLError.message.includes('password needs at least 8 characters')) {
          errorMessage = '🔒 A senha deve ter pelo menos 8 caracteres.';
        } else if (graphQLError.message.includes('password')) {
          errorMessage = '🔒 Senha muito fraca. Use uma senha mais segura.';
        } else if (graphQLError.message.includes('Last Name') && graphQLError.message.includes('required')) {
          errorMessage = '👤 Por favor, digite seu nome completo (nome e sobrenome).';
        } else if (graphQLError.message.includes('First Name') && graphQLError.message.includes('required')) {
          errorMessage = '👤 Por favor, digite seu nome completo.';
        } else if (graphQLError.message.includes('email')) {
          errorMessage = '📧 Email inválido ou já está em uso.';
        } else if (graphQLError.message.includes('already exists')) {
          errorMessage = '👤 Este email já está cadastrado. Tente fazer login.';
        } else {
          // Usar a mensagem específica do GraphQL se disponível
          errorMessage = graphQLError.message;
        }
      } else if (error.networkError) {
        errorMessage = '🌐 Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast.error(errorMessage);
    },
  });
};

// Hook para atualizar customer
export const useUpdateCustomer = () => {
  return useMutation<
    { updateCustomerV2: CustomerOutput },
    { input: CustomerUpdateInput }
  >(UPDATE_CUSTOMER, {
    onCompleted: () => {
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar customer:', error);
      toast.error('Erro ao atualizar dados. Tente novamente.');
    },
  });
};

// Hook para revogar token
export const useRevokeCustomerToken = () => {
  return useMutation<{ revokeCustomerToken: { result: boolean } }>(
    REVOKE_CUSTOMER_TOKEN,
    {
      errorPolicy: 'none', // Não propagar erros para o errorLink global
      onCompleted: () => {
        localStorage.removeItem('magento_customer_token');
        localStorage.removeItem('postpilot_user');
        toast.success('👋 Logout realizado com sucesso! Até logo!');
      },
      onError: (error: any) => {
        console.error('Erro no logout:', error);
        // Mesmo com erro, limpar dados locais
        localStorage.removeItem('magento_customer_token');
        localStorage.removeItem('postpilot_user');
        toast.success('👋 Logout realizado com sucesso! Até logo!');
      },
    }
  );
};

// Hook para criar endereço
export const useCreateCustomerAddress = () => {
  return useMutation<
    { createCustomerAddress: Customer },
    { input: CustomerAddressInput }
  >(CREATE_CUSTOMER_ADDRESS, {
    onCompleted: () => {
      toast.success('Endereço criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar endereço:', error);
      toast.error('Erro ao criar endereço.');
    },
  });
};

// Hook para atualizar endereço
export const useUpdateCustomerAddress = () => {
  return useMutation<
    { updateCustomerAddress: Customer },
    { id: number; input: CustomerAddressInput }
  >(UPDATE_CUSTOMER_ADDRESS, {
    onCompleted: () => {
      toast.success('Endereço atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar endereço:', error);
      toast.error('Erro ao atualizar endereço.');
    },
  });
};

// Hook para deletar endereço
export const useDeleteCustomerAddress = () => {
  return useMutation<{ deleteCustomerAddress: boolean }, { id: number }>(
    DELETE_CUSTOMER_ADDRESS,
    {
      onCompleted: () => {
        toast.success('Endereço removido com sucesso!');
      },
      onError: (error: any) => {
        console.error('Erro ao deletar endereço:', error);
        toast.error('Erro ao remover endereço.');
      },
    }
  );
};

// Hook para solicitar reset de senha
export const useForgotPassword = () => {
  return useMutation<
    { requestPasswordResetEmail: boolean },
    { email: string }
  >(REQUEST_PASSWORD_RESET_EMAIL, {
    errorPolicy: 'none',
    onCompleted: () => {
      toast.success('📧 Email de redefinição enviado! Verifique sua caixa de entrada.');
    },
    onError: (error) => {
      console.error('Erro ao solicitar reset de senha:', error);
      if (error.message.includes('email')) {
        toast.error('Email não encontrado. Verifique se está correto.');
      } else {
        toast.error('Erro ao enviar email. Tente novamente.');
      }
    },
  });
};

// Hook para alterar senha do customer logado
export const useChangeCustomerPassword = () => {
  return useMutation<
    { changeCustomerPassword: Customer },
    { currentPassword: string; newPassword: string }
  >(CHANGE_CUSTOMER_PASSWORD, {
    errorPolicy: 'none',
    onCompleted: () => {
      toast.success('🔒 Senha alterada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao alterar senha:', error);
      if (error.message.includes('Invalid login or password')) {
        toast.error('🔒 Senha atual incorreta.');
      } else if (error.message.includes('password')) {
        toast.error('🔒 A nova senha deve ter pelo menos 8 caracteres.');
      } else if (error.message.includes('locked')) {
        toast.error('🔒 Conta bloqueada. Entre em contato com o suporte.');
      } else {
        toast.error('Erro ao alterar senha. Tente novamente.');
      }
    },
  });
};

// Hook para redefinir senha
export const useResetPassword = () => {
  return useMutation<
    { resetPassword: boolean },
    { email: string; resetPasswordToken: string; newPassword: string }
  >(RESET_PASSWORD, {
    errorPolicy: 'none',
    onCompleted: () => {
      // Toast de sucesso será exibido na página ResetPassword
    },
    onError: (error) => {
      console.error('Erro ao redefinir senha:', error);
      if (error.message.includes('token')) {
        toast.error('Token inválido ou expirado. Solicite um novo link.');
      } else if (error.message.includes('password')) {
        toast.error('🔒 A senha deve ter pelo menos 8 caracteres.');
      } else {
        toast.error('Erro ao redefinir senha. Tente novamente.');
      }
    },
  });
};

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  billing_period: string;
  description: string;
  features: string[];
  is_popular: boolean;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  label?: string;
  icon?: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface CustomerSubscription {
  id: string;
  status: string;
  plan_name: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  billing_period: string;
  cancel_at_period_end: boolean;
  payment_method?: PaymentMethod;
}

export interface CreateSubscriptionInput {
  product_id: string;
  payment_method_id: string;
  billing_period: string;
}

export interface CancelSubscriptionInput {
  subscription_id: string;
  cancel_at_period_end?: boolean;
}

export interface ChangePaymentMethodInput {
  subscription_id: string;
  payment_method_id: string;
}

export interface UpgradeSubscriptionInput {
  subscription_id: string;
  product_id: string;
  billing_period: string;
}

export interface CreateCheckoutSessionInput {
  order_number: string;
  product_id: string;
  billing_period: string;
}

export interface CheckoutSessionResult {
  checkout_url: string;
  session_id: string;
  price_id: string;
  amount: number;
  currency: string;
  product_id: string;
  billing_period: string;
}

// Subscription Hooks
export const useSubscriptionPlans = () => {
  return useQuery<{ getSubscriptionPlans: SubscriptionPlan[] }>(GET_SUBSCRIPTION_PLANS, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Erro ao buscar planos de assinatura:', error);
      toast.error('Erro ao carregar planos de assinatura');
    },
  });
};

export const useCustomerSubscription = () => {
  return useQuery<{ getCustomerSubscription: CustomerSubscription }>(GET_CUSTOMER_SUBSCRIPTION, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Erro ao buscar assinatura do cliente:', error);
    },
  });
};

export const useGetStripeConfiguration = () => {
  return useQuery<{ getStripeConfiguration: any }>(GET_STRIPE_CONFIGURATION, {
    errorPolicy: 'all',
  });
};

export const useCustomerCart = () => {
  return useQuery<{ 
    customerCart: { 
      id: string; 
      items: Array<{
        id: string;
        quantity: number;
        product: {
          sku: string;
        };
        prices?: {
          price: {
            value: number;
            currency: string;
          };
          row_total: {
            value: number;
            currency: string;
          };
        };
      }>; 
      available_payment_methods?: Array<{ code: string; title: string }>;
      prices?: {
        grand_total: {
          value: number;
          currency: string;
        };
      };
    } 
  }>(CUSTOMER_CART, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
  });
};

export const useAddSimpleProductsToCart = () => {
  return useMutation<any, { input: { cart_id: string; cart_items: Array<{ data: { sku: string; quantity: number } }> } }>(
    ADD_SIMPLE_PRODUCTS_TO_CART,
    {
      errorPolicy: 'none',
    }
  );
};

export const useSetBillingAddressOnCart = () => {
  return useMutation<any, { input: { cart_id: string; billing_address: any } }>(
    SET_BILLING_ADDRESS_ON_CART,
    {
      errorPolicy: 'none',
    }
  );
};

export const useSetPaymentMethodOnCart = () => {
  return useMutation<any, { input: { cart_id: string; payment_method: { code: string; stripe_payments?: { payment_method?: string; save_payment_method?: boolean } } } }>(
    SET_PAYMENT_METHOD_ON_CART,
    {
      errorPolicy: 'none',
    }
  );
};

export const usePlaceOrder = () => {
  return useMutation<{ placeOrder: { order?: { order_number: string; client_secret?: string }; orderV2?: { order_number: string }; errors: any[] } }, { input: { cart_id: string } }>(
    PLACE_ORDER,
    {
      errorPolicy: 'none',
    }
  );
};

export const useCreateCheckoutSession = () => {
  return useLazyQuery<{ createCheckoutSession: CheckoutSessionResult }, { input: CreateCheckoutSessionInput }>(
    CREATE_CHECKOUT_SESSION,
    {
      errorPolicy: 'none',
      fetchPolicy: 'network-only',
    }
  );
};

export const useCreateSubscription = () => {
  return useMutation<
    { createSubscription: CustomerSubscription },
    { input: CreateSubscriptionInput }
  >(CREATE_SUBSCRIPTION, {
    errorPolicy: 'none',
    onCompleted: () => {
      toast.success('🎉 Assinatura criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro ao criar assinatura. Tente novamente.');
    },
  });
};

export const useCancelSubscription = () => {
  return useMutation<
    { cancelSubscription: boolean },
    { input: CancelSubscriptionInput }
  >(CANCEL_SUBSCRIPTION, {
    errorPolicy: 'none',
    onCompleted: () => {
      toast.success('📋 Assinatura cancelada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error('Erro ao cancelar assinatura. Tente novamente.');
    },
  });
};

export const useGetSavedPaymentMethods = () => {
  return useQuery<{ getSavedPaymentMethods: PaymentMethod[] }>(GET_SAVED_PAYMENT_METHODS, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Erro ao buscar métodos de pagamento salvos:', error);
    },
  });
};

export const useChangePaymentMethod = () => {
  return useMutation<
    { changePaymentMethod: CustomerSubscription },
    { input: ChangePaymentMethodInput }
  >(CHANGE_PAYMENT_METHOD, {
    errorPolicy: 'none',
    onCompleted: () => {
      toast.success('✅ Método de pagamento alterado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao alterar método de pagamento:', error);
      toast.error('Erro ao alterar método de pagamento. Tente novamente.');
    },
  });
};

export const useUpgradeSubscription = () => {
  return useMutation<
    { upgradeSubscription: CheckoutSessionResult },
    { input: UpgradeSubscriptionInput }
  >(UPGRADE_SUBSCRIPTION, {
    errorPolicy: 'none',
    onError: (error) => {
      console.error('Erro ao fazer upgrade:', error);
      toast.error('Erro ao fazer upgrade do plano. Tente novamente.');
    },
  });
};