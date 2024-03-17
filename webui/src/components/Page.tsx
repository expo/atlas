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
  ({ className, variant, children, ...props }, ref) => (
    <div className={cn(pageVariants({ variant, className }))} ref={ref} {...props}>
      <LayoutNavigation>
        <StatsEntrySelect />
      </LayoutNavigation>
      {variant === 'viewport' ? (
        <LayoutContent>{children}</LayoutContent>
      ) : (
        <div className="overflow-auto">{children}</div>
      )}
    </div>
  )
);
Page.displayName = 'Page';
