import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface AdminUser {
  id: number; player_id: string; email: string; nickname: string; balance: number; role: string;
  is_owner: boolean; is_banned: boolean; vip_level: number; level: number;
  games_played: number; total_won: number; total_wagered: number;
}
interface Overview {
  total_users: number; banned_users: number; circulating: number;
  total_games: number; total_bet: number; total_payout: number;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [q, setQ] = useState('');
  const [addAmts, setAddAmts] = useState<Record<number, string>>({});
  const [subAmts, setSubAmts] = useState<Record<number, string>>({});
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tPrize, setTPrize] = useState('');
  const [msg, setMsg] = useState('');

  const load = (query?: string) => {
    api.adminUsers(query).then((d) => setUsers(d.users)).catch(() => {});
    api.adminOverview().then((d) => setOverview(d)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const addBalance = async (id: number) => {
    const amt = parseInt(addAmts[id] || '0', 10);
    if (!amt) return;
    await api.adminAddBalance(id, amt);
    setAddAmts({ ...addAmts, [id]: '' });
    flash(`+${amt} начислено`);
    load(q);
  };

  const subBalance = async (id: number) => {
    const amt = parseInt(subAmts[id] || '0', 10);
    if (!amt) return;
    await api.adminSubBalance(id, amt);
    setSubAmts({ ...subAmts, [id]: '' });
    flash(`−${amt} снято`);
    load(q);
  };

  const toggleRole = async (u: AdminUser) => {
    await api.adminSetRole(u.id, u.role === 'admin' ? 'user' : 'admin');
    flash(u.role === 'admin' ? 'Роль снята' : 'Админка выдана');
    load(q);
  };

  const toggleBan = async (u: AdminUser) => {
    await api.adminSetBan(u.id, !u.is_banned);
    flash(u.is_banned ? 'Разбанен' : 'Забанен');
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
    flash('Турнир создан');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {msg && (
        <div className="glass rounded-2xl px-4 py-3 text-accent text-sm font-semibold border border-accent/30 animate-fade-in">
          {msg}
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Игроков', value: overview.total_users, icon: 'Users' },
            { label: 'Забанено', value: overview.banned_users, icon: 'Ban' },
            { label: 'Plazma в обороте', value: overview.circulating, icon: 'Zap' },
            { label: 'Всего игр', value: overview.total_games, icon: 'Dices' },
            { label: 'Ставок всего', value: overview.total_bet, icon: 'TrendingUp' },
            { label: 'Выплат всего', value: overview.total_payout, icon: 'Coins' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <Icon name={s.icon} size={16} className="text-accent mb-1" />
              <div className="font-display text-lg font-bold tabular-nums">{s.value.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Input placeholder="Поиск по email, нику или ID игрока" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(q)} className="bg-background/60" />
          <Button onClick={() => load(q)} className="bg-primary hover:bg-primary/90">
            <Icon name="Search" size={16} />
          </Button>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className={`glass rounded-2xl p-4 ${u.is_banned ? 'opacity-60 border border-destructive/30' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{u.nickname}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-0.5 rounded">#{u.player_id}</span>
                    {u.is_owner && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">Владелец</span>}
                    {u.role === 'admin' && !u.is_owner && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">Админ</span>}
                    {u.is_banned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Забанен</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-accent font-semibold tabular-nums">{u.balance.toLocaleString()} Plazma</div>
                  <div className="text-xs text-muted-foreground">Ур.{u.level} · VIP{u.vip_level} · {u.games_played} игр</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <div className="flex gap-2">
                  <Input placeholder="+Plazma" value={addAmts[u.id] || ''} type="number"
                    onChange={(e) => setAddAmts({ ...addAmts, [u.id]: e.target.value })}
                    className="bg-background/60 h-8 text-sm" />
                  <Button size="sm" onClick={() => addBalance(u.id)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs whitespace-nowrap">
                    + Начислить
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="−Plazma" value={subAmts[u.id] || ''} type="number"
                    onChange={(e) => setSubAmts({ ...subAmts, [u.id]: e.target.value })}
                    className="bg-background/60 h-8 text-sm" />
                  <Button size="sm" onClick={() => subBalance(u.id)}
                    className="bg-destructive/80 hover:bg-destructive h-8 text-xs whitespace-nowrap">
                    − Снять
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => changeVip(u, 1)} className="h-7 text-xs">VIP +</Button>
                <Button size="sm" variant="outline" onClick={() => changeVip(u, -1)} className="h-7 text-xs">VIP −</Button>
                {user?.is_owner && !u.is_owner && (
                  <Button size="sm" onClick={() => toggleRole(u)}
                    className={`h-7 text-xs ${u.role === 'admin' ? 'bg-muted hover:bg-muted/80 text-foreground' : 'bg-primary hover:bg-primary/90'}`}>
                    {u.role === 'admin' ? 'Снять админку' : 'Выдать админку'}
                  </Button>
                )}
                {!u.is_owner && (
                  <Button size="sm" onClick={() => toggleBan(u)}
                    className={`h-7 text-xs ${u.is_banned ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-destructive/80 hover:bg-destructive'}`}>
                    <Icon name={u.is_banned ? 'ShieldCheck' : 'Ban'} size={12} className="mr-1" />
                    {u.is_banned ? 'Разбанить' : 'Забанить'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
          <Icon name="Trophy" size={20} className="text-accent" /> Создать турнир
        </h3>
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
