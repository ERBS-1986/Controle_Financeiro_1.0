
import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  ChevronLeft,
  Settings,
  X,
  Languages,
  LogOut,
  Users,
  Plus,
  ArrowRight,
  AlertTriangle,
  Bell,
  CheckCircle2,
  History,
  Search,
  PieChart as PieChartIcon,
  Briefcase,
  Mail,
  Lock,
  User as UserIcon,
  LayoutDashboard,
  Calendar,
  Filter,
  ChevronRight,
  Menu,
  Camera,
  AtSign,
  Upload
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import {
  Transaction,
  TransactionType,
  Category,
  TransactionFrequency,
  Language,
  Currency,
  User,
  FinancialControl,
  ControlType,
  Reminder
} from './types';
import { db } from './db';
import { supabase } from './services/supabase';

type ViewType = 'dashboard' | 'history' | 'charts' | 'reminders';

const translations = {
  'pt-BR': {
    appTitle: 'Controle Financeiro',
    balance: 'Saldo Disponível',
    income: 'Receitas Totais',
    expense: 'Despesas Totais',
    investments: 'Investimentos Totais',
    newTransaction: 'Nova Transação',
    description: 'Descrição',
    amount: 'Valor',
    type: 'Tipo',
    category: 'Categoria',
    date: 'Data',
    confirm: 'Confirmar Transação',
    history: 'Histórico Completo',
    noTransactions: 'Nenhuma transação encontrada.',
    movementChart: 'Análise de Movimentação',
    settings: 'Configurações',
    language: 'Idioma',
    expenseLabel: 'Despesa',
    incomeLabel: 'Receita',
    investmentLabel: 'Investimento',
    dash: 'Início',
    myControls: 'Meus Controles',
    newControl: 'Novo Controle',
    name: 'Nome do Controle',
    login: 'Entrar',
    signUp: 'Criar Conta',
    deleteControl: 'Excluir Controle',
    confirmDelete: 'Confirmar Exclusão',
    deleteWarning: 'Atenção: Esta ação é irreversível e todos os dados serão perdidos permanentemente.',
    wait: 'Aguarde',
    seconds: 's',
    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    reminders: 'Lembretes de Pagamento',
    confirmReminder: 'Confirmar Lembrete',
    payReminder: 'Pagar',
    emptyControls: 'Você ainda não possui controles financeiros. Comece criando um agora!',
    individual: 'Individual',
    group: 'Grupo',
    all: 'Todos',
    period: 'Período',
    from: 'De',
    to: 'Até',
    filter: 'Filtrar',
    back: 'Voltar',
    email: 'E-mail',
    clickToChange: 'CLIQUE PARA ALTERAR FOTO'
  },
  'en-US': {
    appTitle: 'Financial Control',
    balance: 'Available Balance',
    income: 'Total Income',
    expense: 'Total Expenses',
    investments: 'Total Investments',
    newTransaction: 'New Transaction',
    description: 'Description',
    amount: 'Value',
    type: 'Type',
    category: 'Category',
    date: 'Date',
    confirm: 'Confirm Transaction',
    history: 'Full History',
    noTransactions: 'No transactions found.',
    movementChart: 'Movement Analysis',
    settings: 'Settings',
    language: 'Language',
    expenseLabel: 'Expense',
    incomeLabel: 'Income',
    investmentLabel: 'Investment',
    dash: 'Home',
    myControls: 'My Controls',
    newControl: 'New Control',
    name: 'Control Name',
    login: 'Login',
    signUp: 'Sign Up',
    deleteControl: 'Delete Control',
    confirmDelete: 'Confirm Deletion',
    deleteWarning: 'Warning: This action is irreversible and all data will be permanently lost.',
    wait: 'Wait',
    seconds: 's',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    reminders: 'Payment Reminders',
    confirmReminder: 'Confirm Reminder',
    payReminder: 'Pay',
    emptyControls: 'You don\'t have any financial controls yet. Start by creating one!',
    individual: 'Individual',
    group: 'Group',
    all: 'All',
    period: 'Period',
    from: 'From',
    to: 'To',
    filter: 'Filter',
    back: 'Back',
    email: 'Email',
    clickToChange: 'CLICK TO CHANGE PHOTO'
  }
};

