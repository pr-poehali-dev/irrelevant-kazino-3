import Icon from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';

const LEVELS = [
  { idx:  1, name: 'Новобранец',   xp: 0,        discount: 0,  color: 'text-muted-foreground' },
  { idx:  2, name: 'Игрок',        xp: 500,       discount: 0,  color: 'text-slate-400' },
  { idx:  3, name: 'Опытный',      xp: 1500,      discount: 2,  color: 'text-green-400' },
  { idx:  4, name: 'Ветеран',       xp: 3000,      discount: 3,  color: 'text-teal-400' },
  { idx:  5, name: 'Мастер',        xp: 6000,      discount: 5,  color: 'text-cyan-400' },
  { idx:  6, name: 'Элита',         xp: 10000,     discount: 7,  color: 'text-blue-400' },
  { idx:  7, name: 'Чемпион',       xp: 18000,     discount: 8,  color: 'text-indigo-400' },
  { idx:  8, name: 'Легенда',       xp: 30000,     discount: 10, color: 'text-violet-400' },
  { idx:  9, name: 'Эксперт',       xp: 50000,     discount: 12, color: 'text-purple-400' },
  { idx: 10, name: 'Профессионал',  xp: 80000,     discount: 13, color: 'text-fuchsia-400' },
  { idx: 11, name: 'Гроссмейстер',  xp: 120000,    discount: 15, color: 'text-pink-400' },
  { idx: 12, name: 'Вице-король',    xp: 180000,    discount: 16, color: 'text-rose-400' },
  { idx: 13, name: 'Король',         xp: 260000,    discount: 17, color: 'text-orange-400' },
  { idx: 14, name: 'Граф',           xp: 360000,    discount: 18, color: 'text-amber-400' },
  { idx: 15, name: 'Герцог',         xp: 500000,    discount: 19, color: 'text-yellow-400' },
  { idx: 16, name: 'Принц',          xp: 700000,    discount: 20, color: 'text-lime-400' },
  { idx: 17, name: 'Элитный',        xp: 1000000,   discount: 21, color: 'text-emerald-400' },
  { idx: 18, name: 'Премиум',        xp: 1500000,   discount: 22, color: 'text-cyan-300' },
  { idx: 19, name: 'VIP-Про',        xp: 2200000,   discount: 23, color: 'text-sky-300' },
  { idx: 20, name: 'Бессмертный',    xp: 3000000,   discount: 25, color: 'text-accent' },
];

const VIP_TIERS = [
  { level: 0, name: 'Стандарт', need: 0,       perk: 'Стартовый баланс 1000 Plazma',        color: 'text-muted-foreground' },
  { level: 1, name: 'Бронза',   need: 5000,    perk: '+2% кэшбэк, приоритетная поддержка',  color: 'text-amber-600' },
  { level: 2, name: 'Серебро',  need: 25000,   perk: '+5% кэшбэк, бонусы к заданиям',       color: 'text-slate-300' },
  { level: 3, name: 'Золото',   need: 100000,  perk: '+8% кэшбэк, эксклюзивные кейсы',      color: 'text-yellow-400' },
  { level: 4, name: 'Платина',  need: 500000,  perk: '+12% кэшбэк, личный менеджер',         color: 'text-cyan-300' },
  { level: 5, name: 'Алмаз',   need: 2000000, perk: '+15% кэшбэк, VIP-турниры, приоритет', color: 'text-fuchsia-400' },
];

export default function Vip() {
  const { user } = useAuth();
  const wagered = user?.total_wagered || 0;
  const userXp = user?.xp || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Crown" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Система лояльности</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Уровень растёт с опытом (XP за ставки). VIP-статус — от суммы ставок.
        </p>
      </div>

      {/* Player levels */}
      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Icon name="Star" size={18} className="text-accent" /> Уровни игрока — скидки на Plazma
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LEVELS.map((l) => {
            const reached = userXp >= l.xp;
            const current = user?.level === l.idx;
            return (
              <div key={l.idx} className={`rounded-2xl p-4 transition ${
                current ? 'glass neon-border' : reached ? 'glass neon-cyan opacity-80' : 'bg-background/30 opacity-40'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-display font-bold text-lg ${l.color}`}>{l.idx}</span>
                  {current && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">Сейчас</span>}
                  {l.discount > 0 && <span className="text-[10px] text-primary font-semibold">−{l.discount}%</span>}
                </div>
                <div className={`font-semibold text-sm ${l.color}`}>{l.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  от {l.xp.toLocaleString()} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIP tiers */}
      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-1 flex items-center gap-2">
          <Icon name="Gem" size={18} className="text-accent" /> VIP-статус
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ваш оборот: <span className="text-accent font-semibold">{wagered.toLocaleString()} Plazma</span>
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIP_TIERS.map((t) => {
            const reached = wagered >= t.need;
            const current = (user?.vip_level || 0) === t.level;
            return (
              <div key={t.level} className={`rounded-2xl p-5 transition ${
                current ? 'glass neon-border' : reached ? 'glass neon-cyan' : 'bg-background/30 opacity-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon name="Crown" size={20} className={t.color} />
                  {current && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Ваш VIP</span>}
                </div>
                <h4 className={`font-display text-lg font-bold ${t.color}`}>{t.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{t.perk}</p>
                <div className="text-xs text-muted-foreground">
                  {reached ? '✓ Достигнут' : `Нужно ${t.need.toLocaleString()} оборота`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
