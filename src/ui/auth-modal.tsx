import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { z } from "zod";
import { Loader2, X, Mail } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { cn } from "@/utils/misc";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Neobrutalist shadow */}
        <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
        
        {/* Modal content */}
        <div className="relative border-[4px] border-black bg-white p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 border-[3px] border-black hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {step === "signIn" ? (
            <LoginForm onSubmit={(email) => setStep({ email })} />
          ) : (
            <VerifyForm email={step.email} onBack={() => setStep("signIn")} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      await signIn("resend-otp", value);
      onSubmit(value.email);
      setIsSubmitting(false);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-black">Welcome!</h2>
        <p className="text-lg text-gray-700 font-medium">
          Sign in to create your AI interview agents
        </p>
      </div>

      {/* Google Sign In */}
      <button
        onClick={() => signIn("google")}
        className="group relative"
      >
        <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
        <div className="relative flex items-center justify-center gap-3 border-[3px] border-black bg-white p-4 font-bold transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </div>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-full border-t-[3px] border-black"></div>
        <span className="relative bg-white px-4 text-sm font-bold uppercase text-gray-600">
          Or with email
        </span>
      </div>

      {/* Email Form */}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-2">
          <form.Field
            name="email"
            validators={{
              onSubmit: z
                .string()
                .max(256)
                .email("Email address is not valid."),
            }}
            children={(field) => (
              <>
                <Input
                  placeholder="your@email.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(
                    "border-[3px] border-black p-4 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400",
                    field.state.meta?.errors.length > 0 && "border-red-500"
                  )}
                />
                {field.state.meta?.errors.length > 0 && (
                  <span className="text-sm font-medium text-red-600">
                    {field.state.meta.errors.join(" ")}
                  </span>
                )}
              </>
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative"
        >
          <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
          <div className="relative flex items-center justify-center gap-2 border-[3px] border-black bg-orange-400 p-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Continue with Email
              </>
            )}
          </div>
        </button>
      </form>

      {/* Terms */}
      <p className="text-center text-xs text-gray-600">
        By continuing, you agree to our{" "}
        <a href="#" className="underline font-bold hover:text-black">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="underline font-bold hover:text-black">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}

function VerifyForm({ email, onBack }: { email: string; onBack: () => void }) {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      code: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      await signIn("resend-otp", { email, code: value.code });
      setIsSubmitting(false);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-black">Check Your Email!</h2>
        <p className="text-lg text-gray-700 font-medium">
          We sent a code to <span className="font-bold">{email}</span>
        </p>
      </div>

      {/* Code Form */}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-2">
          <form.Field
            name="code"
            validators={{
              onSubmit: z
                .string()
                .min(8, "Code must be at least 8 characters."),
            }}
            children={(field) => (
              <>
                <Input
                  placeholder="Enter code"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(
                    "border-[3px] border-black p-4 text-lg text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-400",
                    field.state.meta?.errors.length > 0 && "border-red-500"
                  )}
                />
                {field.state.meta?.errors.length > 0 && (
                  <span className="text-sm font-medium text-red-600">
                    {field.state.meta.errors.join(" ")}
                  </span>
                )}
              </>
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative"
        >
          <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
          <div className="relative flex items-center justify-center gap-2 border-[3px] border-black bg-orange-400 p-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Verify Code"
            )}
          </div>
        </button>
      </form>

      {/* Resend */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-600">Didn't receive the code?</p>
        <button
          onClick={() => signIn("resend-otp", { email })}
          className="text-sm font-bold underline hover:text-black"
        >
          Resend Code
        </button>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm font-bold text-gray-600 hover:text-black underline"
      >
        ← Back to sign in
      </button>
    </div>
  );
}

