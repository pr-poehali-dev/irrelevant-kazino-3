import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api, TELEGRAM_CHANNEL_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Prize { amount: number; label: string; }
interface Status {
  channel: string; subscribed: boolean; already_spun: boolean;
  last_prize: { prize_amount: number; prize_label: string } | null;
  prizes: Prize[];
}

export default function Roulette() {
  const { setUser } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ amount: number; label: string } | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const load = () => api.rouletteStatus().then(setStatus).catch(() => {});
  useEffect(() => { load(); }, []);

  const confirmSubscribe = async () => {
    setConfirming(true);
    try {
      const res = await api.confirmSubscribe();
      setUser(res.user);
      load();
    } finally { setConfirming(false); }
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setError(''); setResult(null);
    try {
      const res = await api.spinRoulette();
      setTimeout(() => {
        setResult({ amount: res.prize_amount, label: res.prize_label });
        setUser(res.user);
        setSpinning(false);
        load();
      }, 1500);
    } catch (e) {
      setError((e as Error).message);
      setSpinning(false);
    }
  };

  if (!status) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Sparkles" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Ежедневная рулетка</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          Бесплатный спин каждые 24 часа. Единственное условие — подписка на наш Telegram-канал.
        </p>
      </div>

      {!status.subscribed ? (
        <div className="glass rounded-3xl p-6 text-center space-y-4">
          <Icon name="Send" size={32} className="text-[#229ED9] mx-auto" />
          <p className="text-sm text-muted-foreground">
            Подпишитесь на канал <span className="text-accent font-semibold">{TELEGRAM_CHANNEL_URL}</span>, затем подтвердите подписку.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-[#229ED9] hover:bg-[#1a8bbf] text-white rounded-xl"
              onClick={() => window.open(TELEGRAM_CHANNEL_URL, '_blank')}>
              <Icon name="Send" size={16} className="mr-1" /> Открыть канал
            </Button>
            <Button onClick={confirmSubscribe} disabled={confirming}
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
              <Icon name="Check" size={16} className="mr-1" /> {confirming ? 'Проверка...' : 'Я подписался'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 text-center">
          <div className={`w-40 h-40 mx-auto rounded-full border-4 border-primary flex items-center justify-center mb-6 ${spinning ? 'animate-spin' : ''}`}
            style={{ borderStyle: 'dashed' }}>
            <span className="text-5xl">{spinning ? '🎰' : result ? '🎁' : '🎡'}</span>
          </div>

          {result && (
            <div className="mb-4 animate-fade-in">
              <div className="font-display text-2xl font-bold text-accent">{result.label}</div>
              <div className="text-sm text-muted-foreground">+{result.amount} Plazma начислено!</div>
            </div>
          )}

          {error && <p className="text-destructive text-sm mb-3">{error}</p>}

          {status.already_spun && !result ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Сегодня уже получено: <span className="text-accent font-semibold">{status.last_prize?.prize_label}</span>
              </p>
              <p className="text-xs text-muted-foreground">Возвращайтесь через 24 часа за новым призом</p>
            </div>
          ) : (
            <Button onClick={spin} disabled={spinning || status.already_spun}
              size="lg" className="bg-primary hover:bg-primary/90 font-display font-bold rounded-2xl px-10">
              {spinning ? 'Крутится...' : 'Крутить рулетку'}
            </Button>
          )}
        </div>
      )}

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-lg font-bold mb-3">Возможные призы</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {status.prizes.map((p, i) => (
            <div key={i} className="glass rounded-xl p-3 text-center">
              <div className="text-accent font-display font-bold">{p.amount}</div>
              <div className="text-[10px] text-muted-foreground">Plazma</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
