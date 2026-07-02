import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function BetControl({ bet, setBet, max }: { bet: number; setBet: (n: number) => void; max: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Ставка</span>
        <span className="text-accent font-semibold flex items-center gap-1">
          <Icon name="Zap" size={13} /> {bet}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[10, 50, 100, 250].map((v) => (
          <button key={v} onClick={() => setBet(v)}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              bet === v ? 'bg-primary text-primary-foreground neon-border' : 'glass text-muted-foreground'
            }`}>{v}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setBet(Math.max(10, Math.floor(bet / 2)))}
          className="flex-1 py-1.5 rounded-lg glass text-xs text-muted-foreground">½</button>
        <button onClick={() => setBet(bet * 2)}
          className="flex-1 py-1.5 rounded-lg glass text-xs text-muted-foreground">2×</button>
        <button onClick={() => setBet(max)}
          className="flex-1 py-1.5 rounded-lg glass text-xs text-muted-foreground">MAX</button>
      </div>
    </div>
  );
}
