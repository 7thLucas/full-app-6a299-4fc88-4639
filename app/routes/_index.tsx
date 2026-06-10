import { redirect } from "react-router";

// WareFlow opens on the operational dashboard.
export function loader() {
  return redirect("/dashboard");
}

export default function Index() {
  return null;
}
