import { Link } from 'expo-router';
import { ComponentProps, Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/ui/Breadcrumb';

type BreadcrumbLinksProps = {
  entryId: string;
  links: {
    label: string;
    href?: ComponentProps<typeof Link>['href'];
  }[];
};

export function BreadcrumbLinks(props: BreadcrumbLinksProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="mr-8">
        <BreadcrumbLink asChild>
          <Link
            className="text-lg font-bold text-default underline-offset-4 hover:underline"
            href={{ pathname: '/(atlas)/[entry]/', params: { entry: props.entryId } }}
          >
            Bundle
          </Link>
        </BreadcrumbLink>
        {props.links.map((link, index) => (
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
