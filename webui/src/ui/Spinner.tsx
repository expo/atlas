import cn from 'classnames';
// @ts-expect-error
import LoadingIcon from 'lucide-react/dist/esm/icons/loader-2';

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <LoadingIcon className={cn('animate-spin', className)} {...props} />;
}
