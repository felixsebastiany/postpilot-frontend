import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGenerateCustomerToken, useCreateCustomer, useRevokeCustomerToken, useCustomer, useLazyCustomer } from '../hooks/useGraphQL';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Verificar se há token para decidir se deve fazer a query
  const hasToken = !!localStorage.getItem('magento_customer_token');
  
  // GraphQL hooks
  const [generateToken] = useGenerateCustomerToken();
  const [createCustomer] = useCreateCustomer();
  const [revokeToken] = useRevokeCustomerToken();
  const { data: customerData, loading: customerLoading } = useCustomer({ skip: !hasToken });
  const [getCustomer] = useLazyCustomer();

  // Verificar se há token salvo e buscar dados do customer
  useEffect(() => {
    const savedToken = localStorage.getItem('magento_customer_token');
    const savedUser = localStorage.getItem('postpilot_user');
    
    if (savedToken && savedUser) {
      // Se há token e usuário salvos, definir o usuário imediatamente
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setLoading(false);
      } catch (error) {
        // Dados corrompidos, limpar
        localStorage.removeItem('magento_customer_token');
        localStorage.removeItem('postpilot_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Atualizar user quando dados do customer mudarem (apenas se há token)
  useEffect(() => {
    if (hasToken && customerData?.customer && !customerLoading && customerData.customer.email) {
      const customer = customerData.customer;
      const userId = customer.id ? customer.id.toString() : customer.email;
      const userData = {
        id: userId,
        email: customer.email,
        name: `${customer.firstname} ${customer.lastname}`.trim()
      };
      setUser(userData);
      localStorage.setItem('postpilot_user', JSON.stringify(userData));
    }
  }, [customerData, customerLoading, hasToken]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const result = await generateToken({
        variables: { email, password }
      });

      if (result.data?.generateCustomerToken.token) {
        // Token salvo automaticamente pelo hook
        // Aguardar um pouco para o token ser processado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Buscar dados do customer usando lazy query
        const customerResult = await getCustomer();
        
        if (customerResult.data?.customer && customerResult.data.customer.email) {
          const customer = customerResult.data.customer;
          // Usar email como ID temporário se o ID estiver null
          const userId = customer.id ? customer.id.toString() : customer.email;
          const userData = {
            id: userId,
            email: customer.email,
            name: `${customer.firstname} ${customer.lastname}`.trim()
          };
          setUser(userData);
          localStorage.setItem('postpilot_user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Dividir nome em primeiro e último nome
      const nameParts = name.trim().split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || 'Usuário'; // Valor padrão se não houver sobrenome

      const result = await createCustomer({
        variables: {
          input: {
            firstname,
            lastname,
            email,
            password,
            is_subscribed: false
          }
        }
      });

      // Verificar se há erros no resultado
      if (result.errors) {
        return false; // Retornar false indicando erro
      }

      if (result.data?.createCustomerV2.customer) {
        // Fazer login automático após registro bem-sucedido
        try {
          const loginResult = await generateToken({
            variables: { email, password }
          });

          if (loginResult.data?.generateCustomerToken.token) {
            // Aguardar um pouco para o token ser processado
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Buscar dados do customer usando lazy query
            const customerResult = await getCustomer();
            
            if (customerResult.data?.customer && customerResult.data.customer.email) {
              const customer = customerResult.data.customer;
              // Usar email como ID temporário se o ID estiver null
              const userId = customer.id ? customer.id.toString() : customer.email;
              const userData = {
                id: userId,
                email: customer.email,
                name: `${customer.firstname} ${customer.lastname}`.trim()
              };
              setUser(userData);
              localStorage.setItem('postpilot_user', JSON.stringify(userData));
              
              // Mostrar toast de boas-vindas
              const { toast } = await import('react-hot-toast');
              toast.success(`🎉 Bem-vindo ao PostPilot, ${userData.name}!`);
            } else {
              // silent
            }
          } else {
            // silent
          }
        } catch (loginError) {
          // Mesmo com erro no login, a conta foi criada com sucesso
        }
        
        return true; // Retornar true indicando sucesso
      } else {
        return false; // Retornar false indicando erro
      }
    } catch (error) {
      // Não fazer throw do erro - deixar o hook tratar a notificação
      // O erro já é tratado pelo hook useCreateCustomer
      return false; // Retornar false indicando erro
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await revokeToken();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('postpilot_user');
      localStorage.removeItem('magento_customer_token');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading: loading || customerLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
