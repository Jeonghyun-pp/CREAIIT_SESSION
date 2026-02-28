import { redirect } from "next/navigation";

// /sessions redirects to home which shows the session grid
export default function SessionsPage() {
  redirect("/");
}
