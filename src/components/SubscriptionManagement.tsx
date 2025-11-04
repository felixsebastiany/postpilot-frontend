import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  useCustomerSubscription, 
  useCancelSubscription,
  useUpgradeSubscription,
  useSubscriptionPlans,
  CustomerSubscription
} from '../hooks/useGraphQL';
import { toast } from 'react-hot-toast';

const SubscriptionManagement: React.FC = () => {
  const { data, loading, error, refetch } = useCustomerSubscription();
  const [cancelSubscription, { loading: cancelLoading }] = useCancelSubscription();
  const [upgradeSubscription, { loading: upgradeLoading }] = useUpgradeSubscription();
  const { data: plansData } = useSubscriptionPlans();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscription = data?.getCustomerSubscription;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'canceled':
        return <XCircleIcon className="h-5 w-5" />;
      case 'past_due':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <CalendarIcon className="h-5 w-5" />;
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      await cancelSubscription({
        variables: {
          input: {
            subscription_id: subscription.id,
            cancel_at_period_end: true
          }
        }
      });
      
      setShowCancelModal(false);
      refetch();
      toast.success('Assinatura será cancelada no final do período atual');
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
    }
  };

  const formatPaymentMethodLabel = (paymentMethod?: any): string => {
    if (!paymentMethod) return 'Não configurado';
    
    if (paymentMethod.card) {
      const brand = paymentMethod.card.brand || 'Cartão';
      const last4 = paymentMethod.card.last4 || '****';
      return `${brand.toUpperCase()} •••• ${last4}`;
    }
    
    return 'Método de pagamento';
  };

  const isBasicPlan = (): boolean => {
    if (!subscription) return false;
    return subscription.plan_name?.toLowerCase().includes('basic') || false;
  };

  const handleUpgradePlan = async () => {
    if (!subscription) return;

    try {
      // Find Pro plan with same billing period as current subscription
      const plans = plansData?.getSubscriptionPlans || [];
      const currentBillingPeriod = subscription.billing_period === 'monthly' ? 'monthly' : 'yearly';
      
      const proPlan = plans.find(plan => 
        plan.name.toLowerCase().includes('pro') && 
        plan.billing_period === currentBillingPeriod
      );

      if (!proPlan) {
        toast.error('Plano Pro não encontrado. Entre em contato com o suporte.');
        return;
      }

      const { data: upgradeData } = await upgradeSubscription({
        variables: {
          input: {
            subscription_id: subscription.id,
            product_id: proPlan.id,
            billing_period: currentBillingPeriod,
          }
        }
      });

      if (upgradeData?.upgradeSubscription?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = upgradeData.upgradeSubscription.checkout_url;
      } else {
        toast.error('Erro ao criar sessão de checkout. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer upgrade do plano:', error);
      // Error toast will be handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar dados da assinatura</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <CreditCardIcon />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma assinatura ativa</h3>
        <p className="mt-1 text-sm text-gray-500">
          Você não possui uma assinatura ativa no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {subscription.plan_name}
              </h2>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                  {getStatusIcon(subscription.status)}
                  <span className="ml-1 capitalize">{subscription.status}</span>
                </span>
                {subscription.cancel_at_period_end && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    Cancelará em {formatDate(subscription.current_period_end)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-white">
              <div className="text-3xl font-bold">
                {formatPrice(subscription.amount, subscription.currency)}
              </div>
              <div className="text-sm opacity-90">
                por {subscription.billing_period === 'monthly' ? 'mês' : 'ano'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Cobrança</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Próxima cobrança:</span>
                  <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Período atual:</span>
                  <span className="font-medium">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pagamento:</span>
                  <span className="font-medium">
                    {formatPaymentMethodLabel(subscription.payment_method)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pagamento</h3>
              {subscription.payment_method ? (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <CreditCardIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="font-medium">{formatPaymentMethodLabel(subscription.payment_method)}</div>
                    {subscription.payment_method.card && (
                      <div className="text-sm text-gray-600">
                        Expira em {subscription.payment_method.card.exp_month}/{subscription.payment_method.card.exp_year}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">Nenhum método de pagamento configurado</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {isBasicPlan() && (
                <button 
                  onClick={handleUpgradePlan}
                  disabled={upgradeLoading}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgradeLoading ? 'Carregando...' : 'Upgrade Plano'}
                </button>
              )}
              <button 
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                Cancelar Assinatura
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancelar Assinatura
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o final do período atual ({formatDate(subscription.current_period_end)}).
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelando...' : 'Cancelar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default SubscriptionManagement;
