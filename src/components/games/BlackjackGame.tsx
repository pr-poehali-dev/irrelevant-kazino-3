import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BetControl from './BetControl';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function cardLabel(c: number) {
  const rank = RANKS[c % 13];
  const suit = SUITS[Math.floor(c / 13) % 4];
  return { rank, suit, red: suit === '♥' || suit === '♦' };
}

function Card({ c, hidden }: { c: number; hidden?: boolean }) {
  if (hidden) return (
    <div className="w-14 h-20 rounded-xl border border-border glass flex items-center justify-center text-2xl">
      🂠
    </div>
  );
  const { rank, suit, red } = cardLabel(c);
  return (
    <div className={`w-14 h-20 rounded-xl border border-border bg-white flex flex-col items-center justify-center font-bold text-lg leading-none ${red ? 'text-red-500' : 'text-gray-900'}`}>
      <span>{rank}</span>
      <span className="text-xl">{suit}</span>
    </div>
  );
}

const RESULT_MSG: Record<string, string> = {
  blackjack: '🎉 Блэкджек! +2.5x',
  win: '✅ Победа! +2x',
  push: '🤝 Ничья — возврат ставки',
  lose: '❌ Проигрыш',
  bust: '💥 Перебор!',
};

export default function BlackjackGame() {
  const { user, setUser } = useAuth();
  const [bet, setBet] = useState(50);
  const [player, setPlayer] = useState<number[]>([]);
  const [dealer, setDealer] = useState<number[]>([]);
  const [pVal, setPVal] = useState(0);
  const [dVal, setDVal] = useState(0);
  const [done, setDone] = useState(true);
  const [result, setResult] = useState('');
  const [payout, setPayout] = useState(0);
  const [busy, setBusy] = useState(false);

  const deal = async () => {
    if (busy || !user || bet > user.balance) return;
    setBusy(true); setResult(''); setPayout(0);
    try {
      const res = await api.bjDeal(bet);
      setPlayer(res.player); setDealer(res.dealer);
      setPVal(res.player_val); setDVal(res.dealer_val);
      setDone(res.done);
      if (res.done) {
        setResult(res.result); setPayout(res.payout); setUser(res.user);
      }
    } finally { setBusy(false); }
  };

  const hit = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      const res = await api.bjHit(bet, player);
      setPlayer(res.player); setPVal(res.player_val);
      if (res.done) { setDone(true); setResult(res.result); setPayout(res.payout); setUser(res.user); }
    } finally { setBusy(false); }
  };

  const stand = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      const res = await api.bjStand(bet, player, dealer);
      setDealer(res.dealer); setDVal(res.dealer_val); setPVal(res.player_val);
      setDone(true); setResult(res.result); setPayout(res.payout); setUser(res.user);
    } finally { setBusy(false); }
  };

  return (
    <div className="glass rounded-3xl p-6 neon-border max-w-lg mx-auto">
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Дилер {!done && dealer.length > 0 ? `(${dVal} — скрыта карта)` : `(${dVal})`}</div>
        <div className="flex gap-2 flex-wrap min-h-[5rem]">
          {dealer.map((c, i) => <Card key={i} c={c} hidden={!done && i === 1} />)}
        </div>
      </div>

      <div className="border-t border-border my-4" />

      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Ваши карты ({pVal})</div>
        <div className="flex gap-2 flex-wrap min-h-[5rem]">
          {player.map((c, i) => <Card key={i} c={c} />)}
        </div>
      </div>

      {result && (
        <div className={`text-center font-display text-xl py-2 mb-3 ${result === 'win' || result === 'blackjack' ? 'text-accent' : result === 'push' ? 'text-muted-foreground' : 'text-destructive'}`}>
          {RESULT_MSG[result]}
          {payout > 0 && <span className="block text-sm">+{payout} Plazma</span>}
        </div>
      )}

      {done ? (
        <>
          <div className="mb-4"><BetControl bet={bet} setBet={setBet} max={user?.balance || 0} /></div>
          <Button onClick={deal} disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-xl">
            {busy ? 'Раздаём...' : 'Новая раздача'}
          </Button>
        </>
      ) : (
        <div className="flex gap-3">
          <Button onClick={hit} disabled={busy} className="flex-1 bg-primary hover:bg-primary/90 font-bold rounded-xl">
            Ещё карту
          </Button>
          <Button onClick={stand} disabled={busy} variant="outline" className="flex-1 rounded-xl">
            Хватит
          </Button>
        </div>
      )}
    </div>
  );
}
