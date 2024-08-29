// see: https://ui.shadcn.com/docs/components/tooltip

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cx } from 'class-variance-authority';
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react';

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cx(
      'z-50 px-3 py-2 overflow-hidden rounded-md bg-default text-secondary border border-secondary max-w-80 shadow-md leading-6 text-xs',
      'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));

TooltipContent.displayName = TooltipPrimitive.Content.displayName;
