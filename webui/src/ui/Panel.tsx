import cn from 'classnames';
import { type ComponentPropsWithoutRef, forwardRef, type PropsWithChildren } from 'react';

export const PanelGroup = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid grid-cols-2 auto-rows-fr md:grid-cols-2 md:auto-rows-auto', className)}
        {...props}
      />
    );
  }
);

export function Panel({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col border-default bg-subtle border border-l-0 first:border-l first:rounded-l-md last:rounded-r-md overflow-hidden">
      {children}
    </div>
  );
}
