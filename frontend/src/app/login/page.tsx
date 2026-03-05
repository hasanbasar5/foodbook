import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function LoginPage() {
  return (
    <OnboardingGate>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to manage entries, summaries, and role-based reporting."
        footerLabel="Register"
        footerHref="/register"
        footerText="Need an account?"
      >
        <AuthForm mode="login" />
      </AuthCard>
    </OnboardingGate>
  );
}
