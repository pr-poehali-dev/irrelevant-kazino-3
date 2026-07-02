import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import BetControl from './BetControl';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CrashGame() {
  const { user, setUser } = useAuth();
  const [bet, setBet] = useState(50);
  const [mult, setMult] = useState(1);
  const [flying, setFlying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [msg, setMsg] = useState('');
  const raf = useRef<number>();
  const crashPoint = useRef(0);
  const cashedOut = useRef(false);

  const play = async () => {
    if (flying || !user || bet > user.balance) return;
    setMsg(''); setCrashed(false); setMult(1); cashedOut.current = false;
    try {
      const res = await api.crash(bet, 1000000);
      crashPoint.current = res.crash_point;
      setUser(res.user);
      setFlying(true);
      const start = Date.now();
      const tick = () => {
        const t = (Date.now() - start) / 1000;
        const m = Math.round(Math.pow(1.08, t * 10) * 100) / 100;
        if (m >= crashPoint.current) {
          setMult(crashPoint.current);
          setCrashed(true);
          setFlying(false);
          if (!cashedOut.current) setMsg(`Краш на x${crashPoint.current}. Ставка потеряна`);
          return;
        }
        setMult(m);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    } catch (e) { setMsg((e as Error).message); }
  };

  const cashout = async () => {
    if (!flying || cashedOut.current) return;
    cashedOut.current = true;
    if (raf.current) cancelAnimationFrame(raf.current);
    setFlying(false);
    try {
      const res = await api.crash(bet, mult);
      setUser(res.user);
      setMsg(res.payout > 0 ? `Забрал +${res.payout} на x${mult}` : 'Не успел');
    } catch (e) { setMsg((e as Error).message); }
  };

  return (
    <div className="glass rounded-3xl p-6 neon-border max-w-md mx-auto">
      <div className={`h-40 rounded-2xl bg-background/70 border border-border flex items-center justify-center mb-4 ${crashed ? 'border-destructive' : ''}`}>
        <span className={`font-display text-6xl font-bold ${crashed ? 'text-destructive' : 'text-accent neon-text'}`}>
          x{mult.toFixed(2)}
        </span>
      </div>
      <div className="h-6 text-center mb-3 font-display text-accent">{msg}</div>
      <div className="mb-4"><BetControl bet={bet} setBet={setBet} max={user?.balance || 0} /></div>
      {flying ? (
        <Button onClick={cashout} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-xl">
          Забрать x{mult.toFixed(2)}
        </Button>
      ) : (
        <Button onClick={play} className="w-full bg-primary hover:bg-primary/90 font-semibold rounded-xl">
          Запустить
        </Button>
      )}
    </div>
  );
}
