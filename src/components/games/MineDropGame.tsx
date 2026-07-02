import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BetControl from './BetControl';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const SLOTS = [0.2, 0.5, 1.0, 1.5, 3.0, 1.5, 1.0, 0.5, 0.2, 5.0, 0.3];

export default function MineDropGame() {
  const { user, setUser } = useAuth();
  const [bet, setBet] = useState(50);
  const [dropping, setDropping] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const drop = async () => {
    if (dropping || !user || bet > user.balance) return;
    setDropping(true); setMsg(''); setLanded(null);
    try {
      const res = await api.minedrop(bet);
      setTimeout(() => {
        setLanded(res.slot);
        setUser(res.user);
        setMsg(res.payout > 0 ? `+${res.payout} Plazma (x${res.multiplier})` : `x${res.multiplier} — мало`);
        setDropping(false);
      }, 1000);
    } catch (e) { setMsg((e as Error).message); setDropping(false); }
  };

  return (
    <div className="glass rounded-3xl p-6 neon-border max-w-md mx-auto">
      <div className="relative h-40 rounded-2xl bg-background/70 border border-border mb-4 overflow-hidden">
        <div className={`absolute left-1/2 -translate-x-1/2 text-3xl ${dropping ? 'transition-all duration-1000 top-32' : 'top-2'}`}>🔵</div>
      </div>
      <div className="grid grid-cols-11 gap-0.5 mb-4">
        {SLOTS.map((s, i) => (
          <div key={i} className={`py-2 rounded text-[10px] text-center font-semibold ${
            landed === i ? 'bg-accent text-accent-foreground' : s >= 3 ? 'bg-primary/40' : 'glass text-muted-foreground'
          }`}>{s}x</div>
        ))}
      </div>
      <div className="h-6 text-center mb-3 font-display text-accent">{msg}</div>
      <div className="mb-4"><BetControl bet={bet} setBet={setBet} max={user?.balance || 0} /></div>
      <Button onClick={drop} disabled={dropping}
        className="w-full bg-primary hover:bg-primary/90 font-semibold rounded-xl">
        {dropping ? 'Падает...' : 'Бросить шар'}
      </Button>
    </div>
  );
}
