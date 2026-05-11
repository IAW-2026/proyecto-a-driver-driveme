import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}