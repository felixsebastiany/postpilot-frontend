// GraphQL Types para Magento Customer
export interface Customer {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  prefix?: string;
  suffix?: string;
  date_of_birth?: string;
  gender?: number;
  is_subscribed: boolean;
  created_at: string;
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: number;
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region?: CustomerAddressRegion;
  postcode: string;
  country_code: string;
  telephone: string;
  default_shipping: boolean;
  default_billing: boolean;
}

export interface CustomerAddressRegion {
  region_code: string;
  region: string;
  region_id: number;
}

export interface CustomerToken {
  token: string;
}

export interface CustomerOutput {
  customer: Customer;
}

export interface IsEmailAvailableOutput {
  is_email_available: boolean;
}

// Input Types
export interface CustomerCreateInput {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  middlename?: string;
  prefix?: string;
  suffix?: string;
  date_of_birth?: string;
  gender?: number;
  is_subscribed?: boolean;
}

export interface CustomerUpdateInput {
  firstname?: string;
  lastname?: string;
  middlename?: string;
  prefix?: string;
  suffix?: string;
  date_of_birth?: string;
  gender?: number;
  is_subscribed?: boolean;
}

export interface CustomerAddressInput {
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region?: CustomerAddressRegionInput;
  postcode: string;
  country_code: string;
  telephone: string;
  default_shipping?: boolean;
  default_billing?: boolean;
}

export interface CustomerAddressRegionInput {
  region_code?: string;
  region?: string;
  region_id?: number;
}

// GraphQL Response Types
export interface GraphQLResponse<T> {
  data: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: {
    category?: string;
    code?: string;
  };
}