const CATEGORIES: Category[] = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Investimentos', 'Outros'];
const CHART_COLORS = ['#10b981', '#3b82f6', '#ef4444'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [controls, setControls] = useState<FinancialControl[]>([]);
  const [language, setLanguage] = useState<Language>(() => db.getLanguage());

  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ name: '', nickname: '', email: '', password: '', confirmPassword: '' });

  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [isCreatingControl, setIsCreatingControl] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = translations[language];

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileNickname, setProfileNickname] = useState(currentUser?.nickname || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');

  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [trDate, setTrDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [cat, setCat] = useState<Category>('Outros');

  const [remDesc, setRemDesc] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [remDate, setRemDate] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setCurrentUser({
          id: session.user.id,
          name: profile?.name || session.user.user_metadata.name || 'Usuário',
          nickname: profile?.nickname || session.user.user_metadata.nickname,
          email: session.user.email!,
          avatar: profile?.avatar_url || session.user.user_metadata.avatar_url
        });
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setCurrentUser({
            id: session.user.id,
            name: profile?.name || session.user.user_metadata.name || 'Usuário',
            nickname: profile?.nickname || session.user.user_metadata.nickname,
            email: session.user.email!,
            avatar: profile?.avatar_url || session.user.user_metadata.avatar_url
          });
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSelectedControlId(null);
        }
      });

      return () => subscription.unsubscribe();
    };
    initAuth();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        // Carregar Controles
        const { data: controlsData, error: controlsError } = await supabase
          .from('financial_controls')
          .select('*, transactions(*), reminders(*), investments(*)')
          .eq('owner_id', currentUser.id);

        if (controlsError) {
          console.error('Erro ao carregar controles:', controlsError);
        } else if (controlsData) {
          const formattedControls = controlsData.map((c: any) => ({
            ...c,
            ownerId: c.owner_id,
            members: c.members || [],
            transactions: (c.transactions || []).map((t: any) => ({
              ...t,
            })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            reminders: (c.reminders || []).map((r: any) => ({
              ...r
            })),
            investments: (c.investments || []).map((i: any) => ({
              ...i,
              customType: i.custom_type,
              expectedReturn: i.expected_return,
              returnFrequency: i.return_frequency
            }))
          }));
          setControls(formattedControls);
        }
      }
    };
    fetchData();
  }, [currentUser]);
  useEffect(() => { db.saveLanguage(language); }, [language]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileNickname(currentUser.nickname || '');
      setProfileEmail(currentUser.email);
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const currentControl = useMemo(() => controls.find(c => c.id === selectedControlId), [controls, selectedControlId]);

  const filteredTransactions = useMemo(() => {
    if (!currentControl) return [];
    return (currentControl.transactions || []).filter(tr => {
      const d = new Date(tr.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [currentControl, selectedMonth, selectedYear]);

  const advancedFilteredTransactions = useMemo(() => {
    if (!currentControl) return [];
    return (currentControl.transactions || []).filter(tr => {
      const d = new Date(tr.date);
      const typeMatch = historyTypeFilter === 'ALL' || tr.type === historyTypeFilter;
      const dateMatch = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      return typeMatch && dateMatch;
    });
  }, [currentControl, historyTypeFilter, selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
    const investment = filteredTransactions.filter(t => t.type === TransactionType.INVESTMENT).reduce((a, b) => a + b.amount, 0);
    return { income, expense, investment, balance: income - expense - investment };
  }, [filteredTransactions]);

  const movementChartData = useMemo(() => {
    return [
      { name: t.incomeLabel, value: totals.income },
      { name: t.investmentLabel, value: totals.investment },
      { name: t.expenseLabel, value: totals.expense }
    ].filter(item => item.value > 0);
  }, [totals, t]);

  const formatCurrency = (value: number) => {
    const currency = currentControl?.currency || 'BRL';
    return new Intl.NumberFormat(language, { style: 'currency', currency }).format(value);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (authForm.password !== authForm.confirmPassword) { alert('As senhas não coincidem!'); return; }

      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: {
            name: authForm.name || authForm.nickname,
            nickname: authForm.nickname,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authForm.email}`
          }
        }
      });

      if (error) { alert(`Erro no cadastro: ${error.message}`); return; }
      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          name: authForm.name || authForm.nickname,
          nickname: authForm.nickname,
          email: authForm.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authForm.email}`
        };
        setCurrentUser(newUser);
        setIsSettingsOpen(true);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password
      });

      if (error) { alert('E-mail ou senha incorretos!'); return; }
      if (data.user) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

        setCurrentUser({
          id: data.user.id,
          name: profile?.name || data.user.user_metadata.name || 'Usuário',
          nickname: profile?.nickname || data.user.user_metadata.nickname,
          email: data.user.email!,
          avatar: profile?.avatar_url || data.user.user_metadata.avatar_url
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileName,
        nickname: profileNickname,
        avatar_url: profileAvatar
      })
      .eq('id', currentUser.id);

    if (error) {
      alert('Erro ao atualizar perfil!');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: profileName,
      nickname: profileNickname,
      avatar: profileAvatar
    };
    setCurrentUser(updatedUser);
    setIsSettingsOpen(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSelectedControlId(null);
    setActiveView('dashboard');
    setSidebarOpen(false);
  };

  const handleAddControl = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name || !currentUser) return;

    const newControlData = {
      name,
      currency: formData.get('currency') as Currency,
      type: formData.get('type') as ControlType,
      owner_id: currentUser.id
    };

    const { data, error } = await supabase
      .from('financial_controls')
      .insert([newControlData])
      .select()
      .single();

    if (error) { alert('Erro ao criar controle!'); return; }

    const newControl: FinancialControl = {
      id: data.id,
      name: data.name,
      currency: data.currency as Currency,
      type: data.type as ControlType,
      ownerId: data.owner_id,
      members: [],
      transactions: [],
      investments: [],
      reminders: []
    };
    setControls([...controls, newControl]);
    setIsCreatingControl(false);
    setSelectedControlId(newControl.id);
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !selectedControlId) return;

    const newTrData = {
      description: desc,
      amount: parseFloat(amount),
      type,
      category: cat,
      frequency: TransactionFrequency.PONTUAL,
      date: new Date(trDate + 'T12:00:00Z').toISOString(),
      control_id: selectedControlId
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newTrData])
      .select()
      .single();

    if (error) { alert('Erro ao adicionar transação!'); return; }

    const newTr: Transaction = {
      id: data.id,
      description: data.description,
      amount: data.amount,
      type: data.type as TransactionType,
      category: data.category as Category,
      frequency: data.frequency as TransactionFrequency,
      date: data.date
    };

    setControls(controls.map(c => c.id === selectedControlId ? { ...c, transactions: [newTr, ...(c.transactions || [])] } : c));
    setDesc(''); setAmount(''); setTrDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remDesc || !remAmount || !selectedControlId) return;

    const reminderData = {
      description: remDesc,
      amount: parseFloat(remAmount),
      date: new Date(remDate + 'T12:00:00Z').toISOString(),
      control_id: selectedControlId
    };

    const { data, error } = await supabase
      .from('reminders')
      .insert([reminderData])
      .select()
      .single();

    if (error) { alert('Erro ao adicionar lembrete!'); return; }

    const reminder: Reminder = {
      id: data.id,
      description: data.description,
      amount: data.amount,
      date: data.date
    };
    setControls(controls.map(c => c.id === selectedControlId ? { ...c, reminders: [reminder, ...(c.reminders || [])] } : c));
    setRemDesc(''); setRemAmount('');
  };

  const handlePayReminder = async (reminder: Reminder) => {
    if (!selectedControlId) return;

    // Adicionar transação de despesa
    const newTrData = {
      description: reminder.description,
      amount: reminder.amount,
      type: TransactionType.EXPENSE,
      category: 'Outros',
      frequency: TransactionFrequency.PONTUAL,
      date: new Date().toISOString(),
      control_id: selectedControlId
    };

    const { data: trData, error: trError } = await supabase.from('transactions').insert([newTrData]).select().single();
    if (trError) { alert('Erro ao pagar lembrete (transação)!'); return; }

    // Remover lembrete
    const { error: remError } = await supabase.from('reminders').delete().eq('id', reminder.id);
    if (remError) { alert('Erro ao remover lembrete!'); return; }

    const newTr: Transaction = {
      id: trData.id,
      description: trData.description,
      amount: trData.amount,
      type: trData.type as TransactionType,
      category: trData.category as Category,
      frequency: trData.frequency as TransactionFrequency,
      date: trData.date
    };

    setControls(controls.map(c => c.id === selectedControlId ? { ...c, transactions: [newTr, ...(c.transactions || [])], reminders: (c.reminders || []).filter(r => r.id !== reminder.id) } : c));
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
    if (error) { alert('Erro ao excluir lembrete!'); return; }

    setControls(controls.map(c => c.id === selectedControlId ? { ...c, reminders: (c.reminders || []).filter(r => r.id !== reminderId) } : c));
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm('Excluir esta transação?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) { alert('Erro ao excluir transação!'); return; }

    setControls(controls.map(c => c.id === selectedControlId ? { ...c, transactions: (c.transactions || []).filter(t => t.id !== transactionId) } : c));
  };

  const handleDeleteControl = async (e: React.MouseEvent, controlId: string) => {
    e.stopPropagation();
    if (!window.confirm('Excluir este controle e todos os seus dados permanentemente?')) return;

    const { error } = await supabase.from('financial_controls').delete().eq('id', controlId);
    if (error) { alert('Erro ao excluir controle!'); return; }

    setControls(controls.filter(c => c.id !== controlId));
    if (selectedControlId === controlId) setSelectedControlId(null);
  };

  const Sidebar = () => (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`fixed left-0 top-0 h-full bg-white border-r border-slate-100 transition-all duration-300 z-[60] flex flex-col 
        ${sidebarOpen ? 'w-64 translate-x-0 shadow-2xl' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} 
        overflow-hidden`}>
        <div className="h-20 flex items-center px-5 border-b border-slate-50 gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shrink-0"><Wallet className="text-white w-5 h-5" /></div>
          {sidebarOpen && <h1 className="text-sm font-black text-slate-800 truncate">{t.appTitle}</h1>}
        </div>

        <nav className="flex-grow p-2 space-y-1">
          <button onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center justify-start gap-4 p-3 rounded-xl transition-all ${activeView === 'dashboard' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-[13px] text-left truncate">{t.dash}</span>}
          </button>
          <button onClick={() => { setActiveView('history'); setSidebarOpen(false); }} className={`w-full flex items-center justify-start gap-4 p-3 rounded-xl transition-all ${activeView === 'history' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-[13px] text-left truncate">{t.history}</span>}
          </button>
          <button onClick={() => { setActiveView('charts'); setSidebarOpen(false); }} className={`w-full flex items-center justify-start gap-4 p-3 rounded-xl transition-all ${activeView === 'charts' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}>
            <PieChartIcon size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-[13px] text-left truncate leading-tight">{t.movementChart}</span>}
          </button>
          <button onClick={() => { setActiveView('reminders'); setSidebarOpen(false); }} className={`w-full flex items-center justify-start gap-4 p-3 rounded-xl transition-all ${activeView === 'reminders' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Bell size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-[13px] text-left truncate leading-tight">{t.reminders}</span>}
          </button>
        </nav>

        <div className="p-2 border-t border-slate-50">
          <button onClick={() => { setIsSettingsOpen(true); setSidebarOpen(false); }} className="w-full flex items-center justify-start gap-4 p-3 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
            <Settings size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-[13px] text-left">{t.settings}</span>}
          </button>
          <button onClick={() => { setSelectedControlId(null); setSidebarOpen(false); }} className="w-full flex items-center justify-start gap-4 p-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all mt-1">
            <ChevronLeft size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-[13px] text-left">{t.back}</span>}
          </button>
        </div>
      </div>
    </>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-white">
      <div className="w-full max-w-[360px] animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-6">
          <div className="bg-emerald-500 p-2.5 rounded-2xl w-fit mx-auto shadow-xl shadow-emerald-100 mb-3 ring-4 ring-emerald-50"><Wallet className="text-white w-7 h-7" /></div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.appTitle}</h1>
          <p className="text-slate-400 font-medium text-[10px] mt-0.5">Sua vida financeira sob controle</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-1 overflow-hidden">
          <div className="flex bg-slate-50 rounded-2xl mb-4 p-1 relative">
            <button onClick={() => setAuthMode('login')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-[11px] transition-all relative z-10 ${authMode === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}>{t.login}</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-[11px] transition-all relative z-10 ${authMode === 'signup' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}>{t.signUp}</button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-emerald-600 rounded-xl shadow-sm transition-transform duration-300 ease-out z-0 ${authMode === 'signup' ? 'translate-x-full' : 'translate-x-0'}`} />
          </div>
          <form onSubmit={handleAuthSubmit} className="px-4 py-2 space-y-3">
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px] text-slate-800 placeholder:text-slate-400" placeholder="Nome" />
                <input type="text" required value={authForm.nickname} onChange={(e) => setAuthForm({ ...authForm, nickname: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px] text-slate-800 placeholder:text-slate-400" placeholder="Apelido" />
              </div>
            )}
            <input type="email" required value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px] text-slate-800 placeholder:text-slate-400" placeholder="E-mail" />
            <input type="password" required value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px] text-slate-800 placeholder:text-slate-400" placeholder="Senha" />
            {authMode === 'signup' && (
              <input type="password" required value={authForm.confirmPassword} onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px] text-slate-800 placeholder:text-slate-400" placeholder="Confirmar Senha" />
            )}
            <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-md">{authMode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
          </form>
        </div>
      </div>
    </div>
  );

  if (!selectedControlId) return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-8">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-lg"><Wallet className="text-white w-4 h-4" /></div>
          <h1 className="text-sm font-black tracking-tight">{t.appTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
            <img src={currentUser.avatar} className="w-7 h-7 rounded-full border border-emerald-50" alt="avatar" />
            <div className="hidden md:flex flex-col text-left">
              <span className="font-bold text-[10px] text-slate-800 leading-none">{currentUser.name}</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-all"><LogOut size={18} /></button>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t.myControls}</h2>
          <button onClick={() => setIsCreatingControl(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"><Plus size={18} /> {t.newControl}</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {controls.map(c => (
            <div key={c.id} onClick={() => { setSelectedControlId(c.id); setActiveView('dashboard'); }} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg cursor-pointer transition-all relative overflow-hidden">
              <button
                onClick={(e) => handleDeleteControl(e, c.id)}
                className="absolute top-2 right-2 p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
              >
                <Trash2 size={14} />
              </button>
              <div className={`p-2.5 rounded-lg w-fit mb-3 ${c.type === ControlType.INDIVIDUAL ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>{c.type === ControlType.INDIVIDUAL ? <PlusCircle size={20} /> : <Users size={20} />}</div>
              <h3 className="text-sm font-bold text-slate-800 mb-0.5 truncate group-hover:text-emerald-600">{c.name}</h3>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.currency}</div>
            </div>
          ))}
        </div>
      </main>
      {
        isCreatingControl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in zoom-in">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-black text-slate-800">{t.newControl}</h2><button onClick={() => setIsCreatingControl(false)} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400"><X size={18} /></button></div>
              <form onSubmit={handleAddControl} className="space-y-4">
                <input name="name" required placeholder="Nome do Controle" className="w-full px-4 py-3 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-xs text-slate-800" />
                <div className="grid grid-cols-2 gap-3">
                  <select name="currency" className="w-full px-3 py-3 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-[10px] text-slate-800">
                    <option value="BRL">BRL</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                  <select name="type" className="w-full px-3 py-3 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-[10px] text-slate-800"><option value={ControlType.INDIVIDUAL}>{t.individual}</option><option value={ControlType.GRUPO}>{t.group}</option></select>
                </div>
                <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-md">Criar Agora</button>
              </form>
            </div>
          </div>
        )
      }
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 overflow-x-hidden">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'pl-0 md:pl-64' : 'pl-0 md:pl-20'}`}>
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50 h-14 md:h-16 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"><Menu size={22} /></button>
            <h1 className="text-sm font-black text-slate-800 truncate max-w-[140px] md:max-w-none">{currentControl?.name}</h1>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
            <img src={currentUser.avatar} className="w-7 h-7 rounded-full border border-emerald-50 group-hover:border-emerald-500 transition-all" alt="avatar" />
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
          {activeView === 'dashboard' && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => { setActiveView('history'); setHistoryTypeFilter(TransactionType.INCOME); }} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-1.5 group hover:shadow-md text-left">
                  <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg group-hover:scale-110"><TrendingUp size={16} /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.income}</p><p className="text-sm font-black text-emerald-600 truncate w-full">{formatCurrency(totals.income)}</p></div>
                </button>
                <button onClick={() => { setActiveView('history'); setHistoryTypeFilter(TransactionType.INVESTMENT); }} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-1.5 group hover:shadow-md text-left">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110"><Briefcase size={16} /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.investments}</p><p className="text-sm font-black text-blue-600 truncate w-full">{formatCurrency(totals.investment)}</p></div>
                </button>
                <button onClick={() => { setActiveView('history'); setHistoryTypeFilter(TransactionType.EXPENSE); }} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-1.5 group hover:shadow-md text-left">
                  <div className="p-1.5 bg-red-50 text-red-500 rounded-lg group-hover:scale-110"><TrendingDown size={16} /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.expense}</p><p className="text-sm font-black text-red-600 truncate w-full">{formatCurrency(totals.expense)}</p></div>
                </button>
                <div className="bg-slate-900 p-3 rounded-2xl shadow-lg text-white flex flex-col items-start gap-1.5">
                  <div className="p-1.5 bg-white/10 text-white rounded-lg"><Wallet size={16} /></div>
                  <div><p className="text-[8px] font-black opacity-50 uppercase tracking-widest">{t.balance}</p><p className="text-sm font-black truncate w-full">{formatCurrency(totals.balance)}</p></div>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 mb-4"><PlusCircle size={18} className="text-emerald-500" /> {t.newTransaction}</h2>
                <form onSubmit={addTransaction} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.description} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-50 rounded-xl outline-none font-medium text-[11px] text-slate-800 placeholder:text-slate-400" required />
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t.amount} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-[11px] text-slate-800 placeholder:text-slate-400" required />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-[10px] text-slate-800"><option value={TransactionType.EXPENSE}>{t.expenseLabel}</option><option value={TransactionType.INCOME}>{t.incomeLabel}</option><option value={TransactionType.INVESTMENT}>{t.investmentLabel}</option></select>
                    <input type="date" value={trDate} onChange={(e) => setTrDate(e.target.value)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-[10px] text-slate-800" />
                    <select value={cat} onChange={(e) => setCat(e.target.value as Category)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-50 rounded-xl outline-none font-bold text-[10px] text-slate-800 col-span-2 md:col-span-1">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-md">{t.confirm}</button>
                </form>
              </div>
            </div>
          )
          }

          {
            activeView === 'history' && (
              <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-black text-slate-800">{t.history}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                        <Filter size={12} className="text-slate-400 ml-1" />
                        <select value={historyTypeFilter} onChange={(e) => setHistoryTypeFilter(e.target.value)} className="bg-transparent font-bold text-[9px] outline-none px-1 py-1 text-slate-800">
                          <option value="ALL">{t.all}</option>
                          <option value={TransactionType.INCOME}>{t.incomeLabel}</option>
                          <option value={TransactionType.EXPENSE}>{t.expenseLabel}</option>
                          <option value={TransactionType.INVESTMENT}>{t.investmentLabel}</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100 px-2">
                        <Calendar size={12} className="text-slate-400" />
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent font-bold text-[9px] outline-none px-0.5 text-slate-800">{t.months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                        <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent font-bold text-[9px] outline-none w-10 text-center text-slate-800" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-50">
                    <table className="w-full text-left min-w-[420px]">
                      <thead className="bg-[#fafbfc]"><tr><th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase">Descrição</th><th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase text-right">Valor</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {advancedFilteredTransactions.map(tr => (
                          <tr key={tr.id} className="hover:bg-slate-50 transition-all group">
                            <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className={`p-1 rounded-md ${tr.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-500' : tr.type === TransactionType.INVESTMENT ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>{tr.type === TransactionType.INCOME ? <TrendingUp size={10} /> : tr.type === TransactionType.INVESTMENT ? <Briefcase size={10} /> : <TrendingDown size={10} />}</div><div className="flex flex-col"><span className="font-bold text-slate-800 text-[11px] truncate max-w-[100px]">{tr.description}</span><span className="text-[8px] text-slate-400 font-medium uppercase tracking-tight">{tr.category} • {new Date(tr.date).toLocaleDateString()}</span></div></div></td>
                            <td className={`px-3 py-2.5 text-right font-black text-[12px] ${tr.type === TransactionType.INCOME ? 'text-emerald-600' : tr.type === TransactionType.INVESTMENT ? 'text-blue-600' : 'text-slate-800'}`}>
                              <div className="flex items-center justify-end gap-2">
                                <span>{tr.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(tr.amount)}</span>
                                <button onClick={() => handleDeleteTransaction(tr.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {advancedFilteredTransactions.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-slate-400 text-[10px] italic">{t.noTransactions}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeView === 'charts' && (
              <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-black text-slate-800">{t.movementChart}</h2>
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100 px-2">
                      <Calendar size={12} className="text-slate-400" />
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent font-bold text-[9px] outline-none px-0.5 text-slate-800">{t.months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                      <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent font-bold text-[9px] outline-none w-10 text-center text-slate-800" />
                    </div>
                  </div>
                  <div className="h-[260px] md:h-[380px] flex items-center justify-center">
                    {movementChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={movementChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                            {movementChartData.map((entry, index) => {
                              let color = entry.name === t.incomeLabel ? CHART_COLORS[0] : entry.name === t.investmentLabel ? CHART_COLORS[1] : CHART_COLORS[2];
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} formatter={(v: number) => formatCurrency(v)} />
                          <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '9px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-400 italic space-y-2"><PieChartIcon size={40} className="mx-auto opacity-20" /><p className="text-[10px]">{t.noTransactions}</p></div>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          {
            activeView === 'reminders' && (
              <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <h2 className="text-base font-black text-slate-800 mb-4">{t.reminders}</h2>
                  <form onSubmit={handleAddReminder} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                    <input value={remDesc} onChange={(e) => setRemDesc(e.target.value)} placeholder={t.description} className="w-full px-3 py-2.5 bg-white rounded-lg outline-none text-[10px] text-slate-800 placeholder:text-slate-400" required />
                    <input type="number" step="0.01" value={remAmount} onChange={(e) => setRemAmount(e.target.value)} placeholder={t.amount} className="w-full px-3 py-2.5 bg-white rounded-lg outline-none text-[10px] text-slate-800 placeholder:text-slate-400" required />
                    <input type="date" value={remDate} onChange={(e) => setRemDate(e.target.value)} className="w-full px-3 py-2.5 bg-white rounded-lg outline-none text-[10px] text-slate-800" required />
                    <button type="submit" className="md:col-span-3 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] shadow-sm">Adicionar Lembrete</button>
                  </form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(currentControl?.reminders || []).map(rem => (
                      <div key={rem.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:shadow-sm transition-all">
                        <div className="flex flex-col"><p className="font-bold text-slate-800 text-[11px] mb-0.5 truncate max-w-[140px]">{rem.description}</p><div className="flex items-center gap-1 text-slate-400"><Calendar size={10} /> <span className="text-[9px] font-bold">{new Date(rem.date).toLocaleDateString()}</span><span className="w-0.5 h-0.5 bg-slate-200 rounded-full mx-0.5"></span><span className="text-[9px] font-black text-blue-600">{formatCurrency(rem.amount)}</span></div></div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handlePayReminder(rem)} className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm hover:scale-105 transition-all"><CheckCircle2 size={14} /></button>
                          <button onClick={() => handleDeleteReminder(rem.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }
        </main>
      </div>

      {/* MODAL DE CONFIGURAÇÕES E PERFIL */}
      {
        isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-lg p-5 md:p-8 shadow-2xl animate-in zoom-in overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-slate-300" /> {t.settings}
                </h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={18} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <UserIcon size={12} /> {t.editProfile}
                  </h3>
                  <div className="flex flex-col gap-5 items-center">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={profileAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border-2 border-slate-50 object-cover shadow-md" alt="avatar preview" />
                      <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl text-white shadow-lg border-2 border-white">
                        <Camera size={14} />
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.clickToChange}</p>

                    <div className="flex-grow w-full space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">NOME COMPLETO</label>
                          <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold text-slate-900" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">{t.nickname}</label>
                          <input value={profileNickname} onChange={(e) => setProfileNickname(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold text-slate-900" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">{t.email}</label>
                        <div className="relative">
                          <AtSign size={10} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold text-slate-900" />
                        </div>
                      </div>
                      <button onClick={handleSaveProfile} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-[11px] hover:bg-emerald-700 transition-all shadow-md mt-2">
                        {t.saveProfile}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-50 w-full"></div>

                <div className="space-y-2">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Languages size={12} /> {t.language}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setLanguage('pt-BR')} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all border-2 ${language === 'pt-BR' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'}`}>Português</button>
                    <button onClick={() => setLanguage('en-US')} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all border-2 ${language === 'en-US' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'}`}>English</button>
                  </div>
                </div>

                <div className="pt-2">
                  <button onClick={handleLogout} className="w-full py-3.5 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default App;
