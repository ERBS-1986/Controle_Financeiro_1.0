
import { User, FinancialControl, Language } from './types';

const KEYS = {
  USERS: 'controle_financeiro_registered_users',
  CURRENT_USER: 'controle_financeiro_session',
  CONTROLS: 'controle_financeiro_data',
  SETTINGS: 'controle_financeiro_settings'
};

export const db = {
  // Usuários
  getRegisteredUsers: (): any[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  
  saveNewUser: (user: any) => {
    const users = db.getRegisteredUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  // Sessão
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  // Dados Financeiros
  getControls: (): FinancialControl[] => {
    const data = localStorage.getItem(KEYS.CONTROLS);
    return data ? JSON.parse(data) : [];
  },

  saveControls: (controls: FinancialControl[]) => {
    localStorage.setItem(KEYS.CONTROLS, JSON.stringify(controls));
  },

  // Configurações
  getLanguage: (): Language => {
    return (localStorage.getItem(KEYS.SETTINGS) as Language) || 'pt-BR';
  },

  saveLanguage: (lang: Language) => {
    localStorage.setItem(KEYS.SETTINGS, lang);
  }
};
