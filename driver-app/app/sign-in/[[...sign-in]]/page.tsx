import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">

      {/* Contenedor del Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="p-2 bg-brand rounded-xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] dark:shadow-[4px_4px_0px_0px_#CFFF04]">
          <Image
            src="/images/logo.png"
            alt="DriveMe Logo"
            width={110}
            height={110}
            priority
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
            colorPrimary: "#FF007F",
            colorBackground: "white", // Se ajusta vía elements para modo oscuro
            colorText: "#09090B",
            fontFamily: "var(--font-space-grotesk)",
            borderRadius: "12px",
          },
          elements: {
            card: "border-4 border-zinc-950 shadow-[8px_8px_0px_0px_#09090b] dark:border-brand dark:shadow-[8px_8px_0px_0px_#CFFF04] bg-white",
            headerTitle: "font-extrabold uppercase tracking-tight text-2xl !text-zinc-950 dark:!text-zinc-950",
            headerSubtitle: "font-medium !text-zinc-600 dark:!text-zinc-800",
            socialButtonsBlockButton: "border-2 border-zinc-950 shadow-[3px_3px_0px_0px_#09090b] hover:translate-y-[-2px] transition-all dark:border-brand dark:shadow-[3px_3px_0px_0px_#CFFF04] !text-zinc-950 dark:!text-zinc-950 bg-white",
            formButtonPrimary: "bg-brand !text-zinc-950 font-extrabold border-2 border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#09090b] transition-all py-3 dark:shadow-[4px_4px_0px_0px_#CFFF04]",
            formFieldInput: "border-2 border-zinc-950 focus:ring-2 focus:ring-brand dark:bg-zinc-800 dark:!text-white dark:border-zinc-700",
            footerActionLink: "!text-alert font-bold hover:underline",
            identityPreviewText: "!text-zinc-950 dark:!text-zinc-950",
            formResendCodeLink: "!text-alert",
            dividerLine: "bg-zinc-950 dark:bg-zinc-300",
            dividerText: "!text-zinc-950 font-bold dark:!text-zinc-950",
            formFieldLabel: "!text-zinc-950 font-bold dark:!text-zinc-950",
            footerActionText: "!text-zinc-950 dark:!text-zinc-950",
            formFieldErrorText: "!text-alert dark:!text-alert text-sm"
          }
        }}
      />
    </div>
  );
}