import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const GAMES = [
  { id: 'slot', name: '777 Slot', desc: 'Классический неоновый слот', icon: 'Cherry', color: 'from-fuchsia-500/30 to-purple-600/10', tag: 'Хит' },
  { id: 'miner', name: 'Минёр', desc: 'Открывай ячейки, избегай мин', icon: 'Bomb', color: 'from-cyan-500/30 to-blue-600/10', tag: 'Новинка' },
  { id: 'crash', name: 'Crash', desc: 'Забери ставку до краха', icon: 'TrendingUp', color: 'from-emerald-500/30 to-teal-600/10', tag: 'Live' },
  { id: 'case', name: 'Case', desc: 'Открывай кейсы с наградами', icon: 'Package', color: 'from-amber-500/30 to-orange-600/10', tag: '' },
  { id: 'minedrop', name: 'Mine Drop', desc: 'Роняй шар сквозь поле', icon: 'CircleDot', color: 'from-rose-500/30 to-pink-600/10', tag: 'Новинка' },
];

const NAV = [
  { name: 'Главная', icon: 'Home' },
  { name: 'Игры', icon: 'Gamepad2' },
  { name: 'Турниры', icon: 'Trophy' },
  { name: 'Задания', icon: 'Target' },
  { name: 'VIP', icon: 'Crown' },
  { name: 'Профиль', icon: 'User' },
];

const SYMBOLS = ['7️⃣', '💎', '⭐', '🍒', '🔔', '💰'];

const Index = () => {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState([0, 2, 4]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const spinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spin = () => {
    if (spinning) return;
    if (bet > balance) {
      setMessage('Недостаточно Plazma Coin');
      return;
    }
    setSpinning(true);
    setMessage('');
    setBalance((b) => b - bet);

    if (spinTimeout.current) clearTimeout(spinTimeout.current);
    spinTimeout.current = setTimeout(() => {
      const result = [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
      ];
      setReels(result);
      setSpinning(false);

      if (result[0] === result[1] && result[1] === result[2]) {
        const win = bet * (result[0] === 0 ? 15 : 8);
        setBalance((b) => b + win);
        setMessage(`ДЖЕКПОТ! +${win} Plazma Coin`);
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        const win = bet * 2;
        setBalance((b) => b + win);
        setMessage(`Пара! +${win} Plazma Coin`);
      } else {
        setMessage('Повезёт в следующий раз');
      }
    }, 900);
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary neon-border flex items-center justify-center animate-pulse-glow">
              <Icon name="Dice5" size={20} className="text-primary-foreground" />
            </div>
            <div className="leading-none">
              <span className="font-display text-lg font-bold tracking-wider neon-text">IRRELEVANT</span>
              <span className="block text-[10px] tracking-[0.35em] text-accent">KAZINO</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass neon-cyan">
              <Icon name="Zap" size={16} className="text-accent" />
              <span className="font-display font-semibold tabular-nums">{balance.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">Plazma</span>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-full">
              <Icon name="LogIn" size={16} className="mr-1" /> Войти
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grid-fade">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-accent mb-6 neon-cyan">
              <Icon name="Sparkles" size={13} /> Новая игровая экосистема
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6">
              Играй в неоне.<br />
              <span className="neon-text text-primary">Побеждай</span> в <span className="text-accent">Plazma</span>.
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mb-8">
              Слоты, краш, кейсы и турниры в единой экосистеме. Валюта Plazma Coin, живая статистика и рейтинги игроков.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold rounded-full neon-border">
                <Icon name="Play" size={18} className="mr-2" /> Начать играть
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-border glass">
                <Icon name="Coins" size={18} className="mr-2" /> Купить Plazma
              </Button>
            </div>
          </div>

          {/* Slot machine */}
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="glass rounded-3xl p-6 sm:p-8 neon-border animate-float">
              <div className="flex items-center justify-between mb-5">
                <span className="font-display font-bold text-xl tracking-wide">777 SLOT</span>
                <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary">Демо-режим</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {reels.map((idx, i) => (
                  <div
                    key={i}
                    className="h-24 sm:h-28 rounded-2xl bg-background/70 border border-border flex items-center justify-center text-5xl sm:text-6xl overflow-hidden neon-cyan"
                  >
                    <span className={spinning ? 'animate-reel' : ''}>{SYMBOLS[idx]}</span>
                  </div>
                ))}
              </div>

              <div className="h-6 text-center mb-4 font-display tracking-wide text-accent">
                {message}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-muted-foreground">Ставка</span>
                <div className="flex items-center gap-1 flex-1">
                  {[10, 50, 100, 250].map((v) => (
                    <button
                      key={v}
                      onClick={() => setBet(v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                        bet === v ? 'bg-primary text-primary-foreground neon-border' : 'glass text-muted-foreground'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={spin}
                disabled={spinning}
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-display font-bold text-lg tracking-widest rounded-2xl animate-pulse-glow"
              >
                {spinning ? 'КРУТИТСЯ...' : 'CRÜTIT'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'Игроков онлайн', value: '2 480', icon: 'Users' },
            { label: 'Выплачено сегодня', value: '1.2M', icon: 'Coins' },
            { label: 'Активных турниров', value: '6', icon: 'Trophy' },
            { label: 'Крупный выигрыш', value: '84 200', icon: 'Flame' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent neon-cyan">
                <Icon name={s.icon} size={18} />
              </div>
              <div>
                <div className="font-display text-xl font-bold tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Games catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Каталог игр</h2>
            <p className="text-muted-foreground mt-1">Рабочие механики на Plazma Coin</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground">
            <Icon name="Search" size={16} /> Поиск игр
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((g, i) => (
            <div
              key={g.id}
              className={`group relative rounded-3xl p-6 overflow-hidden glass border border-border hover:neon-border transition-all duration-300 hover:-translate-y-1 animate-fade-in`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-accent neon-cyan group-hover:scale-110 transition-transform">
                    <Icon name={g.icon} size={26} />
                  </div>
                  {g.tag && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {g.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-2xl font-bold mb-1">{g.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">{g.desc}</p>
                <Button className="w-full bg-primary/90 hover:bg-primary font-semibold rounded-xl">
                  Играть <Icon name="ArrowRight" size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom nav (mobile-friendly) */}
      <nav className="sticky bottom-0 z-50 glass border-t border-border">
        <div className="max-w-7xl mx-auto px-2 grid grid-cols-6">
          {NAV.map((n, i) => (
            <button
              key={n.name}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] transition ${
                i === 0 ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={n.icon} size={20} />
              {n.name}
            </button>
          ))}
        </div>
      </nav>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Irrelevant Kazino · 18+ · Играй ответственно
      </footer>
    </div>
  );
};

export default Index;
