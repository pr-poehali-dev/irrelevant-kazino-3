import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { TELEGRAM_URL } from '@/lib/api';

const PACKS = [
  { amount: 1000, price: '100 ₽', bonus: '' },
  { amount: 5500, price: '500 ₽', bonus: '+10%' },
  { amount: 12000, price: '1000 ₽', bonus: '+20%' },
  { amount: 30000, price: '2500 ₽', bonus: '+25%' },
];

export default function Shop() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="glass rounded-3xl p-6 neon-border text-center">
        <Icon name="Zap" size={40} className="text-accent mx-auto mb-2" />
        <h2 className="font-display text-2xl font-bold">Купить Plazma Coin</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Пополнение и вывод происходят через обмен в Telegram-чате. Ты платишь за Plazma,
          а обменять обратно можно у оператора в чате.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKS.map((p) => (
          <div key={p.amount} className="glass rounded-3xl p-5 text-center neon-cyan">
            <div className="text-3xl mb-1">💎</div>
            <div className="font-display text-2xl font-bold text-accent">{p.amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mb-1">Plazma Coin</div>
            {p.bonus && <div className="text-xs text-primary mb-2">Бонус {p.bonus}</div>}
            <div className="font-semibold mb-3">{p.price}</div>
            <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl"
              onClick={() => window.open(TELEGRAM_URL, '_blank')}>
              <Icon name="Send" size={15} className="mr-1" /> Купить в ТГ
            </Button>
          </div>
        ))}
      </div>
      <div className="glass rounded-3xl p-5 text-center text-sm text-muted-foreground">
        <Icon name="Info" size={16} className="inline text-accent mr-1" />
        Ссылка на Telegram-чат обмена появится здесь скоро. Напиши её мне — и я подключу кнопки к чату.
      </div>
    </div>
  );
}
