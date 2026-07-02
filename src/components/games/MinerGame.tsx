import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BetControl from './BetControl';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function MinerGame() {
  const { user, setUser } = useAuth();
  const [bet, setBet] = useState(50);
  const [mines, setMines] = useState(3);
  const [active, setActive] = useState(false);
  const [opened, setOpened] = useState<number[]>([]);
  const [bombs, setBombs] = useState<number[]>([]);
  const [mult, setMult] = useState(1);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const start = () => {
    if (!user || bet > user.balance) { setMsg('Недостаточно Plazma'); return; }
    setActive(true); setOpened([]); setBombs([]); setMult(1); setMsg('');
  };

  const open = async (cell: number) => {
    if (!active || busy || opened.includes(cell)) return;
    setBusy(true);
    try {
      const res = await api.minerOpen(bet, mines, opened.length);
      if (res.hit) {
        setBombs([cell]);
        setUser(res.user);
        setActive(false);
        setMsg('Бум! Ставка потеряна');
      } else {
        const newOpened = [...opened, cell];
        setOpened(newOpened);
        const safe = 25 - mines;
        let m = 1;
        for (let i = 0; i < newOpened.length; i++) m *= (25 - i) / (safe - i);
        setMult(Math.round(m * 100) / 100);
      }
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  const cashout = async () => {
    if (!active || opened.length === 0) return;
    setBusy(true);
    try {
      const res = await api.minerCashout(bet, mines, opened.length);
      setUser(res.user);
      setActive(false);
      setMsg(`Забрал +${res.payout} (x${res.multiplier})`);
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="glass rounded-3xl p-6 neon-border max-w-md mx-auto">
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: 25 }).map((_, i) => {
          const isOpen = opened.includes(i);
          const isBomb = bombs.includes(i);
          return (
            <button key={i} onClick={() => open(i)} disabled={!active || busy}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition ${
                isBomb ? 'bg-destructive/40' : isOpen ? 'bg-accent/25 neon-cyan' : 'glass border border-border hover:border-primary'
              }`}>
              {isBomb ? '💣' : isOpen ? '💎' : ''}
            </button>
          );
        })}
      </div>
      <div className="h-6 text-center mb-2 font-display text-accent">
        {active ? `Множитель x${mult}` : msg}
      </div>
      {!active ? (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Мины</span>
            <div className="flex gap-1">
              {[1, 3, 5, 10].map((v) => (
                <button key={v} onClick={() => setMines(v)}
                  className={`px-3 py-1 rounded-lg text-xs ${mines === v ? 'bg-primary text-primary-foreground' : 'glass'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="mb-4"><BetControl bet={bet} setBet={setBet} max={user?.balance || 0} /></div>
          <Button onClick={start} className="w-full bg-primary hover:bg-primary/90 font-semibold rounded-xl">
            <Icon name="Play" size={16} className="mr-1" /> Начать игру
          </Button>
        </>
      ) : (
        <Button onClick={cashout} disabled={opened.length === 0 || busy}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl">
          Забрать {Math.floor(bet * mult)} Plazma
        </Button>
      )}
    </div>
  );
}
