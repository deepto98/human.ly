import { cn } from "@/utils/misc";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  steps: Array<{
    number: number;
    label: string;
  }>;
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        {steps.map((step, idx) => (
          <div key={step.number} className="flex items-center gap-4">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
                <div className={cn(
                  "relative h-10 w-10 sm:h-12 sm:w-12 border-[3px] border-black flex items-center justify-center font-black text-lg sm:text-xl",
                  step.number < currentStep ? "bg-lime-400" : 
                  step.number === currentStep ? "bg-orange-400" :
                  "bg-gray-200"
                )}>
                  {step.number < currentStep ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    step.number
                  )}
                </div>
              </div>
              <p className={cn(
                "mt-1 sm:mt-2 text-xs font-bold uppercase",
                step.number === currentStep ? "text-black" : "text-gray-600"
              )}>
                {step.label}
              </p>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "h-[3px] w-8 sm:w-12 md:w-24",
                step.number < currentStep ? "bg-lime-400" : "bg-gray-300"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

