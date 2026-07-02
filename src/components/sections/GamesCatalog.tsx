import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import SlotGame from '@/components/games/SlotGame';
import MinerGame from '@/components/games/MinerGame';
import CrashGame from '@/components/games/CrashGame';
import CaseGame from '@/components/games/CaseGame';
import MineDropGame from '@/components/games/MineDropGame';

const GAMES = [
  { id: 'slot', name: '777 Слот', desc: 'Классический слот с джекпотами', icon: 'Cherry', tag: 'Хит', cat: 'Слоты' },
  { id: 'miner', name: 'Минёр', desc: 'Открывай ячейки, избегай мин', icon: 'Bomb', tag: '', cat: 'Логика' },
  { id: 'crash', name: 'Crash', desc: 'Забери ставку до краха', icon: 'TrendingUp', tag: 'Live', cat: 'Краш' },
  { id: 'case', name: 'Кейсы', desc: 'Открывай кейсы с наградами', icon: 'Package', tag: '', cat: 'Кейсы' },
  { id: 'minedrop', name: 'Mine Drop', desc: 'Роняй шар сквозь поле', icon: 'CircleDot', tag: 'Новинка', cat: 'Логика' },
];

const CATS = ['Все', 'Слоты', 'Логика', 'Краш', 'Кейсы'];

export default function GamesCatalog() {
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Все');

  if (active) {
    const g = GAMES.find((x) => x.id === active)!;
    const Game = { slot: SlotGame, miner: MinerGame, crash: CrashGame, case: CaseGame, minedrop: MineDropGame }[active]!;
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setActive(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-4">
          <Icon name="ArrowLeft" size={16} /> Назад к играм
        </button>
        <h2 className="font-display text-3xl font-bold text-center mb-6">{g.name}</h2>
        <Game />
      </div>
    );
  }

  const filtered = GAMES.filter((g) =>
    (cat === 'Все' || g.cat === cat) &&
    g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск игр..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-background/60 pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                cat === c ? 'bg-primary text-primary-foreground neon-border' : 'glass text-muted-foreground'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((g, i) => (
          <button key={g.id} onClick={() => setActive(g.id)}
            className="group relative rounded-3xl p-6 text-left glass border border-border hover:neon-border transition-all duration-300 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-accent neon-cyan group-hover:scale-110 transition-transform">
                <Icon name={g.icon} size={26} />
              </div>
              {g.tag && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/20 text-primary">{g.tag}</span>}
            </div>
            <h3 className="font-display text-2xl font-bold mb-1">{g.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{g.desc}</p>
            <span className="inline-flex items-center gap-1 text-accent text-sm font-semibold">
              Играть <Icon name="ArrowRight" size={15} />
            </span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-10">Ничего не найдено</p>}
    </div>
  );
}
