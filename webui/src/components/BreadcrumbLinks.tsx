import { Link } from 'expo-router';
import { ComponentProps, Fragment, useMemo } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/ui/Breadcrumb';
import { relativeBundlePath } from '~/utils/bundle';
import { type PartialAtlasEntry } from '~core/data/types';

type BreadcrumbLinksProps = {
  entry: PartialAtlasEntry;
  path: string;
};

export function BreadcrumbLinks(props: BreadcrumbLinksProps) {
  const links = useMemo(() => getBreadcrumbLinks(props), [props.entry.id, props.path]);

  return (
    <Breadcrumb>
      <BreadcrumbList className="mr-8">
        <BreadcrumbLink asChild>
          <Link
            className="text-lg font-bold text-default underline-offset-4 hover:underline"
            href={{ pathname: '/(atlas)/[entry]/', params: { entry: props.entry.id } }}
          >
            Bundle
          </Link>
        </BreadcrumbLink>
        {links.map((link, index) => (
          <Fragment key={`link-${index}`}>
            <BreadcrumbSeparator className="text-secondary" />
            <BreadcrumbItem>
              {!link.href ? (
                <BreadcrumbPage className="text-lg">{link.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    className="text-lg text-default font-bold underline-offset-4 hover:underline"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type BreadcrumbLinkItem = {
  label: string;
  href?: ComponentProps<typeof Link>['href'];
};

function getBreadcrumbLinks(props: BreadcrumbLinksProps): BreadcrumbLinkItem[] {
  const relativePath = relativeBundlePath(props.entry, props.path);

  return relativePath.split('/').map((label, index, breadcrumbs) => {
    const isLastSegment = index === breadcrumbs.length - 1;
    const breadcrumb: BreadcrumbLinkItem = { label };

    // NOTE(cedric): a bit of a workaround to avoid linking the module page, might need to change this
    if (!isLastSegment || !label.includes('.')) {
      breadcrumb.href = {
        pathname: '/(atlas)/[entry]/folders/[path]',
        params: {
          entry: props.entry.id,
          path: `${props.entry.projectRoot}/${breadcrumbs.slice(0, index + 1).join('/')}`,
        },
      };
    }

    return breadcrumb;
  });
}
