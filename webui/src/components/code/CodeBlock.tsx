import cn from 'classnames';
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ComponentProps,
  forwardRef,
} from 'react';

import { Button } from '~/ui/Button';

export const CodeBlockTitle = forwardRef<ElementRef<'h3'>, ComponentPropsWithoutRef<'h3'>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-md select-none font-medium truncate', className)}
      {...props}
    />
  )
);

export const CodeBlockButton = forwardRef<ElementRef<typeof Button>, ComponentProps<typeof Button>>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn('m-0 border-l border-default rounded-none', className)}
      variant="quaternary"
      {...props}
    />
  )
);

export const CodeBlockHeader = forwardRef<ElementRef<'div'>, ComponentPropsWithoutRef<'div'>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex justify-between items-center bg-default min-h-[40px] pl-4 border-b border-default',
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? <CodeBlockTitle>{children}</CodeBlockTitle> : children}
    </div>
  )
);

export const CodeBlockContent = forwardRef<ElementRef<'div'>, ComponentPropsWithoutRef<'div'>>(
  ({ children, className, ...props }, ref) => {
    const componentClasses = cn(
      'overflow-x-auto h-full text-xs leading-6 py-2 whitespace-pre',
      className
    );

    if (typeof children !== 'string') {
      return (
        <div ref={ref} className={componentClasses} {...props}>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={componentClasses}
        dangerouslySetInnerHTML={{ __html: children }}
        {...props}
      />
    );
  }
);
