import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0' +
    ' hover-elevate active-elevate-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border border-primary-border hover:opacity-90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm border-destructive-border hover:bg-destructive/90',
        outline:
          'border [border-color:var(--button-outline)] shadow-xs active:shadow-none bg-background hover:bg-secondary',
        secondary:
          'border bg-secondary text-secondary-foreground border-secondary-border hover:bg-secondary/80',
        ghost: 'border border-transparent hover:bg-secondary',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-9 px-4 py-2',
        sm: 'min-h-8 rounded-md px-3 text-xs',
        lg: 'min-h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };