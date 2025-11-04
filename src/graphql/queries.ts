import { gql } from '@apollo/client';

// Queries
export const GET_CUSTOMER = gql`
  query GetCustomer {
    customer {
      id
      email
      firstname
      lastname
      middlename
      prefix
      suffix
      date_of_birth
      gender
      is_subscribed
      created_at
      addresses {
        id
        firstname
        lastname
        street
        city
        region {
          region_code
          region
          region_id
        }
        postcode
        country_code
        telephone
        default_shipping
        default_billing
      }
    }
  }
`;

export const IS_EMAIL_AVAILABLE = gql`
  query IsEmailAvailable($email: String!) {
    isEmailAvailable(email: $email) {
      is_email_available
    }
  }
`;

// Mutations
export const GENERATE_CUSTOMER_TOKEN = gql`
  mutation GenerateCustomerToken($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) {
      token
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerCreateInput!) {
    createCustomerV2(input: $input) {
      customer {
        id
        email
        firstname
        lastname
        middlename
        prefix
        suffix
        date_of_birth
        gender
        is_subscribed
        created_at
      }
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: CustomerUpdateInput!) {
    updateCustomerV2(input: $input) {
      customer {
        id
        email
        firstname
        lastname
        middlename
        prefix
        suffix
        date_of_birth
        gender
        is_subscribed
        created_at
      }
    }
  }
`;

export const REVOKE_CUSTOMER_TOKEN = gql`
  mutation RevokeCustomerToken {
    revokeCustomerToken {
      result
    }
  }
`;

export const CREATE_CUSTOMER_ADDRESS = gql`
  mutation CreateCustomerAddress($input: CustomerAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      firstname
      lastname
      street
      city
      region {
        region_code
        region
        region_id
      }
      postcode
      country_code
      telephone
      default_shipping
      default_billing
    }
  }
`;

export const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation UpdateCustomerAddress(
    $id: Int!
    $input: CustomerAddressInput!
  ) {
    updateCustomerAddress(id: $id, input: $input) {
      id
      firstname
      lastname
      street
      city
      region {
        region_code
        region
        region_id
      }
      postcode
      country_code
      telephone
      default_shipping
      default_billing
    }
  }
`;

export const DELETE_CUSTOMER_ADDRESS = gql`
  mutation DeleteCustomerAddress($id: Int!) {
    deleteCustomerAddress(id: $id)
  }
`;

// Password Reset Mutations
export const REQUEST_PASSWORD_RESET_EMAIL = gql`
  mutation RequestPasswordResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`;

export const CHANGE_CUSTOMER_PASSWORD = gql`
  mutation ChangeCustomerPassword($currentPassword: String!, $newPassword: String!) {
    changeCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
      email
      firstname
      lastname
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $resetPasswordToken: String!, $newPassword: String!) {
    resetPassword(email: $email, resetPasswordToken: $resetPasswordToken, newPassword: $newPassword)
  }
`;

// Subscription Queries
export const GET_SUBSCRIPTION_PLANS = gql`
  query GetSubscriptionPlans {
    getSubscriptionPlans {
      id
      name
      sku
      price
      currency
      billing_period
      description
      features
      is_popular
    }
  }
`;

export const GET_CUSTOMER_SUBSCRIPTION = gql`
  query GetCustomerSubscription {
    getCustomerSubscription {
      id
      status
      plan_name
      current_period_start
      current_period_end
      amount
      currency
      billing_period
      cancel_at_period_end
      payment_method {
        id
        type
        card {
          brand
          last4
          exp_month
          exp_year
        }
      }
    }
  }
`;

export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      status
      plan_name
      current_period_start
      current_period_end
      amount
      currency
      billing_period
      cancel_at_period_end
      payment_method {
        id
        type
        brand
        exp_month
        exp_year
        label
        icon
      }
    }
  }
`;

export const GET_STRIPE_CONFIGURATION = gql`
  query GetStripeConfiguration {
    getStripeConfiguration {
      apiKey
      locale
      appInfo
      options {
        betas
        apiVersion
      }
      elementsOptions
    }
  }
`;

export const CUSTOMER_CART = gql`
  query CustomerCart {
    customerCart {
      id
      items {
        id
        quantity
        product {
          sku
        }
        prices {
          price {
            value
            currency
          }
          row_total {
            value
            currency
          }
        }
      }
      prices {
        grand_total {
          value
          currency
        }
      }
      available_payment_methods {
        code
        title
      }
    }
  }
`;

export const ADD_SIMPLE_PRODUCTS_TO_CART = gql`
  mutation AddSimpleProductsToCart($input: AddSimpleProductsToCartInput!) {
    addSimpleProductsToCart(input: $input) {
      cart {
        id
        items {
          id
          quantity
          product {
            sku
          }
          prices {
            price {
              value
              currency
            }
            row_total {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
        }
      }
    }
  }
`;

export const SET_BILLING_ADDRESS_ON_CART = gql`
  mutation SetBillingAddressOnCart($input: SetBillingAddressOnCartInput!) {
    setBillingAddressOnCart(input: $input) {
      cart {
        id
        billing_address {
          firstname
          lastname
          street
          city
          region {
            code
            label
          }
          postcode
          country {
            code
            label
          }
          telephone
        }
      }
    }
  }
`;

export const SET_PAYMENT_METHOD_ON_CART = gql`
  mutation SetPaymentMethodOnCart($input: SetPaymentMethodOnCartInput!) {
    setPaymentMethodOnCart(input: $input) {
      cart {
        id
        selected_payment_method {
          code
          title
        }
      }
    }
  }
`;

export const PLACE_ORDER = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      order {
        order_number
        client_secret
      }
      orderV2 {
        order_number
      }
      errors {
        message
        code
      }
    }
  }
`;

export const CREATE_CHECKOUT_SESSION = gql`
  query CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
    createCheckoutSession(input: $input) {
      checkout_url
      session_id
      price_id
      amount
      currency
      product_id
      billing_period
    }
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($input: CancelSubscriptionInput!) {
    cancelSubscription(input: $input)
  }
`;

export const GET_SAVED_PAYMENT_METHODS = gql`
  query GetSavedPaymentMethods {
    getSavedPaymentMethods {
      id
      type
      card {
        brand
        last4
        exp_month
        exp_year
      }
    }
  }
`;

export const CHANGE_PAYMENT_METHOD = gql`
  mutation ChangePaymentMethod($input: ChangePaymentMethodInput!) {
    changePaymentMethod(input: $input) {
      id
      status
      plan_name
      current_period_start
      current_period_end
      amount
      currency
      billing_period
      cancel_at_period_end
      payment_method {
        id
        type
        card {
          brand
          last4
          exp_month
          exp_year
        }
      }
    }
  }
`;

export const UPGRADE_SUBSCRIPTION = gql`
  mutation UpgradeSubscription($input: UpgradeSubscriptionInput!) {
    upgradeSubscription(input: $input) {
      checkout_url
      session_id
      price_id
      amount
      currency
      product_id
      billing_period
    }
  }
`;