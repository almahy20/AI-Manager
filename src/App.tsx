import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  Star, 
  TrendingUp, 
  Clock, 
  Settings, 
  Moon, 
  Sun,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit2,
  Filter,
  ArrowUpRight,
  ChevronRight,
  Tag,
  BarChart3,
  Download,
  Upload,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn, formatDate } from './utils';
import { AITool, DashboardStats } from './types';
import { fetchToolMetadata } from './services/geminiService';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-400")} />
    <span className="font-medium">{label}</span>
  </button>
);

const ToolCard = ({ tool, onUse, onEdit, onDelete, onToggleFavorite }: { 
  tool: AITool, 
  onUse: (id: string) => void, 
  onEdit: (tool: AITool) => void,
  onDelete: (id: string) => void,
  onToggleFavorite: (tool: AITool) => void
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative glass rounded-2xl p-5 hover:shadow-xl transition-all duration-300 border-indigo-50/50 dark:border-indigo-900/20"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-800">
            {tool.logo_url ? (
              <img src={tool.logo_url} alt={tool.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl font-bold text-indigo-600">{tool.name[0]}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tool.category}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onToggleFavorite(tool)}
            className={cn("p-2 rounded-lg transition-colors", tool.is_favorite ? "text-amber-400 bg-amber-50 dark:bg-amber-900/20" : "text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}
          >
            <Star size={18} fill={tool.is_favorite ? "currentColor" : "none"} />
          </button>
          <div className="relative group/menu">
             <button className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
               <MoreVertical size={18} />
             </button>
             <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block z-20 w-32 glass rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               <button onClick={() => onEdit(tool)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                 <Edit2 size={14} /> Edit
               </button>
               <button onClick={() => onDelete(tool.id)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                 <Trash2 size={14} /> Delete
               </button>
             </div>
          </div>
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4 h-10">
        {tool.description || "No description provided."}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {Array.isArray(tool.tags) && tool.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-tight">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>{tool.usage_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatDate(tool.last_used_at)}</span>
          </div>
        </div>
        <a 
          href={tool.url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => onUse(tool.id)}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all"
        >
          Launch <ArrowUpRight size={14} />
        </a>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'dashboard' | 'tools' | 'favorites' | 'stats'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'Other',
    tags: '',
    rating: 3,
    usage_level: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
    logo_url: ''
  });

  useEffect(() => {
    fetchTools();
    fetchStats();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }
  }, []);

  const fetchTools = async () => {
    const res = await fetch('/api/tools');
    const data = await res.json();
    setTools(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleUseTool = async (id: string) => {
    await fetch(`/api/tools/${id}/use`, { method: 'POST' });
    fetchTools();
    fetchStats();
  };

  const handleDeleteTool = async (id: string) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      fetchTools();
      fetchStats();
    }
  };

  const handleToggleFavorite = async (tool: AITool) => {
    await fetch(`/api/tools/${tool.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tool, is_favorite: !tool.is_favorite })
    });
    fetchTools();
  };

  const handleAutoFill = async () => {
    if (!formData.url) return;
    setIsLoadingMetadata(true);
    const metadata = await fetchToolMetadata(formData.url);
    if (metadata) {
      setFormData(prev => ({
        ...prev,
        name: metadata.name || prev.name,
        description: metadata.description || prev.description,
        category: metadata.category || prev.category,
        tags: metadata.tags?.join(', ') || prev.tags,
        logo_url: metadata.logo_url || prev.logo_url
      }));
    }
    setIsLoadingMetadata(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      id: editingTool ? editingTool.id : Math.random().toString(36).substr(2, 9),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      display_order: editingTool ? editingTool.display_order : tools.length
    };

    const method = editingTool ? 'PUT' : 'POST';
    const url = editingTool ? `/api/tools/${editingTool.id}` : '/api/tools';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setIsModalOpen(false);
    setEditingTool(null);
    setFormData({ name: '', url: '', description: '', category: 'Other', tags: '', rating: 3, usage_level: 'medium', notes: '', logo_url: '' });
    fetchTools();
    fetchStats();
  };

  const filteredTools = tools.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (view === 'favorites') return matchesSearch && t.is_favorite;
    return matchesSearch;
  });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden glass border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="text-white" size={18} />
          </div>
          <h1 className="font-display font-bold text-lg tracking-tight">AI Manager</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 glass border-r border-slate-200 dark:border-slate-800 p-6 flex-col fixed h-full z-30">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight">AI Manager</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={Filter} label="All Tools" active={view === 'tools'} onClick={() => setView('tools')} />
          <SidebarItem icon={Star} label="Favorites" active={view === 'favorites'} onClick={() => setView('favorites')} />
          <SidebarItem icon={BarChart3} label="Statistics" active={view === 'stats'} onClick={() => setView('stats')} />
        </nav>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all">
            <Download size={20} />
            <span className="font-medium">Export Data</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Slide-over */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 glass border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col z-50 lg:hidden"
            >
              <div className="flex items-center justify-between mb-10 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <LayoutDashboard className="text-white" size={24} />
                  </div>
                  <h1 className="font-display font-bold text-xl tracking-tight">AI Manager</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-2 flex-1">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={Filter} label="All Tools" active={view === 'tools'} onClick={() => { setView('tools'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={Star} label="Favorites" active={view === 'favorites'} onClick={() => { setView('favorites'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={BarChart3} label="Statistics" active={view === 'stats'} onClick={() => { setView('stats'); setIsSidebarOpen(false); }} />
              </nav>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button 
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-10 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              {view === 'dashboard' && "Welcome back"}
              {view === 'tools' && "Your AI Toolbox"}
              {view === 'favorites' && "Favorite Tools"}
              {view === 'stats' && "Usage Insights"}
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
              {view === 'dashboard' && "Here's what's happening with your tools today."}
              {view === 'tools' && `Managing ${tools.length} powerful AI applications.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search tools..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => {
                setEditingTool(null);
                setFormData({ name: '', url: '', description: '', category: 'Other', tags: '', rating: 3, usage_level: 'medium', notes: '', logo_url: '' });
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
            >
              <Plus size={20} /> <span className="whitespace-nowrap">Add Tool</span>
            </button>
          </div>
        </header>

        {view === 'dashboard' && stats && (
          <div className="space-y-10">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Total Tools', value: stats.totalTools, icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Favorites', value: tools.filter(t => t.is_favorite).length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Unused (30d)', value: stats.unusedTools.length, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Top Category', value: stats.categoryStats[0]?.category || 'N/A', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-4 md:p-6 rounded-2xl flex items-center gap-4 md:gap-5"
                >
                  <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center", stat.bg, "dark:bg-slate-800")}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10">
              {/* Most Used */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg md:text-xl font-display font-bold">Most Used Tools</h3>
                  <button onClick={() => setView('tools')} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {stats.topTools.map(tool => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool} 
                      onUse={handleUseTool} 
                      onEdit={(t) => { setEditingTool(t); setFormData({ ...t, tags: t.tags.join(', ') }); setIsModalOpen(true); }}
                      onDelete={handleDeleteTool}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-display font-bold">Categories</h3>
                <div className="glass p-4 md:p-6 rounded-2xl h-[350px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="category"
                      >
                        {stats.categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {stats.categoryStats.slice(0, 4).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-600 dark:text-slate-400">{cat.category}</span>
                        </div>
                        <span className="font-bold">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(view === 'tools' || view === 'favorites') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTools.map(tool => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  onUse={handleUseTool} 
                  onEdit={(t) => { setEditingTool(t); setFormData({ ...t, tags: t.tags.join(', ') }); setIsModalOpen(true); }}
                  onDelete={handleDeleteTool}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </AnimatePresence>
            {filteredTools.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">No tools found</h3>
                <p className="text-slate-500">Try adjusting your search or add a new tool to your collection.</p>
              </div>
            )}
          </div>
        )}

        {view === 'stats' && stats && (
          <div className="space-y-8 md:space-y-10">
             <div className="glass p-4 md:p-8 rounded-2xl">
                <h3 className="text-lg md:text-xl font-display font-bold mb-6 md:mb-8">Usage Trends</h3>
                <div className="h-[300px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tools.sort((a, b) => b.usage_count - a.usage_count).slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }} 
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                      <Tooltip 
                        cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                        contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="usage_count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">
                <div className="glass p-4 md:p-8 rounded-2xl">
                  <h3 className="text-lg md:text-xl font-display font-bold mb-6">Unused Tools (30+ Days)</h3>
                  <div className="space-y-3 md:space-y-4">
                    {stats.unusedTools.length > 0 ? stats.unusedTools.map(tool => (
                      <div key={tool.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                              {tool.logo_url ? <img src={tool.logo_url} className="w-5 h-5 md:w-6 md:h-6 object-contain" /> : <span className="font-bold text-indigo-600 text-sm">{tool.name[0]}</span>}
                           </div>
                           <div className="max-w-[120px] sm:max-w-none">
                             <p className="font-bold text-xs md:text-sm truncate">{tool.name}</p>
                             <p className="text-[10px] md:text-xs text-slate-400">Last: {formatDate(tool.last_used_at)}</p>
                           </div>
                        </div>
                        <button onClick={() => handleUseTool(tool.id)} className="text-indigo-600 font-bold text-[10px] md:text-xs hover:underline whitespace-nowrap">Launch Now</button>
                      </div>
                    )) : (
                      <p className="text-slate-500 text-center py-10 italic text-sm">All your tools are getting some love!</p>
                    )}
                  </div>
                </div>

                <div className="glass p-4 md:p-8 rounded-2xl">
                   <h3 className="text-lg md:text-xl font-display font-bold mb-6">Category Breakdown</h3>
                   <div className="space-y-4 md:space-y-6">
                      {stats.categoryStats.map((cat, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between text-xs md:text-sm">
                              <span className="font-medium">{cat.category}</span>
                              <span className="text-slate-400">{cat.count} tools</span>
                           </div>
                           <div className="w-full h-1.5 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(cat.count / tools.length) * 100}%` }}
                                className="h-full bg-indigo-600"
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl md:text-2xl font-display font-bold">{editingTool ? 'Edit Tool' : 'Add New AI Tool'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Tool URL</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      required
                      type="url" 
                      placeholder="https://chat.openai.com" 
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="flex-1 px-4 py-2.5 md:py-3 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm md:text-base"
                    />
                    <button 
                      type="button"
                      onClick={handleAutoFill}
                      disabled={isLoadingMetadata || !formData.url}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm md:text-base"
                    >
                      {isLoadingMetadata ? "Analyzing..." : "Auto-Fill"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 md:py-3 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 md:py-3 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm md:text-base"
                    >
                      {['Chat', 'Image', 'Video', 'Audio', 'Code', 'Writing', 'Productivity', 'Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="ai, chat..."
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-2.5 md:py-3 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Usage Level</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({ ...formData, usage_level: level as any })}
                          className={cn(
                            "flex-1 py-2.5 md:py-3 rounded-xl text-[10px] md:text-sm font-bold capitalize transition-all",
                            formData.usage_level === level 
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Personal Notes</label>
                  <textarea 
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 glass rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm md:text-base"
                  />
                </div>

                <div className="pt-4 md:pt-6 flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="order-2 sm:order-1 flex-1 px-6 py-3 md:py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="order-1 sm:order-2 flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 md:py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-sm md:text-base"
                  >
                    {editingTool ? 'Save Changes' : 'Add Tool'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
