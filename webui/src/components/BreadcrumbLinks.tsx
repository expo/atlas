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
import { relativeBundlePath, rootBundlePath } from '~/utils/bundle';
import { type PartialAtlasBundle } from '~core/data/types';

type BreadcrumbLinksProps = {
  bundle: PartialAtlasBundle;
  path: string;
};

export function BreadcrumbLinks(props: BreadcrumbLinksProps) {
  const links = useMemo(() => getBreadcrumbLinks(props), [props.bundle.id, props.path]);

  return (
    <Breadcrumb>
      <BreadcrumbList className="mr-8">
        <BreadcrumbLink asChild>
          <Link
            className="text-lg font-bold text-default underline-offset-4 hover:underline"
            href={{ pathname: '/(atlas)/[bundle]/', params: { bundle: props.bundle.id } }}
          >
            Bundle
          </Link>
        </BreadcrumbLink>
        {links.map((link) => (
          <Fragment key={link.key}>
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
  key: string;
  label: string;
  href?: ComponentProps<typeof Link>['href'];
};

function getBreadcrumbLinks(props: BreadcrumbLinksProps): BreadcrumbLinkItem[] {
  const rootPath = rootBundlePath(props.bundle).replace(/\/$/, '');
  const relativePath = relativeBundlePath(props.bundle, props.path).replace(/^\//, '');

  return relativePath.split('/').map((label, index, breadcrumbs) => {
    const isLastSegment = index === breadcrumbs.length - 1;
    const breadcrumb: BreadcrumbLinkItem = { key: `${index}-${label}`, label };

    // NOTE(cedric): a bit of a workaround to avoid linking the module page, might need to change this
    if (!isLastSegment || !label.includes('.')) {
      const path = `${rootPath}/${breadcrumbs.slice(0, index + 1).join('/')}`;
      breadcrumb.key = path;
      breadcrumb.href = {
        pathname: '/(atlas)/[bundle]/folders/[path]',
        params: { bundle: props.bundle.id, path },
      };
    }

    return breadcrumb;
  });
}
