import cn from 'classnames';
import { type ComponentProps, type PropsWithChildren } from 'react';

import { Button } from './Button';

export function CodeHeader(props: PropsWithChildren) {
  return (
    <div className="flex justify-between items-center bg-default min-h-[40px] pl-4 border-b border-default">
      {props.children}
    </div>
  );
}

export function CodeTitle(props: PropsWithChildren) {
  return <h3 className="text-md select-none font-medium truncate">{props.children}</h3>;
}

export function CodeAction({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="quaternary"
      className={cn('m-0 border-l border-default rounded-none', className)}
      {...props}
    />
  );
}

export function CodeContent(props: PropsWithChildren) {
  const className = 'overflow-x-auto h-full text-xs leading-6 py-2 whitespace-pre';

  return typeof props.children === 'string' ? (
    <div className={className} dangerouslySetInnerHTML={{ __html: props.children }} />
  ) : (
    <div className={className}>{props.children}</div>
  );
}
