import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { bestPricesQueryOptions } from "@/lib/queries";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function BestPriceList() {
  const { data: pricesData, isLoading, isError } = useQuery(bestPricesQueryOptions);
  const prices = pricesData ?? [];

  if (isLoading) {
    return <div className="price-status"><Loader2 className="size-5 animate-spin" /></div>;
  }

  if (isError) {
    return <div className="price-status text-destructive">Unable to load price notes.</div>;
  }

  if (prices.length === 0) {
    return (
      <div className="price-empty">
        <span>—</span>
        <p>No prices saved yet.</p>
        <small>Ask the assistant to record a best price when you find one.</small>
      </div>
    );
  }

  return (
    <div className="price-list">
      {prices.map((price, index) => (
        <article key={price.id} className="price-entry">
          <span className="price-number">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <h3>{price.name}</h3>
            {price.comments && (
              <p className="price-comment"><MapPin aria-hidden="true" />{price.comments}</p>
            )}
          </div>
          <p className="price-amount">
            <strong>{formatter.format(price.lowestPrice)}</strong>
            <span>/{price.unit}</span>
          </p>
        </article>
      ))}
    </div>
  );
}
