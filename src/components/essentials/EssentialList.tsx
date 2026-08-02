import { useQuery } from "@tanstack/react-query";
import { House, Loader2, Plane, Tag, Truck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { essentialsQueryOptions } from "@/lib/queries";

const categoryDetails: Record<string, { label: string; Icon: LucideIcon }> = {
  home: { label: "Home", Icon: House },
  travel: { label: "Travel", Icon: Plane },
  move: { label: "Move", Icon: Truck },
  "personal-care": { label: "Personal care", Icon: Tag },
  kitchen: { label: "Kitchen", Icon: Tag },
  electronics: { label: "Electronics", Icon: Tag },
  "everyday-carry": { label: "Everyday carry", Icon: Tag },
  documents: { label: "Documents", Icon: Tag },
  household: { label: "Household", Icon: Tag },
  "personal-items": { label: "Personal items", Icon: Tag },
  storage: { label: "Storage", Icon: Tag },
  medical: { label: "Medical", Icon: Tag },
  appliances: { label: "Appliances", Icon: Tag },
  instruments: { label: "Instruments", Icon: Tag },
};

export function EssentialList() {
  const { data: essentialsData, isLoading, isError } = useQuery(essentialsQueryOptions);
  const essentials = essentialsData ?? [];

  if (isLoading) {
    return <div className="essential-status"><Loader2 className="size-5 animate-spin" /></div>;
  }

  if (isError) {
    return <div className="essential-status text-destructive">Unable to load essentials.</div>;
  }

  if (essentials.length === 0) {
    return (
      <div className="essential-empty">
        <span>+</span>
        <p>Your essentials list is ready.</p>
        <small>Ask the assistant to add the things you want to have on hand.</small>
      </div>
    );
  }

  return (
    <div className="essential-list">
      {essentials.map((essential, index) => (
        <article key={essential.id} className="essential-entry">
          <span className="essential-number">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <h3>{essential.name}</h3>
            <p>{essential.brand}</p>
          </div>
          <div className="essential-categories" aria-label={`Use for: ${essential.categories.join(", ")}`}>
            {essential.categories.map((category) => {
              const detail = categoryDetails[category];
              const Icon = detail?.Icon;

              return (
                <Badge key={category} variant="outline" className="essential-badge">
                  {Icon && <Icon aria-hidden="true" />}
                  {detail?.label ?? category}
                </Badge>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
