import { fetchHistoryAction } from "./actions";
import { HistoryView } from "./HistoryView";

export default async function HistoryPage() {
  const entries = await fetchHistoryAction();
  return <HistoryView initialEntries={entries} />;
}
