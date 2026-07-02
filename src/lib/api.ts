const AUTH_URL = 'https://functions.poehali.dev/3e65a5be-2e7c-4130-9849-256631ae3953';
const GAME_URL = 'https://functions.poehali.dev/adaf94b6-465a-44c1-b8af-edba65808eef';
const ADMIN_URL = 'https://functions.poehali.dev/e54ef9c3-e374-44e2-85a9-a9e2d5845818';

export const TELEGRAM_URL = 'https://t.me/plazmatorg';

export interface User {
  id: number;
  player_id: string;
  email: string;
  nickname: string;
  balance: number;
  xp: number;
  level: number;
  level_name: string;
  level_discount: number;
  vip_level: number;
  role: string;
  is_owner: boolean;
  total_wagered: number;
  total_won: number;
  games_played: number;
}

function token(): string {
  return localStorage.getItem('irk_token') || '';
}

async function req(url: string, method: string, body?: unknown, params?: Record<string, string>) {
  let fullUrl = url;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    fullUrl += '?' + qs;
  }
  const res = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export const api = {
  register: (email: string, password: string, nickname: string) =>
    req(AUTH_URL, 'POST', { action: 'register', email, password, nickname }),
  login: (email: string, password: string) =>
    req(AUTH_URL, 'POST', { action: 'login', email, password }),
  me: () => req(AUTH_URL, 'GET', undefined, { action: 'me' }),

  slot: (bet: number) => req(GAME_URL, 'POST', { action: 'slot', bet }),
  crash: (bet: number, cashout: number) => req(GAME_URL, 'POST', { action: 'crash', bet, cashout }),
  case: (bet: number) => req(GAME_URL, 'POST', { action: 'case', bet }),
  minerOpen: (bet: number, mines: number, opened: number) =>
    req(GAME_URL, 'POST', { action: 'miner', bet, mines, opened, cashout: false }),
  minerCashout: (bet: number, mines: number, opened: number) =>
    req(GAME_URL, 'POST', { action: 'miner', bet, mines, opened, cashout: true }),
  minedrop: (bet: number) => req(GAME_URL, 'POST', { action: 'minedrop', bet }),
  bjDeal: (bet: number) => req(GAME_URL, 'POST', { action: 'blackjack_deal', bet }),
  bjHit: (bet: number, player: number[]) => req(GAME_URL, 'POST', { action: 'blackjack_hit', bet, player }),
  bjStand: (bet: number, player: number[], dealer: number[]) => req(GAME_URL, 'POST', { action: 'blackjack_stand', bet, player, dealer }),
  transfer: (to_player_id: string, amount: number) => req(GAME_URL, 'POST', { action: 'transfer', to_player_id, amount }),
  levels: () => req(GAME_URL, 'GET', undefined, { action: 'levels' }),

  history: () => req(GAME_URL, 'GET', undefined, { action: 'history' }),
  leaderboard: () => req(GAME_URL, 'GET', undefined, { action: 'leaderboard' }),
  gameStats: () => req(GAME_URL, 'GET', undefined, { action: 'stats' }),
  quests: () => req(GAME_URL, 'GET', undefined, { action: 'quests' }),
  claimQuest: (code: string) => req(GAME_URL, 'POST', { action: 'claim_quest', code }),
  tournaments: () => req(GAME_URL, 'GET', undefined, { action: 'tournaments' }),

  adminUsers: (q?: string) => req(ADMIN_URL, 'GET', undefined, q ? { action: 'users', q } : { action: 'users' }),
  adminOverview: () => req(ADMIN_URL, 'GET', undefined, { action: 'overview' }),
  adminAddBalance: (user_id: number, amount: number) =>
    req(ADMIN_URL, 'POST', { action: 'add_balance', user_id, amount }),
  adminSetRole: (user_id: number, role: string) =>
    req(ADMIN_URL, 'POST', { action: 'set_role', user_id, role }),
  adminSetVip: (user_id: number, vip_level: number) =>
    req(ADMIN_URL, 'POST', { action: 'set_vip', user_id, vip_level }),
  adminSubBalance: (user_id: number, amount: number) =>
    req(ADMIN_URL, 'POST', { action: 'sub_balance', user_id, amount }),
  adminSetBan: (user_id: number, banned: boolean) =>
    req(ADMIN_URL, 'POST', { action: 'set_ban', user_id, banned }),
  adminCreateTournament: (title: string, description: string, prize_pool: number) =>
    req(ADMIN_URL, 'POST', { action: 'create_tournament', title, description, prize_pool }),
};

export function saveToken(t: string) {
  localStorage.setItem('irk_token', t);
}
export function clearToken() {
  localStorage.removeItem('irk_token');
}