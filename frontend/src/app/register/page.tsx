import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function RegisterPage() {
  return (
    <OnboardingGate>
      <AuthCard
        title="Create account"
        subtitle="Start directly inside Food Book. No landing page, just authenticated cashbook workflows."
        footerLabel="Login"
        footerHref="/login"
        footerText="Already registered?"
      >
        <AuthForm mode="register" />
      </AuthCard>
    </OnboardingGate>
  );
}
