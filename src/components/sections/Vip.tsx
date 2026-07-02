import Icon from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';

const TIERS = [
  { level: 0, name: 'Новичок', need: 0, perk: 'Старт с 1000 Plazma', color: 'text-muted-foreground' },
  { level: 1, name: 'Бронза', need: 5000, perk: '+2% кэшбэк с проигрышей', color: 'text-amber-600' },
  { level: 2, name: 'Серебро', need: 25000, perk: '+5% кэшбэк, бонус заданий', color: 'text-slate-300' },
  { level: 3, name: 'Золото', need: 100000, perk: '+8% кэшбэк, эксклюзив-кейсы', color: 'text-yellow-400' },
  { level: 4, name: 'Платина', need: 500000, perk: '+12% кэшбэк, личный менеджер', color: 'text-cyan-300' },
  { level: 5, name: 'Алмаз', need: 2000000, perk: '+15% кэшбэк, VIP-турниры', color: 'text-fuchsia-400' },
];

export default function Vip() {
  const { user } = useAuth();
  const wagered = user?.total_wagered || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Crown" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Система лояльности VIP</h2>
        <p className="text-sm text-muted-foreground">Твой уровень растёт от суммы ставок. Текущий оборот: {wagered.toLocaleString()} Plazma</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {TIERS.map((t) => {
          const reached = wagered >= t.need;
          const current = (user?.vip_level || 0) === t.level;
          return (
            <div key={t.level} className={`glass rounded-3xl p-5 ${current ? 'neon-border' : reached ? 'neon-cyan' : 'opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon name="Gem" size={22} className={t.color} />
                {current && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Твой уровень</span>}
              </div>
              <h3 className={`font-display text-xl font-bold ${t.color}`}>{t.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{t.perk}</p>
              <div className="text-xs text-muted-foreground">
                {reached ? 'Оборот достигнут' : `Нужно ${t.need.toLocaleString()} оборота`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
