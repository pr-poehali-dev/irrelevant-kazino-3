import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { api, TELEGRAM_CHANNEL_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PromoCodes() {
  const { setUser } = useAuth();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true); setMsg(''); setOk(false);
    try {
      const res = await api.redeemPromo(code.trim());
      setUser(res.user);
      setOk(true);
      setMsg(res.reward_type === 'balance'
        ? `Начислено ${res.reward_value} Plazma Coin!`
        : `Скидка ${res.reward_value}% на пополнение активирована!`);
      setCode('');
    } catch (e) {
      setMsg((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Ticket" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Промокоды</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          Свежие промокоды публикуются в нашем{' '}
          <button onClick={() => window.open(TELEGRAM_CHANNEL_URL, '_blank')} className="text-accent underline">
            Telegram-канале
          </button>. Следите за постами и вводите коды здесь.
        </p>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex gap-2">
          <Input placeholder="Введите промокод" value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="bg-background/60 font-mono" />
          <Button onClick={submit} disabled={busy} className="bg-primary hover:bg-primary/90 rounded-xl whitespace-nowrap">
            <Icon name="Check" size={16} className="mr-1" /> {busy ? 'Проверка...' : 'Активировать'}
          </Button>
        </div>
        {msg && (
          <p className={`text-sm mt-3 ${ok ? 'text-accent' : 'text-destructive'}`}>{msg}</p>
        )}
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-lg font-bold mb-3">Как это работает</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <span>Подпишитесь на наш Telegram-канал, там публикуются актуальные промокоды</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <span>Введите код в поле выше — каждый код можно использовать только один раз</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
            <span>Награда — Plazma Coin или скидка — придёт мгновенно на ваш счёт</span>
          </div>
        </div>
      </div>
    </div>
  );
}
