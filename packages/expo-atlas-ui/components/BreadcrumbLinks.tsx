import type { PartialAtlasBundle } from 'expo-atlas';
import { Link } from 'expo-router';
import { type ComponentProps, Fragment, useMemo } from 'react';

import { FilePathMenu } from '~/components/FilePathMenu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/ui/Breadcrumb';

type BreadcrumbLinksProps = {
  /** The current opened bundle, used to generate the proper links */
  bundle: PartialAtlasBundle;
  /** The relative path to generate the breadcrumb links from */
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
          <Fragment key={link.filePath}>
            <BreadcrumbSeparator className="text-secondary" />
            <BreadcrumbItem>
              {!link.href ? (
                <FilePathMenu {...link}>
                  <BreadcrumbPage className="text-lg">{link.label}</BreadcrumbPage>
                </FilePathMenu>
              ) : (
                <FilePathMenu {...link}>
                  <BreadcrumbLink asChild>
                    <Link
                      className="text-lg text-default font-bold underline-offset-4 hover:underline"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </BreadcrumbLink>
                </FilePathMenu>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type BreadcrumbLinkItem = ComponentProps<typeof FilePathMenu> & {
  key: string;
  label: string;
  filePath: string;
  href?: ComponentProps<typeof Link>['href'];
};

function getBreadcrumbLinks(props: BreadcrumbLinksProps): BreadcrumbLinkItem[] {
  return props.path.split('/').map((label, index, breadcrumbs) => {
    const isLastSegment = index === breadcrumbs.length - 1;
    const filePath = breadcrumbs.slice(0, index + 1).join('/');
    const breadcrumb: BreadcrumbLinkItem = {
      key: `${index}-${label}`,
      label,
      filePath,
      relative: {
        path: filePath,
        label: isLastSegment ? 'Copy relative file path' : 'Copy relative folder path',
      },
      absolute: {
        path: `${props.bundle.sharedRoot}/${filePath}`,
        label: isLastSegment ? 'Copy absolute file path' : 'Copy absolute folder path',
      },
    };

    // NOTE(cedric): a bit of a workaround to avoid linking to the current page, might need to change this
    if (!isLastSegment || !label.includes('.')) {
      breadcrumb.href = {
        pathname: '/(atlas)/[bundle]/folders/[path]',
        params: { bundle: props.bundle.id, path: breadcrumb.filePath },
      };
    }

    return breadcrumb;
  });
}
