import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";

export default function OwnerLoginPage() {
  return (
    <AuthCard
      title="Owner login"
      subtitle=""
      footerLabel="Normal login"
      footerHref="/login"
      footerText="Need the regular product login?"
    >
      <AuthForm mode="login" ownerOnly />
    </AuthCard>
  );
}
