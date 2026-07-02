import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BetControl from './BetControl';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CaseGame() {
  const { user, setUser } = useAuth();
  const [bet, setBet] = useState(50);
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [mult, setMult] = useState(0);

  const open = async () => {
    if (opening || !user || bet > user.balance) return;
    setOpening(true); setResult(null);
    try {
      const res = await api.case(bet);
      setTimeout(() => {
        setResult(res.payout);
        setMult(res.multiplier);
        setUser(res.user);
        setOpening(false);
      }, 900);
    } catch { setOpening(false); }
  };

  return (
    <div className="glass rounded-3xl p-6 neon-border max-w-md mx-auto text-center">
      <div className="h-44 rounded-2xl bg-background/70 border border-border flex flex-col items-center justify-center mb-4 neon-cyan">
        <div className={`text-7xl ${opening ? 'animate-bounce' : ''}`}>{opening ? '🎁' : result !== null ? (result > 0 ? '💰' : '📦') : '🎁'}</div>
        {result !== null && !opening && (
          <div className={`font-display text-2xl mt-2 ${result > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {result > 0 ? `+${result} Plazma (x${mult})` : 'Пусто'}
          </div>
        )}
      </div>
      <div className="mb-4"><BetControl bet={bet} setBet={setBet} max={user?.balance || 0} /></div>
      <Button onClick={open} disabled={opening}
        className="w-full bg-primary hover:bg-primary/90 font-semibold rounded-xl">
        <Icon name="Package" size={16} className="mr-1" /> {opening ? 'Открываем...' : 'Открыть кейс'}
      </Button>
    </div>
  );
}
