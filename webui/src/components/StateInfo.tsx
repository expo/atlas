import { type PropsWithChildren } from 'react';

type StateInfoProps = PropsWithChildren<{
  title?: string;
}>;

export function StateInfo(props: StateInfoProps) {
  return (
    <div className="flex flex-1 justify-center items-center">
      {!!props.title && <h2 className="text-lg font-bold m-4">{props.title}</h2>}
      <p>{props.children}</p>
    </div>
  );
}
