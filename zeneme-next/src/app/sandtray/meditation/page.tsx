import { redirect } from "next/navigation"

export default function MeditationPage() {
  redirect("/sandtray/start?step=meditation")
}
