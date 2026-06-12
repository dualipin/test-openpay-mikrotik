export {};

declare global {
  interface Window {
    OpenPay: OpenPayStatic;
  }

  const OpenPay: OpenPayStatic;
}

interface OpenPayStatic {
  // Version and Constants
  version: number;
  hostname: string;
  sandboxHostname: string;
  developHostname: string;
  sandboxMode: boolean;
  developMode: boolean;
  id?: string;
  key?: string;

  // Configuration Methods
  setId(id: string): void;
  getId(): string | undefined;
  setApiKey(key: string): void;
  getApiKey(): string | undefined;
  setSandboxMode(enabled: boolean): void;
  getSandboxMode(): boolean;
  setDevelopMode(enabled: boolean): void;
  getDevelopMode(): boolean;

  // Utility Methods
  validate(value: any, fieldName: string): void;
  formatData(data: any, whitelistedAttrs: string[]): any;
  extractFormInfo(form: string | HTMLElement | JQuery): Record<string, any>;
  log(message: string | Error): void;
  send(
    endpoint: string,
    data: any,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;

  // Device Data
  deviceData: {
    setup(formId: string, sessionIdFieldName: string): string;
  };

  // Card Operations
  card: OpenPayCard;

  // Token Operations
  token: OpenPayToken;

  // Checkout Operations
  checkout: OpenPayCheckout;

  // Utilities
  utils: OpenPayUtils;

  // Group Operations
  Group: OpenPayGroup;

  // Update Operations
  Update: OpenPayUpdate;
}

interface OpenPayCard {
  validateCardNumber(cardNumber: string): boolean;
  validateCVC(cvc: string, cardNumber?: string): boolean;
  validateExpiry(month: string, year: string): boolean;
  validateCardNumberLength(cardNumber: string): boolean;
  validateAcceptCardNumber(cardNumber: string): boolean;
  luhnCheck(cardNumber: string): boolean;
  cardType(cardNumber: string): string;
  cardTypes(): Record<string, CardTypeInfo>;
  cardAbstract(cardNumber: string): CardTypeInfo | false;
  whitelistedAttrs: string[];
  getId(): string | undefined;
  extractFormAndUpdateCard(
    form: string | HTMLElement | JQuery,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void,
    customerId?: string,
    cardId?: string
  ): void;
  update(
    data: any,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void,
    customerId?: string,
    cardId?: string
  ): void;
}

interface OpenPayToken {
  whitelistedAttrs: string[];
  extractFormAndCreate(
    form: string | HTMLElement | JQuery,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
  create(
    data: OpenPayCardData,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
}

interface OpenPayCheckout {
  whitelistedAttrs: string[];
  extractFormAndCreate(
    form: string | HTMLElement | JQuery,
    success: (response: OpenPayCheckoutResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
  create(
    data: OpenPayCheckoutData,
    success: (response: OpenPayCheckoutResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
}

interface OpenPayUtils {
  trim(str: string): string;
  underscore(str: string): string;
  underscoreKeys(obj: Record<string, any>): any[];
  isElement(obj: any): boolean;
}

interface OpenPayGroup {
  id?: string;
  key?: string;
  setId(id: string): void;
  getId(): string | undefined;
  setApiKey(key: string): void;
  getApiKey(): string | undefined;
  send(
    endpoint: string,
    data: any,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
  card: OpenPayGroupCard;
  token: OpenPayGroupToken;
}

interface OpenPayGroupCard {
  whitelistedAttrs: string[];
  getId(): string | undefined;
  extractFormAndUpdateCard(
    form: string | HTMLElement | JQuery,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void,
    customerId: string,
    cardId: string
  ): void;
  update(
    data: any,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void,
    customerId: string,
    cardId: string
  ): void;
}

interface OpenPayGroupToken {
  whitelistedAttrs: string[];
  extractFormAndCreate(
    form: string | HTMLElement | JQuery,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
  create(
    data: OpenPayCardData,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void
  ): void;
}

interface OpenPayUpdate {
  send(
    isGroup: boolean,
    data: any,
    success: (response: OpenPaySuccessResponse) => void,
    error: (response: OpenPayErrorResponse) => void,
    endpoint: string,
    method?: string
  ): void;
}

interface CardTypeInfo {
  name: string;
  regx: RegExp;
  length: number[];
  accept: boolean;
}

interface OpenPayCardData {
  card_number: string;
  holder_name: string;
  expiration_year: string;
  expiration_month: string;
  cvv2: string;

  address?: {
    city?: string;
    line1?: string;
    line2?: string;
    line3?: string;
    postal_code?: string;
    state?: string;
    country_code?: string;
  };
}

interface OpenPayCheckoutData {
  amount: number;
  currency: string;
  description: string;
  order_id?: string;
  send_email?: boolean;
  customer?: {
    name?: string;
    email?: string;
    phone_number?: string;
  };
  cancel_url?: string;
  redirect_url?: string;
  expiration_date?: string;
}

interface OpenPaySuccessResponse {
  data: {
    id: string;
    holder_name?: string;
    brand?: string;
    [key: string]: any;
  };
  status: number;
}

interface OpenPayCheckoutResponse {
  data: {
    id: string;
    amount?: number;
    currency?: string;
    description?: string;
    reference?: string;
    redirect_url?: string;
    [key: string]: any;
  };
  status: number;
}

interface OpenPayErrorResponse {
  status: number;
  message: string;
  data?: {
    description?: string;
    request_id?: string;
    status?: number;
    [key: string]: any;
  };
  toString(): string;
}

// jQuery Extensions (if jQuery is available)
declare global {
  interface JQuery {
    /**
     * Restricts input to valid card numbers with automatic formatting
     */
    cardNumberInput(): JQuery;
    /**
     * Restricts input to numeric values only
     */
    numericInput(): JQuery;
    /**
     * Restricts input based on type (card or numeric)
     * @param type "card" for card number formatting, "numeric" for numbers only
     */
    restrictedInput(type: "card" | "numeric"): JQuery;
  }
}