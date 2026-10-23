import { initialAdminState, type AdminState } from './slices/admin-slice';
import { initialCartState, type CartState } from './slices/cart-slice';
import { initialSessionState, type SessionState } from './slices/session-slice';

// Staff login, the table session and the cart survive a page refresh (and a
// phone locking/reopening the tab), which an in-memory store alone would lose.
const STORAGE_KEY = 'dineview:state:v1';

interface PersistedState {
  admin: AdminState;
  session: SessionState;
  cart: CartState;
}

export function loadPersistedState(): PersistedState | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as Partial<PersistedState>;
    return {
      admin: { ...initialAdminState, ...saved.admin },
      session: { ...initialSessionState, ...saved.session },
      cart: { ...initialCartState, ...saved.cart },
    };
  } catch {
    return undefined;
  }
}

export function persistState(store: { getState: () => PersistedState; subscribe: (fn: () => void) => void }) {
  let last: PersistedState | null = null;
  store.subscribe(() => {
    const { admin, session, cart } = store.getState();
    if (last && last.admin === admin && last.session === session && last.cart === cart) return;
    last = { admin, session, cart };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(last));
    } catch {
      // Storage full or blocked (private mode): the app still works in-memory.
    }
  });
}
