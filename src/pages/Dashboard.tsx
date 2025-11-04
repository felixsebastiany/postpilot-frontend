import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordForm from '../components/ChangePasswordForm';
import SubscriptionPlans from '../components/SubscriptionPlans';
import SubscriptionManagement from '../components/SubscriptionManagement';
import { useCustomerSubscription } from '../hooks/useGraphQL';
import { toast } from 'react-hot-toast';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';


const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { data: subscriptionData, refetch: refetchSubscription } = useCustomerSubscription();

  // Verificar se voltou do checkout Stripe com sucesso
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');
    
    if (subscriptionStatus === 'success') {
      toast.success('🎉 Parabéns! Sua assinatura está ativa!', { 
        id: 'subscription-success',
        duration: 5000 
      });
      // Recarregar assinatura
      refetchSubscription();
      // Mudar para aba de assinatura para mostrar o status atualizado
      setActiveTab('subscription');
      // Limpar parâmetro da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (subscriptionStatus === 'cancelled') {
      toast.error('Checkout cancelado. Você pode tentar novamente quando quiser.', {
        id: 'subscription-cancelled',
        duration: 4000
      });
      // Limpar parâmetro da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchSubscription]);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Visão Geral', id: 'overview', icon: HomeIcon },
    { name: 'Posts', id: 'posts', icon: PlusIcon },
    { name: 'Perfis Espelhados', id: 'mirrors', icon: UserGroupIcon },
    { name: 'Agendamento', id: 'schedule', icon: CalendarIcon },
    { name: 'Analytics', id: 'analytics', icon: ChartBarIcon },
    { name: 'Assinatura', id: 'subscription', icon: CreditCardIcon },
    { name: 'Conta', id: 'account', icon: CogIcon },
  ];

  const stats = [
    { name: 'Posts Hoje', value: '3', change: '+2', changeType: 'positive' },
    { name: 'Perfis Conectados', value: '2', change: '+1', changeType: 'positive' },
    { name: 'Engajamento', value: '4.2%', change: '+0.8%', changeType: 'positive' },
    { name: 'Seguidores', value: '1,234', change: '+12', changeType: 'positive' },
  ];

  const recentPosts = [
    {
      id: 1,
      content: 'Inspirado em @designerlife - Dicas de design para iniciantes',
      image: '/api/placeholder/300/200',
      status: 'published',
      time: '2 horas atrás',
      engagement: '24 likes, 3 comentários'
    },
    {
      id: 2,
      content: 'Espelhado de @photographypro - Técnicas de composição',
      image: '/api/placeholder/300/200',
      status: 'scheduled',
      time: 'Em 3 horas',
      engagement: '0 likes'
    },
    {
      id: 3,
      content: 'Baseado em @marketingguru - Estratégias de crescimento',
      image: '/api/placeholder/300/200',
      status: 'draft',
      time: 'Ontem',
      engagement: '0 likes'
    }
  ];

  const mirroredProfiles = [
    {
      id: 1,
      username: '@designerlife',
      followers: '45.2K',
      lastPost: '2 horas atrás',
      status: 'active',
      postsMirrored: 12
    },
    {
      id: 2,
      username: '@photographypro',
      followers: '23.1K',
      lastPost: '5 horas atrás',
      status: 'active',
      postsMirrored: 8
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Posts Recentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentPosts.map((post) => (
            <div key={post.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{post.content}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {post.time}
                    </span>
                    <span className="flex items-center">
                      {post.status === 'published' ? (
                        <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />
                      ) : post.status === 'scheduled' ? (
                        <ClockIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      ) : (
                        <SparklesIcon className="w-4 h-4 mr-1 text-gray-500" />
                      )}
                      {post.status === 'published' ? 'Publicado' : 
                       post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{post.engagement}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mirrored Profiles */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Perfis Espelhados</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mirroredProfiles.map((profile) => (
            <div key={profile.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{profile.username}</p>
                    <p className="text-sm text-gray-500">{profile.followers} seguidores</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{profile.postsMirrored} posts espelhados</p>
                  <p className="text-sm text-gray-500">Último post: {profile.lastPost}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubscription = () => {
    const hasActiveSubscription = subscriptionData?.getCustomerSubscription;
    
    if (hasActiveSubscription) {
      return <SubscriptionManagement />;
    } else {
      return <SubscriptionPlans />;
    }
  };

  const renderAccount = () => (
    <div className="space-y-6">
      {/* Informações da Conta */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Informações da Conta</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nome</p>
              <p className="text-sm text-gray-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ID da Conta</p>
              <p className="text-sm text-gray-900">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Membro desde</p>
              <p className="text-sm text-gray-900">Hoje</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ativo
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Plano</p>
              {subscriptionData?.getCustomerSubscription ? (
                <>
                  <p className="text-sm text-gray-900 font-semibold">
                    {subscriptionData.getCustomerSubscription.plan_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {subscriptionData.getCustomerSubscription.billing_period === 'yearly' ? 'Anual' : 'Mensal'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-900">Gratuito</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alterar Senha */}
      <ChangePasswordForm />

      {/* Funcionalidades Futuras */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Gerenciar Conta</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Funcionalidades de gerenciamento de conta disponíveis.</p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              Visualizar informações da conta
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              Alterar senha
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
              Editar perfil (em breve)
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
              Configurações de notificação (em breve)
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'posts':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Posts</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      case 'mirrors':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Perfis Espelhados</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      case 'schedule':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agendamento</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      case 'subscription':
        return renderSubscription();
      case 'account':
        return renderAccount();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-primary-600">PostPilot</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`${
                    activeTab === item.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
                >
                  <item.icon className="mr-4 h-6 w-6" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-primary-600">PostPilot</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.id)}
                    className={`${
                      activeTab === item.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {navigation.find(item => item.id === activeTab)?.name}
                    </h1>
                  </nav>
                </div>
              </div>
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
