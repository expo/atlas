import { cx } from 'class-variance-authority';
// @ts-expect-error
import LoaderIcon from 'lucide-react/dist/esm/icons/loader-2';
import { type ComponentProps } from 'react';

export function Spinner({ className, ...props }: ComponentProps<typeof LoaderIcon>) {
  return <LoaderIcon className={cx('animate-spin', className)} {...props} />;
}
