import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
}

/** Accessible quantity stepper bounded by available stock. */
export function QuantitySelector({
  quantity,
  max,
  onChange,
  disabled,
}: QuantitySelectorProps) {
  const decrease = () => onChange(Math.max(1, quantity - 1));
  const increase = () => onChange(Math.min(max, quantity + 1));

  const buttonClass = cn(
    "flex h-9 w-9 items-center justify-center text-lg font-medium text-zinc-600 transition-colors",
    "hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
  );

  return (
    <div className="inline-flex items-stretch rounded-md border border-zinc-300">
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
        className={cn(buttonClass, "rounded-l-md border-r border-zinc-300")}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={quantity}
        disabled={disabled}
        onChange={(event) => {
          const value = Number.parseInt(event.target.value, 10);
          if (!Number.isNaN(value)) {
            onChange(Math.min(max, Math.max(1, value)));
          }
        }}
        aria-label="Quantity"
        className="h-9 w-14 border-x border-zinc-300 text-center text-sm font-medium text-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
      />
      <button
        type="button"
        onClick={increase}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className={cn(buttonClass, "rounded-r-md border-l border-zinc-300")}
      >
        +
      </button>
    </div>
  );
}
