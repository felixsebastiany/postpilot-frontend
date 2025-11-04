import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import toast from 'react-hot-toast';

// URL do GraphQL do Magento (ajuste conforme sua configuração)
const GRAPHQL_ENDPOINT = process.env.REACT_APP_MAGENTO_GRAPHQL_URL || 'http://srv791323.hstgr.cloud/graphql';

// Link HTTP
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Incluir cookies se necessário
  fetchOptions: {
    mode: 'cors', // Forçar modo CORS
  },
});

// Link de autenticação
const authLink = setContext((_, { headers }: any) => {
  // Obter token do localStorage
  const token = localStorage.getItem('magento_customer_token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    }
  };
});

// Link de tratamento de erros
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }: any) => {
  console.log('GraphQL Error Details:', { graphQLErrors, networkError, operation });
  
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }: any) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Não mostrar toast para mutations - elas são tratadas pelos hooks específicos
      const isMutation = operation?.query?.definitions?.[0]?.operation === 'mutation';
      
      // Só mostrar toast para queries, não para mutations
      if (!isMutation) {
        toast.error(`Erro GraphQL: ${message}`);
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError);
    
    // Verificar se é erro de CORS
    if (networkError.message?.includes('CORS') || networkError.message?.includes('cors')) {
      toast.error('Erro de CORS. Verifique a configuração do servidor.');
    }
    // Verificar se é erro de conexão
    else if (networkError.message?.includes('Failed to fetch') || networkError.message?.includes('NetworkError')) {
      toast.error('Erro de conexão. Verifique se o servidor está rodando.');
    }
    // Verificar se é erro de autenticação
    else if ((networkError as any).statusCode === 401) {
      // Temporariamente desabilitado o redirecionamento automático
      // para debug do problema de redirecionamento na criação de conta
      console.log('401 Error - not redirecting for debug');
      toast.error('Erro de autenticação. Verifique suas credenciais.');
    } else {
      toast.error(`Erro de conexão: ${networkError.message || 'Tente novamente.'}`);
    }
  }
});

// Criar cliente Apollo
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Customer: {
        fields: {
          addresses: {
            merge(existing: any = [], incoming: any) {
              return incoming;
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
