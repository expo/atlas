// @ts-expect-error
import LoaderIcon from 'lucide-react/dist/esm/icons/loader-2';
import { type ComponentProps } from 'react';

import { cn } from '~/utils/classname';

export function Spinner({ className, ...props }: ComponentProps<typeof LoaderIcon>) {
  return <LoaderIcon className={cn('animate-spin', className)} {...props} />;
}
