// see: https://ui.shadcn.com/docs/components/skeleton

import { cx } from 'class-variance-authority';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('animate-pulse rounded-md bg-subtle', className)} {...props} />;
}
