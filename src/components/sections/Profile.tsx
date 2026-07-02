import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Transfer from '@/components/Transfer';

interface HistoryRow { game: string; bet: number; payout: number; result: string; multiplier: number; created_at: string; }

const GAME_NAMES: Record<string, string> = {
  slot: '777 Слот', miner: 'Минёр', crash: 'Crash', case: 'Кейс', minedrop: 'Mine Drop', blackjack: 'Блэкджек',
};

const ACHIEVEMENTS = [
  { code: 'first', name: 'Первая ставка',  icon: 'Play',     need: (u: { games_played: number }) => u.games_played >= 1 },
  { code: 'ten',   name: '10 игр',          icon: 'Dices',    need: (u: { games_played: number }) => u.games_played >= 10 },
  { code: 'fifty', name: '50 игр',          icon: 'Flame',    need: (u: { games_played: number }) => u.games_played >= 50 },
  { code: 'rich',  name: '5000 выигрыша',   icon: 'Gem',      need: (u: { total_won: number }) => u.total_won >= 5000 },
  { code: 'lvl5',  name: 'Уровень 5',       icon: 'Star',     need: (u: { level: number }) => u.level >= 5 },
  { code: 'lvl10', name: 'Уровень 10',      icon: 'Sparkles', need: (u: { level: number }) => u.level >= 10 },
];

const XP_THRESHOLDS = [0,500,1500,3000,6000,10000,18000,30000,50000,80000,
  120000,180000,260000,360000,500000,700000,1000000,1500000,2200000,3000000];

export default function Profile() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { api.history().then((d) => setHistory(d.history)).catch(() => {}); }, []);

  if (!user) return null;

  const lvlIdx = Math.min(user.level - 1, XP_THRESHOLDS.length - 1);
  const curThresh = XP_THRESHOLDS[lvlIdx] ?? 0;
  const nextThresh = XP_THRESHOLDS[lvlIdx + 1] ?? curThresh + 1000;
  const xpInLevel = user.xp - curThresh;
  const xpRange = Math.max(1, nextThresh - curThresh);
  const xpPct = Math.min(100, Math.round((xpInLevel / xpRange) * 100));

  const copyId = () => {
    navigator.clipboard.writeText(user.player_id || String(user.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showTransfer && <Transfer onClose={() => setShowTransfer(false)} />}

      <div className="glass rounded-3xl p-6 neon-border">
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-display font-bold neon-border flex-shrink-0">
            {user.nickname[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h2 className="font-display text-2xl font-bold">{user.nickname}</h2>
              {user.vip_level > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">VIP {user.vip_level}</span>}
              {user.role === 'admin' && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Админ</span>}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {user.level_name || `Уровень ${user.level}`}
              </span>
              {(user.level_discount || 0) > 0 && (
                <span className="text-xs text-accent">−{user.level_discount}% на Plazma</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={copyId}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass neon-cyan hover:neon-border transition text-sm font-mono">
              <Icon name="Hash" size={14} className="text-accent" />
              <span>{user.player_id}</span>
              <Icon name={copied ? 'Check' : 'Copy'} size={13} className={copied ? 'text-accent' : 'text-muted-foreground'} />
            </button>
            <Button size="sm" onClick={() => setShowTransfer(true)}
              className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
              <Icon name="ArrowRightLeft" size={14} className="mr-1" /> Перевести Plazma
            </Button>
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Уровень {user.level} — {user.level_name}</span>
          <span>{xpInLevel.toLocaleString()} / {xpRange.toLocaleString()} XP</span>
        </div>
        <div className="h-2 rounded-full bg-background/70 overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${xpPct}%` }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Баланс',        value: user.balance.toLocaleString(),       icon: 'Zap' },
            { label: 'Сыграно игр',   value: user.games_played,                    icon: 'Dices' },
            { label: 'Всего ставок',  value: user.total_wagered.toLocaleString(),  icon: 'TrendingUp' },
            { label: 'Всего выиграно',value: user.total_won.toLocaleString(),       icon: 'Trophy' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <Icon name={s.icon} size={16} className="text-accent mb-1" />
              <div className="font-display text-xl font-bold tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-4">Достижения</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const done = a.need(user);
            return (
              <div key={a.code} className={`rounded-2xl p-3 text-center transition ${done ? 'glass neon-cyan' : 'bg-background/30 opacity-40'}`}>
                <Icon name={a.icon} size={22} className={`mx-auto mb-1 ${done ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className="text-[10px] leading-tight">{a.name}</div>
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
          <div className="divide-y divide-border/50">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm gap-2">
                <span className="font-medium w-24 flex-shrink-0">{GAME_NAMES[h.game] || h.game}</span>
                <span className="text-muted-foreground tabular-nums hidden sm:block">Ставка {h.bet}</span>
                <span className="text-xs text-muted-foreground hidden md:block">{h.multiplier > 0 ? `x${h.multiplier}` : '—'}</span>
                <span className={`font-semibold tabular-nums ml-auto ${h.payout > 0 ? 'text-accent' : 'text-destructive'}`}>
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
