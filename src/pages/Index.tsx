import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import Home from '@/components/sections/Home';
import GamesCatalog from '@/components/sections/GamesCatalog';
import Profile from '@/components/sections/Profile';
import Tournaments from '@/components/sections/Tournaments';
import Quests from '@/components/sections/Quests';
import Vip from '@/components/sections/Vip';
import Shop from '@/components/sections/Shop';
import Admin from '@/components/sections/Admin';

const NAV = [
  { id: 'home', name: 'Главная', icon: 'Home', auth: false },
  { id: 'games', name: 'Игры', icon: 'Gamepad2', auth: true },
  { id: 'tournaments', name: 'Турниры', icon: 'Trophy', auth: true },
  { id: 'quests', name: 'Задания', icon: 'Target', auth: true },
  { id: 'vip', name: 'VIP', icon: 'Crown', auth: true },
  { id: 'shop', name: 'Магазин', icon: 'Coins', auth: false },
  { id: 'profile', name: 'Профиль', icon: 'User', auth: true },
];

const Index = () => {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('home');
  const [authOpen, setAuthOpen] = useState(false);

  const nav = (t: string) => {
    const item = NAV.find((n) => n.id === t) || (t === 'admin' ? { auth: true } : null);
    if (item?.auth && !user) { setAuthOpen(true); return; }
    setTab(t);
  };

  const isAdmin = user?.role === 'admin';

  const render = () => {
    if ((NAV.find((n) => n.id === tab)?.auth || tab === 'admin') && !user) {
      return <Home onNav={nav} onAuth={() => setAuthOpen(true)} />;
    }
    switch (tab) {
      case 'games': return <GamesCatalog />;
      case 'tournaments': return <Tournaments />;
      case 'quests': return <Quests />;
      case 'vip': return <Vip />;
      case 'shop': return <Shop />;
      case 'profile': return <Profile />;
      case 'admin': return isAdmin ? <Admin /> : <Home onNav={nav} onAuth={() => setAuthOpen(true)} />;
      default: return <Home onNav={nav} onAuth={() => setAuthOpen(true)} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Icon name="Loader2" size={32} className="animate-spin text-accent" />
    </div>;
  }

  return (
    <div className="min-h-screen text-foreground pb-20">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setTab('home')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary neon-border flex items-center justify-center animate-pulse-glow">
              <Icon name="Dice5" size={20} className="text-primary-foreground" />
            </div>
            <div className="leading-none text-left">
              <span className="font-display text-lg font-bold tracking-wider neon-text">IRRELEVANT</span>
              <span className="block text-[10px] tracking-[0.35em] text-accent">KAZINO</span>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => nav(n.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  tab === n.id ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}>{n.name}</button>
            ))}
            {isAdmin && (
              <button onClick={() => setTab('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'admin' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                }`}>Админка</button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass neon-cyan">
                  <Icon name="Zap" size={16} className="text-accent" />
                  <span className="font-display font-semibold tabular-nums text-sm">{user.balance.toLocaleString()}</span>
                </div>
                <button onClick={logout} className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-destructive">
                  <Icon name="LogOut" size={16} />
                </button>
              </>
            ) : (
              <Button onClick={() => setAuthOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-full">
                <Icon name="LogIn" size={16} className="mr-1" /> Войти
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {render()}
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-border">
        <div className="grid grid-cols-6">
          {NAV.filter((n) => n.id !== 'shop').map((n) => (
            <button key={n.id} onClick={() => nav(n.id)}
              className={`flex flex-col items-center gap-1 py-3 text-[10px] transition ${
                tab === n.id ? 'text-accent' : 'text-muted-foreground'
              }`}>
              <Icon name={n.icon} size={20} />
              {n.name}
            </button>
          ))}
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Index;
