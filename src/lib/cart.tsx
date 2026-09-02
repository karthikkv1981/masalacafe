import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  servingSize: string | null;
  categorySlug: string;
  quantity: number;
  addons: string[];
  notes: string;
};

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
  quantityFor: (menuItemId: string) => number;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "saffron-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addLine: CartContextValue["addLine"] = (line) => {
      const key = `${line.menuItemId}::${line.addons.slice().sort().join("|")}::${line.notes.trim()}`;
      setLines((prev) => {
        const existing = prev.find((l) => l.key === key);
        if (existing) {
          return prev.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l,
          );
        }
        return [...prev, { ...line, key }];
      });
    };

    return {
      lines,
      addLine,
      setQuantity: (key, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
        ),
      removeLine: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal:
        Math.round(lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0) * 100) / 100,
      quantityFor: (menuItemId) =>
        lines.filter((l) => l.menuItemId === menuItemId).reduce((n, l) => n + l.quantity, 0),
      hydrated,
    };
  }, [lines, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
