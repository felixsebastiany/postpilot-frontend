import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { 
  useSubscriptionPlans, 
  SubscriptionPlan, 
  useCustomer,
  useCustomerCart,
  useAddSimpleProductsToCart,
  useSetBillingAddressOnCart,
  useSetPaymentMethodOnCart,
  usePlaceOrder,
  useCreateCheckoutSession
} from '../hooks/useGraphQL';
import { toast } from 'react-hot-toast';

interface SubscriptionPlansProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan }) => {
  const { data, loading, error } = useSubscriptionPlans();
  const { data: customerData } = useCustomer();
  const { data: cartData, refetch: refetchCart } = useCustomerCart();
  
  const [addSimpleProductsToCart] = useAddSimpleProductsToCart();
  const [setBillingAddressOnCart] = useSetBillingAddressOnCart();
  const [setPaymentMethodOnCart] = useSetPaymentMethodOnCart();
  const [placeOrder] = usePlaceOrder();
  const [createCheckoutSession] = useCreateCheckoutSession();
  
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Step 1: Get or create cart
      let cartId = cartData?.customerCart?.id;
      if (!cartId) {
        await refetchCart();
        cartId = cartData?.customerCart?.id;
        if (!cartId) {
          throw new Error('Não foi possível criar o carrinho');
        }
      }

      // Step 2: Add product to cart
      const { data: addProductData } = await addSimpleProductsToCart({
        variables: {
          input: {
            cart_id: cartId,
            cart_items: [{
              data: {
                sku: plan.sku,
                quantity: 1,
              }
            }]
          }
        }
      });

      // Verify product was added with correct price
      const cartItem = addProductData?.addSimpleProductsToCart?.cart?.items?.[0];
      const itemPrice = cartItem?.prices?.price?.value || 0;
      const cartTotal = addProductData?.addSimpleProductsToCart?.cart?.prices?.grand_total?.value || 0;
      
      if (itemPrice === 0) {
        throw new Error(`Produto adicionado ao carrinho com preço zerado. Verifique se o produto "${plan.sku}" tem preço configurado no Magento.`);
      }
      
      console.log(`Produto adicionado com preço: ${itemPrice}, Total do carrinho: ${cartTotal}`);

      // Step 3: Set billing address (always set a complete address)
      const customer = customerData?.customer;
      
      // Try to use customer's address first (if complete)
      let billingAddressSet = false;
      if (customer?.addresses && customer.addresses.length > 0) {
        const billingAddress = customer.addresses.find((addr: any) => addr.default_billing) || customer.addresses[0];
        
        if (billingAddress?.street && billingAddress?.city && billingAddress?.postcode && billingAddress?.country_code) {
          try {
            await setBillingAddressOnCart({
              variables: {
                input: {
                  cart_id: cartId,
                  billing_address: {
                    customer_address_id: billingAddress.id,
                  }
                }
              }
            });
            billingAddressSet = true;
          } catch (error) {
            // If customer_address_id fails, will set address manually below
            console.log('Failed to use customer_address_id, setting address manually');
          }
        }
      }
      
      // If billing address not set, set it manually with complete required fields
      if (!billingAddressSet) {
        const address = customer?.addresses?.[0];
        const streetArray = address?.street ? 
          (Array.isArray(address.street) ? address.street : [address.street]) : 
          ['Rua'];
        
        await setBillingAddressOnCart({
          variables: {
            input: {
              cart_id: cartId,
              billing_address: {
                address: {
                  firstname: customer?.firstname || address?.firstname || 'Cliente',
                  lastname: customer?.lastname || address?.lastname || 'PostPilot',
                  street: streetArray,
                  city: address?.city || 'São Paulo',
                  postcode: address?.postcode || '01310-100',
                  country_code: address?.country_code || 'BR',
                  telephone: address?.telephone || '11999999999',
                  region: address?.region?.region || 'SP',
                },
              }
            }
          }
        });
      }

      // Step 4: Recalculate cart totals after setting billing address
      // This ensures taxes and totals are calculated correctly
      await refetchCart();

      // Step 5: Set payment method (stripe_payments without token - Stripe Checkout will collect)
      // First, check available payment methods
      const { data: cartDataAfterProduct } = await refetchCart();
      const availablePaymentMethods = cartDataAfterProduct?.customerCart?.available_payment_methods || [];
      
      // Verify cart total is still correct
      const cartTotalAfterAddress = cartDataAfterProduct?.customerCart?.prices?.grand_total?.value || 0;
      if (cartTotalAfterAddress === 0 && itemPrice > 0) {
        console.warn('Cart total is zero after setting address, but product price is:', itemPrice);
      }
      
      // Find a Stripe payment method
      const stripePaymentMethod = availablePaymentMethods.find(
        (method: any) => 
          method.code === 'stripe_payments' || 
          method.code === 'stripe_payments_subscriptions' ||
          method.code === 'stripe_payments_checkout'
      );
      
      if (!stripePaymentMethod) {
        throw new Error('Método de pagamento Stripe não está disponível. Por favor, verifique a configuração.');
      }

      // Set payment method
      await setPaymentMethodOnCart({
        variables: {
          input: {
            cart_id: cartId,
            payment_method: {
              code: stripePaymentMethod.code,
            }
          }
        }
      });

