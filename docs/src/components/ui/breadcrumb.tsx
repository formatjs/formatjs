import * as React from 'react'
import {Slot} from '@radix-ui/react-slot'

import {cn} from '../../lib/utils'

const Breadcrumb: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<'nav'> & {
    separator?: React.ReactNode
  } & React.RefAttributes<HTMLElement>
> = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'nav'> & {
    separator?: React.ReactNode
  }
>(({...props}, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<'ol'> & React.RefAttributes<HTMLOListElement>
> = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
  ({className, ...props}, ref) => (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
        className
      )}
      {...props}
    />
  )
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<'li'> & React.RefAttributes<HTMLLIElement>
> = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({className, ...props}, ref) => (
    <li
      ref={ref}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  )
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<'a'> & {
    asChild?: boolean
  } & React.RefAttributes<HTMLAnchorElement>
> = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & {
    asChild?: boolean
  }
>(({asChild, className, ...props}, ref) => {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      ref={ref}
      className={cn('transition-colors hover:text-foreground', className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<'span'> & React.RefAttributes<HTMLSpanElement>
> = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({className, ...props}, ref) => (
    <span
      ref={ref}
      aria-current="page"
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  )
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

interface BreadcrumbSeparatorComponent {
  (props: React.ComponentPropsWithoutRef<'li'>): React.JSX.Element
  displayName: string
}

const BreadcrumbSeparator: BreadcrumbSeparatorComponent = Object.assign(
  ({
    children,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<'li'>): React.JSX.Element => (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </li>
  ),
  {displayName: 'BreadcrumbSeparator'}
)

interface BreadcrumbEllipsisComponent {
  (props: React.ComponentPropsWithoutRef<'span'>): React.JSX.Element
  displayName: string
}

const BreadcrumbEllipsis: BreadcrumbEllipsisComponent = Object.assign(
  ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<'span'>): React.JSX.Element => (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">More</span>
    </span>
  ),
  {displayName: 'BreadcrumbEllipsis'}
)

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
