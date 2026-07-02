import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BetControl from './BetControl';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const EMOJI: Record<string, string> = {
  seven: '7️⃣', diamond: '💎', star: '⭐', cherry: '🍒', bell: '🔔', coin: '🪙',
};
const KEYS = Object.keys(EMOJI);

export default function SlotGame() {
  const { user, setUser } = useAuth();
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState(['seven', 'diamond', 'star']);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState('');

  const spin = async () => {
    if (spinning || !user) return;
    setSpinning(true); setMsg('');
    const anim = setInterval(() => {
      setReels([KEYS[Math.floor(Math.random() * 6)], KEYS[Math.floor(Math.random() * 6)], KEYS[Math.floor(Math.random() * 6)]]);
    }, 80);
    try {
      const res = await api.slot(bet);
      setTimeout(() => {
        clearInterval(anim);
        setReels(res.reels);
        setUser(res.user);
        setMsg(res.payout > 0 ? `Выигрыш +${res.payout} (x${res.multiplier})` : 'Мимо! Попробуй ещё');
        setSpinning(false);
      }, 800);
    } catch (e) {
      clearInterval(anim);
      setMsg((e as Error).message);
      setSpinning(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 neon-border max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {reels.map((r, i) => (
          <div key={i} className="h-28 rounded-2xl bg-background/70 border border-border flex items-center justify-center text-6xl neon-cyan">
            {EMOJI[r]}
          </div>
        ))}
      </div>
      <div className="h-6 text-center mb-3 font-display text-accent">{msg}</div>
      <div className="mb-4"><BetControl bet={bet} setBet={setBet} max={user?.balance || 0} /></div>
      <Button onClick={spin} disabled={spinning}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-display font-bold text-lg tracking-widest rounded-2xl animate-pulse-glow">
        {spinning ? 'КРУТИТСЯ...' : 'КРУТИТЬ'}
      </Button>
    </div>
  );
}
