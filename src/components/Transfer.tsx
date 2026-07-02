import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Transfer({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setMsg(''); setOk(false);
    const amt = parseInt(amount, 10);
    if (!toId || !amt || amt <= 0) { setMsg('Заполните все поля'); return; }
    setBusy(true);
    try {
      const res = await api.transfer(toId.trim(), amt);
      setUser(res.user);
      setMsg(`Успешно отправлено ${amt} → ${res.to}`);
      setOk(true);
      setToId(''); setAmount('');
    } catch (e) {
      setMsg((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-border neon-border rounded-3xl w-full max-w-sm p-6 animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <Icon name="X" size={20} />
        </button>
        <h2 className="font-display text-xl font-bold mb-1">Перевод Plazma</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Ваш ID: <span className="text-accent font-mono font-bold">{user?.player_id}</span>
        </p>
        <div className="space-y-3">
          <Input placeholder="ID получателя (6 цифр)" value={toId}
            onChange={(e) => setToId(e.target.value)} className="bg-background/60 font-mono" />
          <Input placeholder="Сумма Plazma" type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="bg-background/60"
            onKeyDown={(e) => e.key === 'Enter' && send()} />
          {msg && <p className={`text-sm ${ok ? 'text-accent' : 'text-destructive'}`}>{msg}</p>}
          <Button onClick={send} disabled={busy} className="w-full bg-primary hover:bg-primary/90 font-semibold rounded-xl">
            <Icon name="Send" size={16} className="mr-1" /> {busy ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
