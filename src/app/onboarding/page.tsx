import { redirect } from "next/navigation";

export default function OnboardingRedirect() {
  redirect("/login?step=onboard");
}
