import { Link } from 'expo-router';
// @ts-expect-error
import PackageIcon from 'lucide-react/dist/esm/icons/box';
// @ts-expect-error
import FileIcon from 'lucide-react/dist/esm/icons/file';
import { PropsWithChildren } from 'react';

import { relativeBundlePath } from '~/utils/bundle';
import type { AtlasModuleRef, PartialAtlasBundle } from '~core/data/types';

type ModuleReferenceListProps = PropsWithChildren<{
  bundle: PartialAtlasBundle;
  moduleRefs: AtlasModuleRef[];
}>;

export function ModuleReferenceList(props: ModuleReferenceListProps) {
  if (props.moduleRefs.length === 0) {
    return <div className="m-2">{props.children}</div>;
  }

  return (
    <>
      {props.moduleRefs.map((moduleRef) => (
        <div key={moduleRef.path} className="inline-block m-2">
          <ModuleImportLink bundle={props.bundle} reference={moduleRef} />
        </div>
      ))}
    </>
  );
}

type ModuleImportLinkProps = PropsWithChildren<{
  bundle: PartialAtlasBundle;
  reference: AtlasModuleRef;
}>;

function ModuleImportLink(props: ModuleImportLinkProps) {
  const relativePath = relativeBundlePath(props.bundle, props.reference.path);
  const Icon = props.reference.package ? PackageIcon : FileIcon;

  return (
    <Link
      asChild
      href={{
        pathname: '/(atlas)/[bundle]/modules/[path]',
        params: {
          bundle: props.bundle.id,
          path: props.reference.path,
        },
      }}
    >
      <a
        className="px-3 py-2 text-2xs border border-secondary rounded-md bg-default text-default inline-flex flex-row items-center group hover:bg-subtle transition-colors"
        aria-label={`Open: ${relativePath}`}
        title={`Open: ${relativePath}`}
      >
        <Icon size={14} />
        <span className="mx-2 whitespace-nowrap overflow-hidden text-ellipsis group-hover:underline underline-offset-2">
          {relativePath}
        </span>
        <span className="ml-2">→</span>
      </a>
    </Link>
  );
}
