import { cn } from "@/lib/utils";

const STEPS = ["Menu", "Cart", "Details", "Review"];

export function OrderProgress({ current }: { current: number }) {
  return (
    <ol className="mx-auto flex max-w-md items-center justify-between gap-1 pb-2">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border text-xs font-bold transition-colors",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-accent bg-accent text-accent-foreground",
                  !active && !done && "border-border bg-secondary text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn("mb-4 h-px flex-1", done ? "bg-accent" : "bg-border")}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
