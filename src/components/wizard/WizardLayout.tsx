import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  children: React.ReactNode;
}

export function WizardLayout({ currentStep, totalSteps, stepTitles, children }: WizardLayoutProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-full bg-background">
      {/* Progress header */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
            <p className="text-sm font-semibold">{stepTitles[currentStep - 1]}</p>
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots — desktop */}
          <div className="hidden sm:flex items-center justify-between mt-3">
            {stepTitles.map((title, i) => {
              const step = i + 1;
              const done = step < currentStep;
              const active = step === currentStep;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                        ? "bg-primary/20 border-2 border-primary text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : step}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] leading-tight text-center max-w-[60px]",
                      active ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
