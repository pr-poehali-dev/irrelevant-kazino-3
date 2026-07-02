import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { TELEGRAM_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PACKS = [
  { amount: 1000,  price: '100 ₽',  bonus: '' },
  { amount: 5500,  price: '500 ₽',  bonus: '+10%' },
  { amount: 12000, price: '1000 ₽', bonus: '+20%' },
  { amount: 30000, price: '2500 ₽', bonus: '+25%' },
];

export default function Shop() {
  const { user } = useAuth();
  const discount = user?.level_discount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Zap" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Купить Plazma Coin</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-1">
          Пополнение через Telegram-чат. Напишите оператору, укажите нужный пакет и оплатите — Plazma придёт на счёт.
        </p>
        {discount > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-semibold">
            <Icon name="Star" size={14} /> Ваша скидка за уровень: {discount}% — цены ниже!
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKS.map((p) => {
          const bonusAmount = Math.floor(p.amount * discount / 100);
          const total = p.amount + bonusAmount;
          return (
            <div key={p.amount} className="glass rounded-3xl p-5 text-center neon-cyan flex flex-col">
              <div className="text-3xl mb-1">💎</div>
              <div className="font-display text-2xl font-bold text-accent">{total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mb-1">Plazma Coin</div>
              {(p.bonus || discount > 0) && (
                <div className="text-xs text-primary mb-1">
                  {p.bonus && <span>{p.bonus} </span>}
                  {discount > 0 && <span>+{discount}% за уровень</span>}
                </div>
              )}
              <div className="font-semibold mb-3 mt-auto">{p.price}</div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                onClick={() => window.open(TELEGRAM_URL, '_blank')}
              >
                <Icon name="Send" size={15} className="mr-1" /> Купить в ТГ
              </Button>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/20 flex items-center justify-center flex-shrink-0">
          <Icon name="Send" size={24} className="text-[#229ED9]" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="font-semibold mb-0.5">Telegram-чат обмена Plazma</div>
          <div className="text-sm text-muted-foreground">Напишите оператору, назовите свой игровой ID и желаемый пакет</div>
        </div>
        <Button
          className="bg-[#229ED9] hover:bg-[#1a8bbf] text-white rounded-xl whitespace-nowrap"
          onClick={() => window.open(TELEGRAM_URL, '_blank')}
        >
          Открыть чат
        </Button>
      </div>
    </div>
  );
}
