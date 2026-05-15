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
            width={60}
            height={60}
            priority
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tighter uppercase text-zinc-950 dark:text-white">
          DriveMe
        </h1>
      </div>

      {/* Componente SignIn con Estética Personalizada */}
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{
          variables: {
            colorPrimary: "#CFFF04",
            colorBackground: "white", // Se ajusta vía elements para modo oscuro
            colorText: "#09090B",
            fontFamily: "var(--font-space-grotesk)",
            borderRadius: "12px",
          },
          elements: {
            card: "border-4 border-zinc-950 shadow-[8px_8px_0px_0px_#09090b] dark:border-brand dark:shadow-[8px_8px_0px_0px_#CFFF04] dark:bg-zinc-900",
            headerTitle: "font-extrabold uppercase tracking-tight text-2xl",
            headerSubtitle: "font-medium text-zinc-600 dark:text-zinc-400",
            socialButtonsBlockButton: "border-2 border-zinc-950 shadow-[3px_3px_0px_0px_#09090b] hover:translate-y-[-2px] transition-all dark:border-brand dark:shadow-[3px_3px_0px_0px_#CFFF04] dark:text-white",
            formButtonPrimary: "bg-brand text-zinc-950 font-extrabold border-2 border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#09090b] transition-all py-3 dark:shadow-[4px_4px_0px_0px_#CFFF04]",
            formFieldInput: "border-2 border-zinc-950 focus:ring-2 focus:ring-brand dark:bg-zinc-800 dark:text-white dark:border-zinc-700",
            footerActionLink: "text-brand font-bold hover:underline",
            identityPreviewText: "dark:text-white",
            formResendCodeLink: "text-brand",
            dividerLine: "bg-zinc-950 dark:bg-brand/30",
            dividerText: "text-zinc-950 font-bold dark:text-white"
          }
        }}
      />
    </div>
  );
}