import { fetchCollectionsAction } from "./actions";
import { CollectionsView } from "./CollectionsView";

export default async function CollectionsPage() {
  const collections = await fetchCollectionsAction();
  return <CollectionsView initialCollections={collections} />;
}
