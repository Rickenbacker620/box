import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { flightFaresQueryOptions } from "@/lib/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function FlightFareList() {
  const { data: faresData, isLoading, isError } = useQuery(flightFaresQueryOptions);
  const fares = faresData ?? [];

  if (isLoading) {
    return <div className="fare-status"><Loader2 className="size-5 animate-spin" /></div>;
  }

  if (isError) {
    return <div className="fare-status text-destructive">Unable to load flight fares.</div>;
  }

  if (fares.length === 0) {
    return (
      <div className="fare-empty">
        <span>—</span>
        <p>No flight fares saved yet.</p>
        <small>Ask the assistant to record a fare when you find one.</small>
      </div>
    );
  }

  return (
    <Table className="fare-table">
      <TableHeader>
        <TableRow>
          <TableHead>Flight</TableHead>
          <TableHead>Flight number</TableHead>
          <TableHead className="text-right">Lowest price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fares.map((fare) => (
          <TableRow key={fare.id}>
            <TableCell className="fare-route">{fare.route}</TableCell>
            <TableCell className="fare-number">{fare.flightNumber}</TableCell>
            <TableCell className="fare-price text-right">{fare.lowestPrice}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
