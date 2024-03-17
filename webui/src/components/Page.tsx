import { cva, type VariantProps } from 'class-variance-authority';
import cn from 'classnames';
import { forwardRef, type HTMLAttributes } from 'react';

import { StatsEntrySelect } from '~/components/forms/StatsEntrySelect';
import { LayoutContent, LayoutNavigation } from '~/ui/Layout';

export { LayoutHeader as PageHeader, LayoutTitle as PageTitle } from '~/ui/Layout';

const pageVariants = cva('', {
  variants: {
    variant: {
      default: '',
      viewport: 'flex flex-col h-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type PageProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof pageVariants>;

export const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ className, variant, children, ...props }, ref) => {
    if (variant === 'viewport') {
      return (
        <div className={cn(pageVariants({ variant, className }))} ref={ref} {...props}>
          <LayoutNavigation>
            <StatsEntrySelect />
          </LayoutNavigation>
          <LayoutContent>{children}</LayoutContent>
        </div>
      );
    }

    return (
      <div className="mt-16">
        <LayoutNavigation className="fixed top-0 left-0 right-0 z-10">
          <StatsEntrySelect />
        </LayoutNavigation>
        {children}
      </div>
    );
  }
);
Page.displayName = 'Page';