      // Step 6: Final cart recalculation before placing order
      // This ensures all totals are correct before order creation
      const { data: finalCartData } = await refetchCart();
      const finalCartTotal = finalCartData?.customerCart?.prices?.grand_total?.value || 0;
      
      if (finalCartTotal === 0) {
        throw new Error('Total do carrinho está zerado. Não é possível criar a order. Verifique se o produto tem preço configurado.');
      }
      
      console.log(`Total final do carrinho antes de criar order: ${finalCartTotal}`);

      // Step 7: Place order (creates order in pending_payment status)
      const { data: orderData } = await placeOrder({
        variables: {
          input: {
            cart_id: cartId,
          }
        }
      });

      const orderNumber = orderData?.placeOrder?.order?.order_number || orderData?.placeOrder?.orderV2?.order_number;

      if (!orderNumber) {
        const errorMessage = orderData?.placeOrder?.errors?.[0]?.message || 'Erro desconhecido';
        throw new Error('Erro ao criar pedido: ' + errorMessage);
      }

      // Step 8: Create checkout session with order number
      const { data: checkoutData } = await createCheckoutSession({
        variables: {
          input: {
            order_number: orderNumber,
            product_id: plan.id,
            billing_period: plan.billing_period,
          },
        },
      });

      if (checkoutData?.createCheckoutSession?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutData.createCheckoutSession.checkout_url;
      } else {
        toast.error('Erro ao criar sessão de checkout. Tente novamente.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Erro no processo de checkout:', error);
      toast.error(error.message || 'Erro ao iniciar checkout. Tente novamente.');
      setIsProcessing(false);
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
        <p className="text-red-600">Erro ao carregar planos de assinatura</p>
      </div>
    );
  }

  const plans = data?.getSubscriptionPlans || [];
  
  // Group plans by type (Basic/Pro)
  const basicPlans = plans.filter(plan => plan.name.toLowerCase().includes('basic'));
  const proPlans = plans.filter(plan => plan.name.toLowerCase().includes('pro'));

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const getSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha seu plano PostPilot
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Automatize seus posts no Instagram com nossa IA avançada
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className={`text-sm font-medium ${selectedBillingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Mensal
          </span>
          <button
            onClick={() => setSelectedBillingPeriod(selectedBillingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              selectedBillingPeriod === 'yearly' ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                selectedBillingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${selectedBillingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Anual
            {selectedBillingPeriod === 'yearly' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Economize até 20%
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Basic Plan */}
        {basicPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Basic</h3>
              <p className="text-gray-600 mb-6">Perfeito para começar</p>
              
              {(() => {
                const plan = basicPlans.find(p => p.billing_period === selectedBillingPeriod) || basicPlans[0];
                return (
                  <div className="mb-8">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="text-gray-600">
                      por {selectedBillingPeriod === 'monthly' ? 'mês' : 'ano'}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => {
                  const plan = basicPlans.find(p => p.billing_period === selectedBillingPeriod) || basicPlans[0];
                  handlePlanSelection(plan);
                }}
                disabled={isProcessing}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecionando...
                  </>
                ) : (
                  'Escolher Basic'
                )}
              </button>
            </div>

            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4">Inclui:</h4>
              <ul className="space-y-3">
                {(() => {
                  const plan = basicPlans.find(p => p.billing_period === selectedBillingPeriod) || basicPlans[0];
                  return plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Pro Plan */}
        {proPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative bg-white rounded-2xl shadow-xl border-2 border-primary-500 p-8"
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                <StarIcon className="h-4 w-4 mr-1" />
                Mais Popular
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Pro</h3>
              <p className="text-gray-600 mb-6">Para profissionais sérios</p>
              
              {(() => {
                const plan = proPlans.find(p => p.billing_period === selectedBillingPeriod) || proPlans[0];
                const monthlyPlan = proPlans.find(p => p.billing_period === 'monthly');
                const yearlyPlan = proPlans.find(p => p.billing_period === 'yearly');
                
                return (
                  <div className="mb-8">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="text-gray-600">
                      por {selectedBillingPeriod === 'monthly' ? 'mês' : 'ano'}
                    </div>
                    {selectedBillingPeriod === 'yearly' && monthlyPlan && yearlyPlan && (
                      <div className="mt-2 text-sm text-green-600">
                        Economize {formatPrice(
                          getSavings(monthlyPlan.price, yearlyPlan.price).amount,
                          plan.currency
                        )} ({getSavings(monthlyPlan.price, yearlyPlan.price).percentage}%)
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => {
                  const plan = proPlans.find(p => p.billing_period === selectedBillingPeriod) || proPlans[0];
                  handlePlanSelection(plan);
                }}
                disabled={isProcessing}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecionando...
                  </>
                ) : (
                  'Escolher Pro'
                )}
              </button>
            </div>

            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4">Inclui:</h4>
              <ul className="space-y-3">
                {(() => {
                  const plan = proPlans.find(p => p.billing_period === selectedBillingPeriod) || proPlans[0];
                  return plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-gray-600 text-sm">
          Todos os planos incluem suporte por email e atualizações gratuitas
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Cancele a qualquer momento. Sem taxas de cancelamento.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
