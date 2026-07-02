import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Quest { code: string; progress: number; goal: number; reward: number; claimed: boolean; }

const NAMES: Record<string, { name: string; icon: string }> = {
  play: { name: 'Сыграй 5 игр', icon: 'Dices' },
  win: { name: 'Выиграй 3 раза', icon: 'Trophy' },
  bet_big: { name: 'Сделай крупную ставку', icon: 'Flame' },
};

export default function Quests() {
  const { setUser } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);

  const load = () => api.quests().then((d) => setQuests(d.quests)).catch(() => {});
  useEffect(() => { load(); }, []);

  const claim = async (code: string) => {
    try {
      const res = await api.claimQuest(code);
      setUser(res.user);
      load();
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl font-bold mb-1 flex items-center gap-2">
          <Icon name="Target" size={22} className="text-accent" /> Ежедневные задания
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Обновляются каждый день. Выполняй и получай Plazma Coin.</p>
        <div className="space-y-3">
          {quests.map((q) => {
            const info = NAMES[q.code] || { name: q.code, icon: 'Circle' };
            const done = q.progress >= q.goal;
            return (
              <div key={q.code} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name={info.icon} size={18} className="text-accent" />
                    <span className="font-medium">{info.name}</span>
                  </div>
                  <span className="text-sm text-accent font-semibold">+{q.reward}</span>
                </div>
                <div className="h-2 rounded-full bg-background/70 overflow-hidden mb-2">
                  <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, (q.progress / q.goal) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{q.progress} / {q.goal}</span>
                  <Button size="sm" disabled={!done || q.claimed} onClick={() => claim(q.code)}
                    className="bg-primary hover:bg-primary/90 rounded-lg h-7 text-xs">
                    {q.claimed ? 'Получено' : done ? 'Забрать' : 'В процессе'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
