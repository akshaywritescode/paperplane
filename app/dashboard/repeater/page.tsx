import type { Metadata } from "next";
import { RepeaterEditor } from "./RepeaterEditor";

export const metadata: Metadata = {
  title: "Repeater",
  robots: { index: false, follow: false },
};

export default function RepeaterPage() {
  return <RepeaterEditor />;
}
