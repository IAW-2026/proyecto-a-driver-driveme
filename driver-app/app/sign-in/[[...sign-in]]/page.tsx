import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <main className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 min-h-screen p-4 transition-colors duration-300">

      {/* Contenedor del Logo */}
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 md:w-80 md:h-80 rounded-2xl border border-[rgba(220,38,38,0.3)] bg-[rgba(10,10,10,0.5)] flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.2)] relative overflow-hidden p-4">
          <Image
            src="/images/logo.jpg"
            alt="DriveMe Logo"
            fill
            className="object-contain"
            priority
            unoptimized={true}
          />
        </div>
      </div>

      {/* Componente SignIn con Estética Personalizada */}
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{
          variables: {
            colorPrimary: "#DC2626",
            colorBackground: "rgba(10,10,10,0.85)",
            colorText: "#FFFFFF",
            fontFamily: "var(--font-michroma)",
            borderRadius: "24px",
            colorInputBackground: "rgba(255,255,255,0.03)",
            colorInputText: "#FFFFFF",
            colorTextSecondary: "#9CA3AF"
          },
          elements: {
            card: "border border-[rgba(220,38,38,0.25)] shadow-[0_0_30px_rgba(220,38,38,0.15)] bg-[rgba(10,10,10,0.85)] backdrop-blur-md",
            headerTitle: "font-sci uppercase tracking-widest text-2xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]",
            headerSubtitle: "font-sci text-[10px] tracking-[0.2em] text-[#9CA3AF] uppercase",
            socialButtonsBlockButton: "rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(20,20,20,0.6)] text-white hover:bg-[rgba(30,30,30,0.8)] hover:border-[rgba(255,255,255,0.2)] transition-all font-sci text-[10px]",
            formButtonPrimary: "rounded-full border border-[rgba(220,38,38,0.4)] bg-[rgba(220,38,38,0.1)] text-primary font-sci text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:bg-[rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.3)] transition-all py-3.5 backdrop-blur-sm",
            formFieldInput: "rounded-full pl-5 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] focus:ring-0 focus:border-[rgba(220,38,38,0.5)] focus:bg-[rgba(220,38,38,0.05)] focus:shadow-[0_0_15px_rgba(220,38,38,0.2)] text-white font-sci transition-all",
            otpCodeFieldInput: "rounded-full border border-[rgba(255,255,255,0.1)] focus:border-[rgba(220,38,38,0.5)] focus:ring-0 text-white bg-[rgba(255,255,255,0.03)] font-sci",
            footerActionLink: "text-primary font-sci tracking-wider hover:text-primary-hover drop-shadow-[0_0_5px_rgba(220,38,38,0.4)]",
            identityPreviewText: "text-white font-sci text-xs",
            formResendCodeLink: "text-primary font-sci text-[10px] tracking-wider",
            dividerLine: "bg-[rgba(220,38,38,0.2)]",
            dividerText: "text-[#9CA3AF] font-sci text-[10px] uppercase tracking-widest",
            formFieldLabel: "text-[#9CA3AF] font-sci uppercase tracking-[0.2em] text-[10px] mb-1 ml-1",
            footerActionText: "text-[#9CA3AF] font-sci text-[10px] uppercase tracking-widest",
            formFieldErrorText: "text-primary text-[10px] font-sci uppercase tracking-widest mt-1"
          }
        }}
      />
    </main>
  );
}