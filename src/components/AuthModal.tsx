import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') await register(email, password, nickname);
      else await login(email, password);
      onOpenChange(false);
      setEmail(''); setPassword(''); setNickname('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative glass border border-border neon-border rounded-3xl w-full max-w-md p-6 animate-fade-in">
        <button onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <Icon name="X" size={20} />
        </button>
        <h2 className="font-display text-2xl font-bold tracking-wide mb-4">
          {mode === 'register' ? 'Регистрация' : 'Вход'}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="Mail" size={14} className="text-accent" /> Регистрация по email
          </div>
          <Input placeholder="Email (Google почта)" value={email} type="email"
            onChange={(e) => setEmail(e.target.value)} className="bg-background/60" />
          {mode === 'register' && (
            <Input placeholder="Никнейм" value={nickname}
              onChange={(e) => setNickname(e.target.value)} className="bg-background/60" />
          )}
          <Input placeholder="Пароль" value={password} type="password"
            onChange={(e) => setPassword(e.target.value)} className="bg-background/60"
            onKeyDown={(e) => e.key === 'Enter' && submit()} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button onClick={submit} disabled={busy}
            className="w-full bg-primary hover:bg-primary/90 font-semibold rounded-xl">
            {busy ? 'Загрузка...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
          </Button>
          <button className="w-full text-sm text-muted-foreground hover:text-accent transition"
            onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
            {mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
}
