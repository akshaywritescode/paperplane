import { fetchEnvironmentsAction } from "./actions";
import { EnvironmentsView } from "./EnvironmentsView";

export default async function EnvironmentsPage() {
  const environments = await fetchEnvironmentsAction();
  return <EnvironmentsView initialEnvironments={environments} />;
}
