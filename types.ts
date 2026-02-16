
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT'
}

export enum TransactionFrequency {
  PONTUAL = 'PONTUAL',
  MENSAL = 'MENSAL'
}

export enum ControlType {
  INDIVIDUAL = 'INDIVIDUAL',
  GRUPO = 'GRUPO'
}

export enum InvestmentReturnFrequency {
  DIARIO = 'Diário',
  MENSAL = 'Mensal',
  ANUAL = 'Anual'
}

export enum InvestmentType {
  POUPANCA = 'Poupança',
  BITCOIN = 'Bitcoin/Cripto',
  FUNDOS = 'Fundos',
  ETF = 'ETF',
  ACOES = 'Ações',
  RENDA_FIXA = 'Renda Fixa',
  OUTROS = 'Outros'
}

export type Language = 'pt-BR' | 'en-US';
export type Currency = 'BRL' | 'USD' | 'EUR';

export type Category = 
  | 'Alimentação' 
  | 'Moradia' 
  | 'Transporte' 
  | 'Lazer' 
  | 'Saúde' 
  | 'Educação' 
  | 'Salário' 
  | 'Investimentos' 
  | 'Outros';

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  avatar?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  customType?: string;
  amount: number;
  expectedReturn?: string;
  returnFrequency?: InvestmentReturnFrequency;
  date: string;
}

export interface Reminder {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface FinancialControl {
  id: string;
  name: string;
  currency: Currency;
  type: ControlType;
  ownerId: string;
  members: string[];
  transactions: Transaction[];
  investments: Investment[];
  reminders?: Reminder[];
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  frequency: TransactionFrequency;
  date: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}