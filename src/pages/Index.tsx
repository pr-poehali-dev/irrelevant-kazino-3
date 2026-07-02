import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import Transfer from '@/components/Transfer';
import Home from '@/components/sections/Home';
import GamesCatalog from '@/components/sections/GamesCatalog';
import Profile from '@/components/sections/Profile';
import Tournaments from '@/components/sections/Tournaments';
import Quests from '@/components/sections/Quests';
import Vip from '@/components/sections/Vip';
import Shop from '@/components/sections/Shop';
import Admin from '@/components/sections/Admin';

const NAV = [
  { id: 'home',        name: 'Главная',   icon: 'Home',     auth: false },
  { id: 'games',       name: 'Игры',       icon: 'Gamepad2', auth: true  },
  { id: 'tournaments', name: 'Турниры',    icon: 'Trophy',   auth: true  },
  { id: 'quests',      name: 'Задания',    icon: 'Target',   auth: true  },
  { id: 'vip',         name: 'VIP',        icon: 'Crown',    auth: true  },
  { id: 'shop',        name: 'Магазин',    icon: 'Coins',    auth: false },
  { id: 'profile',     name: 'Профиль',    icon: 'User',     auth: true  },
];

export default function Index() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const nav = (t: string) => {
    const item = NAV.find((n) => n.id === t) ?? (t === 'admin' ? { auth: true } : null);
    if (item?.auth && !user) { setAuthOpen(true); return; }
    setTab(t);
    setSideOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  const renderPage = () => {
    if ((NAV.find((n) => n.id === tab)?.auth || tab === 'admin') && !user)
      return <Home onNav={nav} onAuth={() => setAuthOpen(true)} />;
    switch (tab) {
      case 'games':       return <GamesCatalog />;
      case 'tournaments': return <Tournaments />;
      case 'quests':      return <Quests />;
      case 'vip':         return <Vip />;
      case 'shop':        return <Shop />;
      case 'profile':     return <Profile />;
      case 'admin':       return isAdmin ? <Admin /> : <Home onNav={nav} onAuth={() => setAuthOpen(true)} />;
      default:            return <Home onNav={nav} onAuth={() => setAuthOpen(true)} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Icon name="Loader2" size={32} className="animate-spin text-accent" />
    </div>
  );

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside className={mobile
      ? 'flex flex-col h-full py-6 px-4'
      : 'hidden lg:flex flex-col w-64 h-screen sticky top-0 glass border-r border-border py-6 px-4 flex-shrink-0'
    }>
      {/* Logo */}
      <button onClick={() => nav('home')} className="flex items-center gap-3 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-primary neon-border flex items-center justify-center animate-pulse-glow flex-shrink-0">
          <Icon name="Dice5" size={20} className="text-primary-foreground" />
        </div>
        <div className="leading-none text-left">
          <span className="font-display text-base font-bold tracking-wider neon-text">IRRELEVANT</span>
          <span className="block text-[10px] tracking-[0.3em] text-accent">KAZINO</span>
        </div>
      </button>

      {/* Balance pill */}
      {user && (
        <div className="mx-2 mb-6 px-4 py-3 rounded-2xl glass neon-cyan flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Баланс</div>
            <div className="font-display font-bold tabular-nums text-lg leading-none mt-0.5">
              {user.balance.toLocaleString()}
            </div>
            <div className="text-[10px] text-accent">Plazma Coin</div>
          </div>
          <button onClick={() => setTransferOpen(true)}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-accent transition"
            title="Перевести Plazma">
            <Icon name="ArrowRightLeft" size={16} />
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => nav(n.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === n.id
                ? 'bg-primary/20 text-accent neon-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}>
            <Icon name={n.icon} size={18} />
            {n.name}
          </button>
        ))}
        {isAdmin && (
          <button onClick={() => nav('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'admin'
                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/5'
            }`}>
            <Icon name="ShieldAlert" size={18} />
            Админка
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 space-y-2">
        {user ? (
          <>
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground truncate">{user.nickname}</div>
              <div className="font-mono">{user.player_id && `#${user.player_id}`}</div>
              <div className="text-[10px] mt-0.5">{user.level_name || `Уровень ${user.level}`}</div>
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition">
              <Icon name="LogOut" size={16} /> Выйти
            </button>
          </>
        ) : (
          <Button onClick={() => setAuthOpen(true)}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl">
            <Icon name="LogIn" size={16} className="mr-2" /> Войти
          </Button>
        )}
        <div className="text-[10px] text-muted-foreground px-3 pb-1">Irrelevant Kazino · 18+</div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay sidebar */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-border animate-slide-in-right z-10"
            style={{ animationDirection: 'normal' }}>
            <button onClick={() => setSideOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={20} />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 glass border-b border-border">
          <div className="h-14 px-4 flex items-center justify-between">
            <button onClick={() => setSideOpen(true)} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Icon name="Menu" size={20} />
            </button>
            <div className="font-display font-bold tracking-wider neon-text text-sm">IRRELEVANT KAZINO</div>
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass neon-cyan">
                <Icon name="Zap" size={14} className="text-accent" />
                <span className="font-display font-semibold tabular-nums text-sm">{user.balance.toLocaleString()}</span>
              </div>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full text-xs h-8">
                Войти
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      {transferOpen && user && <Transfer onClose={() => setTransferOpen(false)} />}
    </div>
  );
}
