import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface HistoryRow { game: string; bet: number; payout: number; result: string; multiplier: number; created_at: string; }

const GAME_NAMES: Record<string, string> = {
  slot: '777 Слот', miner: 'Минёр', crash: 'Crash', case: 'Кейс', minedrop: 'Mine Drop',
};

const ACHIEVEMENTS = [
  { code: 'first', name: 'Первая ставка', icon: 'Play', need: (u: { games_played: number }) => u.games_played >= 1 },
  { code: 'ten', name: '10 игр', icon: 'Dices', need: (u: { games_played: number }) => u.games_played >= 10 },
  { code: 'fifty', name: '50 игр', icon: 'Flame', need: (u: { games_played: number }) => u.games_played >= 50 },
  { code: 'rich', name: '5000 выигрыша', icon: 'Gem', need: (u: { total_won: number }) => u.total_won >= 5000 },
  { code: 'lvl5', name: 'Уровень 5', icon: 'Star', need: (u: { level: number }) => u.level >= 5 },
];

export default function Profile() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    api.history().then((d) => setHistory(d.history)).catch(() => {});
  }, []);

  if (!user) return null;
  const xpInLevel = user.xp % 1000;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-3xl p-6 neon-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-display font-bold neon-border">
            {user.nickname[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">{user.nickname}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Уровень {user.level}</span>
              {user.vip_level > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">VIP {user.vip_level}</span>}
              {user.role === 'admin' && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Админ</span>}
            </div>
          </div>
        </div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Опыт</span><span>{xpInLevel} / 1000 XP</span>
        </div>
        <div className="h-2 rounded-full bg-background/70 overflow-hidden mb-6">
          <div className="h-full bg-accent" style={{ width: `${xpInLevel / 10}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Баланс', value: user.balance, icon: 'Zap' },
            { label: 'Сыграно игр', value: user.games_played, icon: 'Dices' },
            { label: 'Всего ставок', value: user.total_wagered, icon: 'TrendingUp' },
            { label: 'Всего выиграно', value: user.total_won, icon: 'Trophy' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <Icon name={s.icon} size={16} className="text-accent mb-1" />
              <div className="font-display text-xl font-bold tabular-nums">{s.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-4">Достижения</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const done = a.need(user);
            return (
              <div key={a.code} className={`rounded-2xl p-4 text-center ${done ? 'glass neon-cyan' : 'bg-background/40 opacity-50'}`}>
                <Icon name={a.icon} size={24} className={done ? 'text-accent mx-auto mb-1' : 'text-muted-foreground mx-auto mb-1'} />
                <div className="text-xs">{a.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-4">История игр</h3>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока нет игр — начни играть!</p>
        ) : (
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="font-medium">{GAME_NAMES[h.game] || h.game}</span>
                <span className="text-muted-foreground">Ставка {h.bet}</span>
                <span className={h.payout > 0 ? 'text-accent font-semibold' : 'text-destructive'}>
                  {h.payout > 0 ? `+${h.payout}` : `-${h.bet}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
