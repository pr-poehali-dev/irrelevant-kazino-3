import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface AdminUser {
  id: number; email: string; nickname: string; balance: number; role: string;
  is_owner: boolean; vip_level: number; level: number; games_played: number; total_won: number;
}
interface Overview { total_users: number; circulating: number; total_games: number; total_bet: number; total_payout: number; }

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [q, setQ] = useState('');
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tPrize, setTPrize] = useState('');

  const load = (query?: string) => {
    api.adminUsers(query).then((d) => setUsers(d.users)).catch(() => {});
    api.adminOverview().then((d) => setOverview(d)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addBalance = async (id: number) => {
    const amt = parseInt(amounts[id] || '0', 10);
    if (!amt) return;
    await api.adminAddBalance(id, amt);
    setAmounts({ ...amounts, [id]: '' });
    load(q);
  };

  const toggleRole = async (u: AdminUser) => {
    await api.adminSetRole(u.id, u.role === 'admin' ? 'user' : 'admin');
    load(q);
  };

  const changeVip = async (u: AdminUser, delta: number) => {
    await api.adminSetVip(u.id, Math.max(0, Math.min(5, u.vip_level + delta)));
    load(q);
  };

  const createT = async () => {
    if (!tTitle) return;
    await api.adminCreateTournament(tTitle, tDesc, parseInt(tPrize || '0', 10));
    setTTitle(''); setTDesc(''); setTPrize('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Игроков', value: overview.total_users, icon: 'Users' },
            { label: 'Plazma в обороте', value: overview.circulating, icon: 'Zap' },
            { label: 'Всего игр', value: overview.total_games, icon: 'Dices' },
            { label: 'Ставок всего', value: overview.total_bet, icon: 'TrendingUp' },
            { label: 'Выплат всего', value: overview.total_payout, icon: 'Coins' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <Icon name={s.icon} size={16} className="text-accent mb-1" />
              <div className="font-display text-lg font-bold tabular-nums">{s.value.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Input placeholder="Поиск по email или нику" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(q)} className="bg-background/60" />
          <Button onClick={() => load(q)} className="bg-primary hover:bg-primary/90">
            <Icon name="Search" size={16} />
          </Button>
        </div>

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-semibold">{u.nickname}</span>
                  {u.is_owner && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Владелец</span>}
                  {u.role === 'admin' && !u.is_owner && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Админ</span>}
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-accent font-semibold">{u.balance.toLocaleString()} Plazma</div>
                  <div className="text-xs text-muted-foreground">Ур.{u.level} · VIP{u.vip_level} · {u.games_played} игр</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input placeholder="+/- Plazma" value={amounts[u.id] || ''} type="number"
                  onChange={(e) => setAmounts({ ...amounts, [u.id]: e.target.value })}
                  className="bg-background/60 h-8 w-32 text-sm" />
                <Button size="sm" onClick={() => addBalance(u.id)} className="bg-accent text-accent-foreground hover:bg-accent/90 h-8">
                  Начислить
                </Button>
                <Button size="sm" variant="outline" onClick={() => changeVip(u, 1)} className="h-8">VIP +</Button>
                <Button size="sm" variant="outline" onClick={() => changeVip(u, -1)} className="h-8">VIP −</Button>
                {user?.is_owner && !u.is_owner && (
                  <Button size="sm" onClick={() => toggleRole(u)}
                    className={`h-8 ${u.role === 'admin' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}>
                    {u.role === 'admin' ? 'Снять админку' : 'Выдать админку'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-3">Создать турнир</h3>
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          <Input placeholder="Название" value={tTitle} onChange={(e) => setTTitle(e.target.value)} className="bg-background/60" />
          <Input placeholder="Описание" value={tDesc} onChange={(e) => setTDesc(e.target.value)} className="bg-background/60" />
          <Input placeholder="Призовой фонд" type="number" value={tPrize} onChange={(e) => setTPrize(e.target.value)} className="bg-background/60" />
        </div>
        <Button onClick={createT} className="bg-primary hover:bg-primary/90">
          <Icon name="Plus" size={16} className="mr-1" /> Создать
        </Button>
      </div>
    </div>
  );
}
