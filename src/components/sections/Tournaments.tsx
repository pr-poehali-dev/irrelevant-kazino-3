import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface TPlayer { nickname: string; score: number; }
interface Tournament { id: number; title: string; description: string; prize_pool: number; status: string; players: TPlayer[]; }
interface Leader { nickname: string; total_won: number; level: number; games_played: number; }

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    api.tournaments().then((d) => setTournaments(d.tournaments)).catch(() => {});
    api.leaderboard().then((d) => setLeaders(d.leaders)).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {tournaments.map((t) => (
          <div key={t.id} className="glass rounded-3xl p-5 neon-border">
            <div className="flex items-center justify-between mb-2">
              <Icon name="Trophy" size={22} className="text-accent" />
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {t.status === 'active' ? 'Активен' : 'Завершён'}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold">{t.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
            <div className="text-sm text-accent font-semibold mb-3">
              <Icon name="Zap" size={13} className="inline" /> Приз: {t.prize_pool.toLocaleString()}
            </div>
            <div className="space-y-1">
              {t.players.length === 0 ? (
                <p className="text-xs text-muted-foreground">Пока нет участников</p>
              ) : t.players.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{i + 1}. {p.nickname}</span>
                  <span className="text-accent">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Icon name="Medal" size={20} className="text-accent" /> Общий рейтинг игроков
        </h3>
        <div className="space-y-1">
          {leaders.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <span className={`font-display font-bold w-6 ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                <span className="font-medium">{l.nickname}</span>
                <span className="text-xs text-muted-foreground">Ур. {l.level}</span>
              </div>
              <span className="text-accent font-semibold">{l.total_won.toLocaleString()} Plazma</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
