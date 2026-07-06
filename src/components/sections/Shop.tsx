import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { TELEGRAM_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Курс: 100 ₽ = 1000 Plazma Coin
const RATE = 10; // 1 Plazma = 10 копеек, т.е. 1000 Plazma = 100 ₽
const PACKS = [1000, 5000, 10000, 50000, 100000];

export default function Shop() {
  const { user } = useAuth();
  const levelDiscount = user?.level_discount || 0;
  const promoDiscount = user?.pending_discount || 0;
  const discount = Math.min(90, levelDiscount + promoDiscount);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Zap" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Купить Plazma Coin</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-1">
          Курс: <span className="text-accent font-semibold">100 ₽ = 1000 Plazma</span>. Пополнение через Telegram-чат —
          напишите оператору, укажите пакет и оплатите, Plazma придёт на счёт.
        </p>
        {discount > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-semibold">
            <Icon name="Star" size={14} /> Ваша скидка: {discount}%
            {promoDiscount > 0 && <span className="text-primary">(вкл. промокод {promoDiscount}%)</span>}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {PACKS.map((amount) => {
          const basePrice = amount / RATE; // в рублях
          const finalPrice = Math.round(basePrice * (1 - discount / 100));
          return (
            <div key={amount} className="glass rounded-3xl p-5 text-center neon-cyan flex flex-col">
              <div className="text-3xl mb-1">💎</div>
              <div className="font-display text-2xl font-bold text-accent">{amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mb-2">Plazma Coin</div>
              <div className="mt-auto mb-3">
                {discount > 0 && (
                  <div className="text-xs text-muted-foreground line-through">{basePrice.toLocaleString()} ₽</div>
                )}
                <div className="font-display font-bold text-lg">{finalPrice.toLocaleString()} ₽</div>
              </div>
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
