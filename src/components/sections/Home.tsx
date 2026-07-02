import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Stats { players: number; paid_today: number; biggest_win: number; tournaments: number; }

export default function Home({ onNav, onAuth }: { onNav: (t: string) => void; onAuth: () => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user) api.gameStats().then(setStats).catch(() => {});
  }, [user]);

  const games = [
    { id: 'slot', name: '777 Слот', icon: 'Cherry' },
    { id: 'miner', name: 'Минёр', icon: 'Bomb' },
    { id: 'crash', name: 'Crash', icon: 'TrendingUp' },
    { id: 'case', name: 'Кейсы', icon: 'Package' },
    { id: 'minedrop', name: 'Mine Drop', icon: 'CircleDot' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <section className="grid-fade rounded-3xl p-8 sm:p-14 text-center mb-8 animate-fade-in">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-accent mb-6 neon-cyan">
          <Icon name="Sparkles" size={13} /> Игровая экосистема на Plazma Coin
        </span>
        <h1 className="font-display text-5xl sm:text-7xl font-bold leading-[0.95] mb-6">
          Играй в неоне.<br />
          <span className="neon-text text-primary">Побеждай</span> в <span className="text-accent">Plazma</span>.
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
          Рабочие игры, живая статистика, турниры и рейтинги. Всё на внутренней валюте Plazma Coin.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {user ? (
            <Button size="lg" onClick={() => onNav('games')} className="bg-primary hover:bg-primary/90 font-semibold rounded-full neon-border">
              <Icon name="Play" size={18} className="mr-2" /> К играм
            </Button>
          ) : (
            <Button size="lg" onClick={onAuth} className="bg-primary hover:bg-primary/90 font-semibold rounded-full neon-border">
              <Icon name="LogIn" size={18} className="mr-2" /> Начать играть
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={() => onNav('shop')} className="rounded-full border-border glass">
            <Icon name="Coins" size={18} className="mr-2" /> Купить Plazma
          </Button>
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Игроков', value: stats.players, icon: 'Users' },
            { label: 'Выплачено сегодня', value: stats.paid_today, icon: 'Coins' },
            { label: 'Активных турниров', value: stats.tournaments, icon: 'Trophy' },
            { label: 'Крупный выигрыш', value: stats.biggest_win, icon: 'Flame' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent neon-cyan">
                <Icon name={s.icon} size={18} />
              </div>
              <div>
                <div className="font-display text-xl font-bold tabular-nums">{s.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      <h2 className="font-display text-3xl font-bold mb-5">Популярные игры</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {games.map((g) => (
          <button key={g.id} onClick={() => user ? onNav('games') : onAuth()}
            className="glass rounded-3xl p-6 text-center hover:neon-border transition hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl glass mx-auto flex items-center justify-center text-accent neon-cyan mb-3">
              <Icon name={g.icon} size={26} />
            </div>
            <div className="font-display font-bold">{g.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
