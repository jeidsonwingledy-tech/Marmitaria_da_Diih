import React, { useState } from 'react';
import { Plus, Trash2, Layout, Coffee, ArrowLeft, ImagePlus, X, Lock, Power, Edit3, Settings, PieChart, ListOrdered, Tags, Volume2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ImageEditable } from '../components/ui/ImageEditable';
import { api } from '../services/api';
import { MenuItem, ProductOptionGroup, ProductOption } from '../types';
import { formatCurrency, generateId } from '../utils/formatters';

// --- NAVIGATION TABS COMPONENT ---
const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: { id: string, icon: React.ElementType, label: string, activeTab: string, setActiveTab: (id: string) => void }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex flex-col items-center justify-center p-2 rounded-xl w-full transition-all ${activeTab === id ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:bg-white/50'}`}
  >
    <Icon size={20} className={activeTab === id ? 'mb-1' : 'mb-1'} />
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const Admin = () => {
  const {
    restaurantInfo,
    updateRestaurantInfo,
    menuItems,
    addMenuItem,
    updateMenuItem,
    categorias,
    addCategory,
    updateCategory,
    removeCategory,
    notify,
    isAdminMode,
    loginAdmin,
    logoutAdmin,
    orders,
    updateOrderStatus,
    clearOrders,
    syncToCloud,
    resetToDefaults
  } = useStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'categorias' | 'config'>('dashboard');

  // Menu Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const defaultNewItem: Partial<MenuItem> = { categoryId: categorias[0]?.id || '', name: '', description: '', price: 0, images: [], optionGroups: [], available: true };
  const [newItem, setNewItem] = useState<Partial<MenuItem>>(defaultNewItem);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Marmita Specific Prices
  const [marmitaPriceP, setMarmitaPriceP] = useState<number | ''>('');
  const [marmitaPriceM, setMarmitaPriceM] = useState<number | ''>('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Delivery Config State
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newNeighborhoodFee, setNewNeighborhoodFee] = useState('');
  const [storageStatus, setStorageStatus] = useState<{ checked: boolean; exists: boolean; message: string }>({ checked: false, exists: true, message: '' });

  // Check storage status on mount
  React.useEffect(() => {
    const check = async () => {
      const result = await api.checkStorage();
      setStorageStatus({ checked: true, exists: result.exists, message: result.message });
    };
    check();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserRaw = restaurantInfo.adminUsername || 'admin';

    if (username.trim() !== currentUserRaw) {
      notify('Usuário ou Senha incorreta.', 'error');
      return;
    }

    const ok = loginAdmin(password.trim());
    if (ok) {
      notify('Bem-vindo ao Painel Diih!', 'success');
    } else {
      notify('Usuário ou Senha incorreta.', 'error');
    }
  };

  const handleResetPassword = () => {
    if (window.confirm('Deseja resetar o usuário e senha para "admin" e entrar agora?')) {
      updateRestaurantInfo({ adminUsername: 'admin', adminPassword: 'admin' });
      setUsername('admin');
      setPassword('admin');
      loginAdmin('admin');
      notify('Usuário e Senha resetados e acesso concedido!', 'success');
    }
  };

  const handleSetupStorage = async () => {
    notify('Tentando configurar o storage...', 'info');
    const result = await api.setupStorage();
    if (result.success) {
      notify(result.message, 'success');
    } else {
      notify(result.message, 'error');
      // If it fails, we can show the SQL instructions in a more prominent way
      console.info("SQL para criar o bucket manualmente:\n\n" +
        "insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;\n" +
        "create policy \"Public Access\" on storage.objects for all using ( bucket_id = 'images' ) with check ( bucket_id = 'images' );"
      );
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setPassword('');
  };

  // --- MENU ITEM LOGIC ---
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    let itemToSave = { ...(editingItem || newItem) };

    // Inject Tamanhos if it's a Marmita
    const isMarmita = categorias.find(c => c.id === itemToSave.categoryId)?.name?.toLowerCase().includes('marmita');
    if (isMarmita && marmitaPriceP !== '' && marmitaPriceM !== '') {
      itemToSave.price = 0; // Base price
      let optionGroups = [...(itemToSave.optionGroups || [])];
      const sizeGroupIndex = optionGroups.findIndex(g => g.title === 'Tamanhos');
      
      const newSizeGroup: ProductOptionGroup = {
        id: sizeGroupIndex >= 0 ? optionGroups[sizeGroupIndex].id : generateId(),
        title: 'Tamanhos',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: optionGroups[sizeGroupIndex]?.options.find(o => o.name === 'P')?.id || generateId(), name: 'P', price: Number(marmitaPriceP), available: true },
          { id: optionGroups[sizeGroupIndex]?.options.find(o => o.name === 'M')?.id || generateId(), name: 'M', price: Number(marmitaPriceM), available: true }
        ]
      };
      
      if (sizeGroupIndex >= 0) {
        optionGroups[sizeGroupIndex] = newSizeGroup;
      } else {
        optionGroups.unshift(newSizeGroup);
      }
      itemToSave.optionGroups = optionGroups;
    }

    if (itemToSave.name && itemToSave.categoryId && itemToSave.price !== undefined && !Number.isNaN(itemToSave.price)) {
      const images = (itemToSave.images && itemToSave.images.length > 0) ? itemToSave.images : ['https://via.placeholder.com/150'];
      if (editingItem) {
        updateMenuItem(editingItem.id, { ...itemToSave, images } as MenuItem);
        setEditingItem(null);
        notify('Produto atualizado!');
      } else {
        addMenuItem({ ...itemToSave, images } as Omit<MenuItem, 'id'>);
        setNewItem(defaultNewItem);
      }
      setIsAddingItem(false);
    } else {
      notify('Preencha os campos obrigatórios.', 'error');
    }
  };

  // --- HELPERS FOR ITEM FORM ---
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsAddingItem(false);
    const isMarmita = categorias.find(c => c.id === item.categoryId)?.name?.toLowerCase().includes('marmita');
    const sizeGroup = item.optionGroups.find(g => g.title === 'Tamanhos');
    if (isMarmita && sizeGroup) {
      setMarmitaPriceP(sizeGroup.options.find(o => o.name === 'P')?.price ?? '');
      setMarmitaPriceM(sizeGroup.options.find(o => o.name === 'M')?.price ?? '');
    } else {
      setMarmitaPriceP('');
      setMarmitaPriceM('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewItem = () => {
    setEditingItem(null);
    setNewItem(defaultNewItem);
    setIsAddingItem(!isAddingItem);
    setMarmitaPriceP('');
    setMarmitaPriceM('');
  };

  const currentFormItem = editingItem || newItem;
  const setCurrentFormItem = editingItem ? setEditingItem : setNewItem;

  const handleAddImage = (img: string) => setCurrentFormItem(prev => ({ ...prev, images: [...(prev.images || []), img] } as any));
  const handleRemoveImage = (index: number) => setCurrentFormItem(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) } as any));

  const addOptionGroup = () => {
    const newGroup: ProductOptionGroup = { id: generateId(), title: 'Tamanho', required: true, min: 1, max: 1, options: [{ id: generateId(), name: 'Pequena', price: 0, available: true }] };
    setCurrentFormItem(prev => ({ ...prev, optionGroups: [...(prev.optionGroups || []), newGroup] }));
  };
  const updateOptionGroup = (gid: string, up: Partial<ProductOptionGroup>) => setCurrentFormItem(prev => ({ ...prev, optionGroups: prev.optionGroups?.map(g => g.id === gid ? { ...g, ...up } : g) }));
  const removeOptionGroup = (gid: string) => setCurrentFormItem(prev => ({ ...prev, optionGroups: prev.optionGroups?.filter(g => g.id !== gid) }));
  const addOption = (gid: string) => setCurrentFormItem(prev => ({ ...prev, optionGroups: prev.optionGroups?.map(g => g.id === gid ? { ...g, options: [...g.options, { id: generateId(), name: '', price: 0, available: true }] } : g) }));
  const updateOption = (gid: string, oid: string, field: keyof ProductOption, val: string | number | boolean) => setCurrentFormItem(prev => ({ ...prev, optionGroups: prev.optionGroups?.map(g => g.id === gid ? { ...g, options: g.options.map(o => o.id === oid ? { ...o, [field]: val } : o) } : g) }));
  const removeOption = (gid: string, oid: string) => setCurrentFormItem(prev => ({ ...prev, optionGroups: prev.optionGroups?.map(g => g.id === gid ? { ...g, options: g.options.filter(o => o.id !== oid) } : g) }));

  // --- CATEGORY LOGIC ---
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName);
      setNewCategoryName('');
    }
  };

  // --- DELIVERY CONFIG LOGIC ---
  const addNeighborhood = () => {
    if (newNeighborhood && newNeighborhoodFee) {
      // Handle comma input (e.g. 5,00 -> 5.00)
      const priceValue = parseFloat(newNeighborhoodFee.replace(',', '.'));

      if (isNaN(priceValue)) {
        notify('Valor da taxa inválido.', 'error');
        return;
      }

      const neighborhoods = restaurantInfo.delivery?.neighborhoods || [];
      const updated = [...neighborhoods, { name: newNeighborhood, price: priceValue }];

      updateRestaurantInfo({
        delivery: {
          ...restaurantInfo.delivery,
          neighborhoods: updated
        }
      });

      setNewNeighborhood('');
      setNewNeighborhoodFee('');
      notify('Bairro adicionado!');
    } else {
      notify('Preencha nome e taxa.', 'error');
    }
  };

  const removeNeighborhood = (name: string) => {
    const neighborhoods = restaurantInfo.delivery?.neighborhoods || [];
    const updated = neighborhoods.filter(n => n.name !== name);
    updateRestaurantInfo({ delivery: { ...restaurantInfo.delivery, neighborhoods: updated } });
  };

  // --- LOGIN SCREEN ---
  if (!isAdminMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary"><Lock size={40} /></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Painel Diih</h1>
          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            <div>
              <label className="block text-left text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <input type="text" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-white border border-gray-200 rounded-xl text-center text-lg outline-none focus:ring-2 focus:ring-primary mb-3" autoFocus />
              <label className="block text-left text-sm font-medium text-gray-700 mb-1">Senha de Acesso (Admin)</label>
              <input type="password" placeholder="***" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-white border border-gray-200 rounded-xl text-center text-lg outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition-transform active:scale-95 flex items-center justify-center gap-2">Entrar</button>
          </form>
          <button
            onClick={handleResetPassword}
            className="mt-4 text-xs text-gray-400 hover:text-primary underline"
          >
            Esqueceu as credenciais? Resetar para "admin"
          </button>
          <Link to="/" className="block mt-6 text-gray-400 hover:text-gray-600 text-sm">Voltar para o Início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-[#111827] text-white p-4 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link to="/"><ArrowLeft className="text-gray-400" /></Link>
            <h1 className="text-xl font-bold">Painel Diih</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => notify('Som ativado!', 'info'));
              }}
              className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-red-300 flex items-center gap-1"
            >
              <Volume2 size={12} /> Ativar Som
            </button>
            <button onClick={handleLogout} className="bg-white/10 p-1.5 rounded-full text-gray-300"><LogOut size={16} /></button>
          </div>
        </div>

        {/* Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#1F2937] p-3 rounded-xl border border-gray-700">
              <p className="text-[10px] text-gray-400 uppercase">Faturamento</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0))}
              </p>
            </div>
            <div className="bg-[#1F2937] p-3 rounded-xl border border-gray-700 text-center">
              <p className="text-[10px] text-gray-400 uppercase">Ativos</p>
              <p className="text-lg font-bold text-blue-400">{menuItems.filter(i => i.available).length}</p>
            </div>
            <div className="bg-[#1F2937] p-3 rounded-xl border border-gray-700 text-center">
              <p className="text-[10px] text-gray-400 uppercase">Pedidos</p>
              <p className="text-lg font-bold text-white">{orders.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Navigation */}
      <div className="mx-4 -mt-12 bg-gray-50 rounded-2xl shadow-lg p-2 flex justify-between gap-1 border border-gray-200 relative z-10">
        <NavItem id="dashboard" icon={PieChart} label="Visão" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="orders" icon={ListOrdered} label="Pedidos" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="menu" icon={Coffee} label="Cardápio" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="categorias" icon={Tags} label="Categorias" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="config" icon={Settings} label="Config" activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="p-4">
        {/* Global Storage Warning */}
        {!storageStatus.exists && storageStatus.checked && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                <Settings size={20} />
              </div>
              <div>
                <h4 className="font-bold text-orange-800 text-sm">Erro de Configuração: Pasta de Imagens</h4>
                <p className="text-xs text-orange-700 mt-1">O bucket 'images' não existe no seu Supabase. Você não conseguirá enviar fotos até corrigir isso.</p>
                <button onClick={() => setActiveTab('config')} className="mt-2 text-xs font-bold text-orange-600 underline">Ver como resolver</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="text-center text-gray-500 mt-10">
            <p>Selecione uma opção acima para gerenciar.</p>
          </div>
        )}

        {/* TAB: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <h2 className="font-bold text-gray-800 text-lg">Pedidos</h2>
              {orders.length > 0 && (
                <button 
                  onClick={clearOrders}
                  className="bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} /> Zerar Pedidos
                </button>
              )}
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">Sem pedidos recentes.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">#{order.id.slice(-4)}</h3>
                      <p className="text-sm text-gray-500">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Data inválida'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                          order.status === 'preparing' ? 'bg-orange-100 text-orange-600' :
                            order.status === 'delivering' ? 'bg-purple-100 text-purple-600' :
                              order.status === 'completed' ? 'bg-green-100 text-green-600' :
                                'bg-red-100 text-red-600'}`}>
                      {order.status === 'pending' ? 'Pendente' :
                        order.status === 'accepted' ? 'Aceito' :
                          order.status === 'preparing' ? 'Preparando' :
                            order.status === 'delivering' ? 'Em Entrega' :
                              order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                    </div>
                  </div>

                  <div className="border-t border-b border-gray-50 py-3 my-3 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600"><span className="font-bold text-gray-800">{item.quantity}x</span> {item.name}</span>
                        <span className="text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm text-gray-500 pt-1">
                        <span>Taxa de Entrega</span>
                        <span>{formatCurrency(order.deliveryFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                      <p className="text-xl font-bold text-gray-800">{formatCurrency(order.total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Pagamento</p>
                      <p className="text-sm font-medium text-gray-700">{order.paymentMethod} {order.changeFor && `(Troco p/ ${order.changeFor})`}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl mb-4 text-sm text-gray-600">
                    <p><span className="font-bold">Endereço:</span> {order.address}, {order.number} - {order.neighborhood}</p>
                    {order.notes && <p className="mt-1"><span className="font-bold">Obs:</span> {order.notes}</p>}
                    {order.needCutlery && <p className="mt-1"><span className="font-bold">Talheres:</span> {order.needCutlery}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-50 text-red-500 py-2 rounded-lg font-bold text-sm hover:bg-red-100">Recusar</button>
                        <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="bg-green-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-600 shadow-sm">Aceitar Pedido</button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="col-span-2 bg-orange-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-600 shadow-sm">Iniciar Preparo</button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="col-span-2 bg-purple-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-purple-600 shadow-sm">Saiu para Entrega</button>
                    )}
                    {order.status === 'delivering' && (
                      <button onClick={() => updateOrderStatus(order.id, 'completed')} className="col-span-2 bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700 shadow-sm">Finalizar Pedido</button>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <div className="col-span-2 text-center text-xs text-gray-400 py-2">Pedido Arquivado</div>
                    )}

                    {/* WhatsApp Contact Button */}
                    <button
                      onClick={() => {
                        const msg = `Olá ${order.customerName}! Sou da Marmitaria da Diih sobre seu pedido *#${order.id.slice(-4)}*.`;
                        window.open(`https://wa.me/${restaurantInfo.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="col-span-2 mt-2 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" />
                      Contatar Cliente
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: CATEGORIAS */}
        {activeTab === 'categorias' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-bold text-lg text-gray-800">Gerenciar</h2>
                <h3 className="text-lg font-bold text-gray-800 -mt-1">Categorias</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-red-50 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Plus size={12} /> Nova Categoria
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da Categoria"
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none"
              />
              <button onClick={handleAddCategory} className="bg-primary text-white rounded-lg px-4 font-bold">OK</button>
            </div>

            <div className="space-y-3">
              {categorias.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    {/* Enhanced Toggle Button */}
                    <button onClick={() => updateCategory(cat.id, { active: !cat.active })} className={`w-12 h-8 rounded-full p-1 transition-colors flex items-center shadow-inner cursor-pointer relative ${cat.active ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                      <div className="w-6 h-6 rounded-full bg-white shadow-sm absolute pointer-events-none transition-all duration-300" style={{ left: cat.active ? 'calc(100% - 28px)' : '4px' }} />
                    </button>
                    <span className="text-xs text-gray-500 font-medium w-8 text-center">{cat.active ? 'ON' : 'OFF'}</span>
                    <button onClick={() => removeCategory(cat.id)} className="text-red-400 p-2 bg-white rounded shadow-sm hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: MENU */}
        {activeTab === 'menu' && (
          <>
            <button
              onClick={handleAddNewItem}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold mb-6 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
            >
              {isAddingItem ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Adicionar Novo Produto</>}
            </button>

            {(isAddingItem || editingItem) && (
              <form onSubmit={handleSaveItem} className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-200 animate-in slide-in-from-top-4">
                <h3 className="font-bold text-lg mb-4">{editingItem ? 'Editar Produto' : 'Novo Produto'}</h3>

                <div className="space-y-4">
                  {/* Images */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {currentFormItem.images?.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                      </div>
                    ))}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden border-2 border-dashed border-gray-300">
                      <ImageEditable src="" alt="" onUpdate={handleAddImage} className="absolute inset-0 opacity-0" />
                      <Plus className="text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <input required placeholder="Nome do Produto" value={currentFormItem.name || ''} onChange={e => setCurrentFormItem({ ...currentFormItem, name: e.target.value })} className="p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold" />
                  </div>
                  <select value={currentFormItem.categoryId || ''} onChange={e => setCurrentFormItem({ ...currentFormItem, categoryId: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none">
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <textarea placeholder="Descrição" value={currentFormItem.description || ''} onChange={e => setCurrentFormItem({ ...currentFormItem, description: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none h-20 resize-none" />

                  {/* Price */}
                  {categorias.find(c => c.id === currentFormItem.categoryId)?.name?.toLowerCase().includes('marmita') ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço P (R$)</label>
                         <input type="number" step="0.01" min="0" placeholder="0.00" value={marmitaPriceP} onChange={e => setMarmitaPriceP(parseFloat(e.target.value) || '')} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço M (R$)</label>
                         <input type="number" step="0.01" min="0" placeholder="0.00" value={marmitaPriceM} onChange={e => setMarmitaPriceM(parseFloat(e.target.value) || '')} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Preço (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={currentFormItem.price !== undefined && !Number.isNaN(currentFormItem.price) ? currentFormItem.price : ''}
                        onChange={e => setCurrentFormItem({ ...currentFormItem, price: parseFloat(e.target.value) })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {/* Option Groups */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-sm text-gray-600">Grupos de Opções (Complementos)</span>
                      <button type="button" onClick={addOptionGroup} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">Add Grupo</button>
                    </div>
                    {currentFormItem.optionGroups?.map(g => (
                      <div key={g.id} className="bg-white p-3 rounded-lg mb-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <input value={g.title || ''} onChange={e => updateOptionGroup(g.id, { title: e.target.value })} className="w-full font-bold text-sm outline-none border-b border-gray-200 bg-white placeholder-gray-300" placeholder="Título do Grupo (ex: Tamanho)" />
                          </div>
                          <button type="button" onClick={() => removeOptionGroup(g.id)} className="text-red-400 ml-2"><Trash2 size={14} /></button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3 bg-gray-50 p-2 rounded">
                          <button
                            type="button"
                            onClick={() => updateOptionGroup(g.id, { required: !g.required, min: !g.required ? 1 : 0 })}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-colors border ${g.required ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}
                          >
                            {g.required ? 'Obrigatório' : 'Opcional'}
                          </button>

                          <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                            <span>Min:</span>
                            <input type="number" min="0" value={g.min !== undefined && !Number.isNaN(g.min) ? g.min : ''} onChange={e => updateOptionGroup(g.id, { min: parseInt(e.target.value) })} className="w-10 p-1 border border-gray-300 rounded text-center bg-white outline-none focus:border-primary" />
                            <span>Max:</span>
                            <input type="number" min="1" value={g.max !== undefined && !Number.isNaN(g.max) ? g.max : ''} onChange={e => updateOptionGroup(g.id, { max: parseInt(e.target.value) })} className="w-10 p-1 border border-gray-300 rounded text-center bg-white outline-none focus:border-primary" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          {g.options.map(o => (
                            <div key={o.id} className="flex gap-2 items-center text-xs">
                              <input value={o.name || ''} onChange={e => updateOption(g.id, o.id, 'name', e.target.value)} className="flex-1 bg-white border border-gray-200 p-1.5 rounded outline-none focus:border-gray-400" placeholder="Nome da Opção" />
                              <input type="number" value={o.price !== undefined && !Number.isNaN(o.price) ? o.price : ''} onChange={e => updateOption(g.id, o.id, 'price', parseFloat(e.target.value))} className="w-16 bg-white border border-gray-200 p-1.5 rounded outline-none focus:border-gray-400" placeholder="R$ 0.00" />
                              <button type="button" onClick={() => removeOption(g.id, o.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addOption(g.id)} className="text-xs text-primary font-bold mt-2 flex items-center gap-1 hover:underline"><Plus size={10} /> Adicionar Opção</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="w-full bg-green-500 text-white py-3 rounded-xl font-bold">Salvar Alterações</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm flex items-center gap-3">
                  <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 leading-tight">{item.name}</h4>
                    <p className="text-xs text-gray-500">{categorias.find(c => c.id === item.categoryId)?.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                      <Layout size={10} /> {item.optionGroups.length} variações
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMenuItem(item.id, { available: !item.available })} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.available ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                      <Power size={20} className="pointer-events-none" />
                    </button>
                    <button onClick={() => handleEditItem(item)} className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Edit3 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB: CONFIG */}
        {activeTab === 'config' && (
          <div className="space-y-6">

            {/* Storage Warning */}
            {!storageStatus.exists && storageStatus.checked && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-800 text-sm">Atenção: Pasta de Imagens não encontrada</h4>
                    <p className="text-xs text-orange-700 mt-1">{storageStatus.message || "O bucket 'images' não existe no seu Supabase. Você não conseguirá enviar fotos de produtos até corrigir isso."}</p>
                  </div>
                </div>

                <div className="bg-white/50 p-3 rounded-xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-800 uppercase mb-2">Como resolver manualmente:</p>
                  <ol className="text-[10px] text-orange-700 space-y-1 list-decimal ml-4">
                    <li>Acesse o painel do Supabase.</li>
                    <li>Vá em <b>SQL Editor</b>.</li>
                    <li>Clique em <b>New Query</b>.</li>
                    <li>Cole o código abaixo e clique em <b>Run</b>.</li>
                  </ol>
                  <div className="mt-3 relative">
                    <pre className="text-[9px] bg-gray-900 text-gray-300 p-2 rounded overflow-x-auto font-mono">
                      {`insert into storage.buckets (id, name, public) 
values ('images', 'images', true) 
on conflict (id) do nothing;

create policy "Public Access" 
on storage.objects for all 
using ( bucket_id = 'images' ) 
with check ( bucket_id = 'images' );`}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;\ncreate policy "Public Access" on storage.objects for all using ( bucket_id = 'images' ) with check ( bucket_id = 'images' );`);
                        notify('SQL copiado para a área de transferência!', 'success');
                      }}
                      className="absolute top-1 right-1 bg-gray-700 text-white px-2 py-1 rounded text-[8px] hover:bg-gray-600"
                    >
                      Copiar SQL
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSetupStorage}
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-xs font-bold shadow-sm"
                  >
                    Tentar Corrigir Automaticamente
                  </button>
                  <button
                    onClick={async () => {
                      const result = await api.checkStorage();
                      setStorageStatus({ checked: true, exists: result.exists, message: result.message });
                      if (result.exists) notify('Bucket encontrado!', 'success');
                      else notify('Ainda não encontrado.', 'info');
                    }}
                    className="bg-white text-orange-600 border border-orange-200 px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Verificar Novamente
                  </button>
                </div>
              </div>
            )}

            {/* Delivery Section */}
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><span className="text-xl">🛵</span> Configuração de Entregas</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Taxa Padrão (Sem bairro selecionado)</label>
                  <input
                    type="number"
                    value={restaurantInfo.delivery?.standardFee !== undefined && !Number.isNaN(restaurantInfo.delivery?.standardFee) ? restaurantInfo.delivery.standardFee : 0}
                    onChange={e => updateRestaurantInfo({ delivery: { ...restaurantInfo.delivery, standardFee: parseFloat(e.target.value) } })}
                    className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Taxas por Bairro</label>
                    <button onClick={addNeighborhood} className="text-xs bg-gray-100 px-2 py-1 rounded font-bold hover:bg-gray-200">+ Adicionar Bairro</button>
                  </div>

                  {/* Add New Inputs */}
                  <div className="flex gap-2 mb-3">
                    <input placeholder="Nome do Bairro" value={newNeighborhood} onChange={e => setNewNeighborhood(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
                    <input placeholder="R$" type="text" value={newNeighborhoodFee} onChange={e => setNewNeighborhoodFee(e.target.value)} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
                  </div>

                  <div className="space-y-2">
                    {restaurantInfo.delivery?.neighborhoods?.map((n, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <input 
                          type="text" 
                          value={n.name} 
                          onChange={e => {
                            const newHoods = [...(restaurantInfo.delivery?.neighborhoods || [])];
                            newHoods[idx] = { ...newHoods[idx], name: e.target.value };
                            updateRestaurantInfo({ delivery: { ...restaurantInfo.delivery, neighborhoods: newHoods } });
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded p-1.5 text-sm outline-none focus:border-primary"
                        />
                        <div className="flex items-center bg-white border border-gray-200 rounded focus-within:border-primary">
                          <span className="pl-2 text-gray-400 text-xs">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={n.price}
                            onChange={e => {
                              const newHoods = [...(restaurantInfo.delivery?.neighborhoods || [])];
                              newHoods[idx] = { ...newHoods[idx], price: parseFloat(e.target.value) || 0 };
                              updateRestaurantInfo({ delivery: { ...restaurantInfo.delivery, neighborhoods: newHoods } });
                            }}
                            className="w-16 p-1.5 text-sm outline-none text-center rounded-r"
                          />
                        </div>
                        <button onClick={() => removeNeighborhood(n.name)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 italic">* O sistema por Bairro é gratuito e mais preciso para deliverys locais.</p>
                </div>
              </div>
            </div>

            {/* Visual Identity */}
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Identidade Visual</h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome do App</label>
                  <input value={restaurantInfo.name || ''} onChange={e => updateRestaurantInfo({ name: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                    <ImageEditable src={restaurantInfo.logo} alt="Logo" onUpdate={img => updateRestaurantInfo({ logo: img })} className="w-full h-full" overlayText="Logo" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Logo do App</label>
                    <button className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold mt-1 flex items-center justify-center gap-2"><ImagePlus size={14} /> Alterar Logo</button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Banner da Capa</label>
                  <div className="h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
                    <ImageEditable src={restaurantInfo.banner} alt="Banner" onUpdate={img => updateRestaurantInfo({ banner: img })} className="w-full h-full" overlayText="Alterar Banner" />
                  </div>
                  <button className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold mt-2 flex items-center justify-center gap-2"><ImagePlus size={14} /> Alterar Banner</button>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><Lock size={16} /> Credenciais de Acesso (Admin)</h3>
              <div className="space-y-3 mt-3">
                <div>
                  <label className="text-xs font-bold text-red-700 uppercase">Usuário</label>
                  <input type="text" value={restaurantInfo.adminUsername || 'admin'} onChange={e => updateRestaurantInfo({ adminUsername: e.target.value })} className="w-full p-3 bg-white border border-red-200 rounded-xl mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-red-700 uppercase">Senha</label>
                  <input type="text" value={restaurantInfo.adminPassword || 'admin'} onChange={e => updateRestaurantInfo({ adminPassword: e.target.value })} className="w-full p-3 bg-white border border-red-200 rounded-xl mt-1" />
                </div>
              </div>
              <p className="text-[10px] text-red-400 mt-2">Essas credenciais serão solicitadas ao entrar no painel.</p>
            </div>

            {/* Store Info */}
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Informações da Loja</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Endereço da Loja</label>
                  <input value={restaurantInfo.address || ''} onChange={e => updateRestaurantInfo({ address: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Horário de Funcionamento</label>
                  <input value={restaurantInfo.businessHours || ''} onChange={e => updateRestaurantInfo({ businessHours: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp da Loja (Somente números, ex: 5511999999999)</label>
                  <input value={restaurantInfo.whatsappNumber || ''} onChange={e => updateRestaurantInfo({ whatsappNumber: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" placeholder="5511999999999" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Instagram (URL Completa)</label>
                  <input value={restaurantInfo.instagramUrl || ''} onChange={e => updateRestaurantInfo({ instagramUrl: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Facebook (URL Completa)</label>
                  <input value={restaurantInfo.facebookUrl || ''} onChange={e => updateRestaurantInfo({ facebookUrl: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>
              </div>
            </div>

            {/* Advanced / Troubleshooting */}
            <div className="bg-gray-200 p-5 rounded-2xl border border-gray-300">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">⚙️ Avançado</h3>
              <div className="space-y-3">
                <button
                  onClick={syncToCloud}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  Sincronizar Dados com a Nuvem
                </button>
                <p className="text-[10px] text-gray-500 text-center">Use isso se você configurou o Supabase agora e quer subir seus pratos e configurações locais.</p>

                <div className="pt-4 border-t border-gray-300 mt-4">
                  <button
                    onClick={handleSetupStorage}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md mb-3"
                  >
                    <ImagePlus size={18} /> Configurar Pasta de Imagens (Storage)
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mb-4">Clique aqui se estiver recebendo erro ao enviar fotos. Isso tentará criar a pasta 'images' no seu Supabase.</p>

                  <button
                    onClick={resetToDefaults}
                    className="w-full bg-white text-red-600 border border-red-200 py-3 rounded-xl font-bold text-sm"
                  >
                    Resetar Sistema (Padrão de Fábrica)
                  </button>
                  <p className="text-[10px] text-red-400 text-center mt-1">Atenção: Isso apaga tudo e restaura os dados iniciais.</p>
                </div>
              </div>
            </div>

            {/* Pix */}
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Configuração do Pix (Recebimento)</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Sua Chave Pix</label>
                <input value={restaurantInfo.pixKey || ''} onChange={e => updateRestaurantInfo({ pixKey: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                <p className="text-[10px] text-gray-400 mt-1">Isso gerará o QR Code automático.</p>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome do Titular</label>
                  <input value={restaurantInfo.pixName || ''} onChange={e => updateRestaurantInfo({ pixName: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Cidade do Titular</label>
                  <input value={restaurantInfo.pixCity || ''} onChange={e => updateRestaurantInfo({ pixCity: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl mt-1 bg-white" />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Cores do App</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Cor Primária (Botões)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={restaurantInfo.style?.primaryColor || '#DC2626'} onChange={e => updateRestaurantInfo({ style: { ...(restaurantInfo.style || {}), primaryColor: e.target.value } })} className="w-10 h-10 rounded cursor-pointer border-none" />
                    <span className="text-xs text-gray-400">{restaurantInfo.style?.primaryColor || '#DC2626'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Cor dos Preços</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={restaurantInfo.style?.priceColor || '#DC2626'} onChange={e => updateRestaurantInfo({ style: { ...(restaurantInfo.style || {}), priceColor: e.target.value } })} className="w-10 h-10 rounded cursor-pointer border-none" />
                    <span className="text-xs text-gray-400">{restaurantInfo.style?.priceColor || '#DC2626'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Fundo dos Cards/Campos</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={restaurantInfo.style?.cardColor || '#ffffff'} onChange={e => updateRestaurantInfo({ style: { ...(restaurantInfo.style || {}), cardColor: e.target.value } })} className="w-10 h-10 rounded cursor-pointer border-none border border-gray-200" />
                    <span className="text-xs text-gray-400">{restaurantInfo.style?.cardColor || '#ffffff'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Fundo do App</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={restaurantInfo.style?.backgroundColor || '#F9FAFB'} onChange={e => updateRestaurantInfo({ style: { ...(restaurantInfo.style || {}), backgroundColor: e.target.value } })} className="w-10 h-10 rounded cursor-pointer border-none border border-gray-200" />
                    <span className="text-xs text-gray-400">{restaurantInfo.style?.backgroundColor || '#F9FAFB'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-10"></div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;