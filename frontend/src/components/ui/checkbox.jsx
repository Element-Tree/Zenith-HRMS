import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
    // Base styles
    "peer h-4 w-4 shrink-0 rounded-sm border shadow transition-colors",
    // Light mode colors (same as before)
    "border-gray-300 bg-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    // ✅ Dark mode override: bright border + visible checked color
    "dark:border-gray-400 dark:bg-gray-900 dark:data-[state=checked]:bg-emerald-400 dark:data-[state=checked]:border-emerald-400 dark:data-[state=checked]:text-black",
    // Focus / disabled states
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
    className
)}

    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
