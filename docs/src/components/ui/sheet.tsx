import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import {cva, type VariantProps} from 'class-variance-authority'

import {cn} from '../../lib/utils'

const Sheet: typeof SheetPrimitive.Root = SheetPrimitive.Root

const SheetTrigger: typeof SheetPrimitive.Trigger = SheetPrimitive.Trigger

const SheetClose: typeof SheetPrimitive.Close = SheetPrimitive.Close

const SheetPortal: typeof SheetPrimitive.Portal = SheetPrimitive.Portal

const SheetOverlay: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> &
    React.RefAttributes<React.ElementRef<typeof SheetPrimitive.Overlay>>
> = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({className, ...props}, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants: (props: {
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  class?: undefined
}) => string = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  } as const
)

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent: React.FC<
  React.PropsWithChildren<SheetContentProps>
> = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({side = 'right', className, children, ...props}, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({side}), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <span className="sr-only">Close</span>
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
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

interface SheetHeaderComponent {
  (props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element
  displayName: string
}

const SheetHeader: SheetHeaderComponent = Object.assign(
  ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
    <div
      className={cn(
        'flex flex-col space-y-2 text-center sm:text-left',
        className
      )}
      {...props}
    />
  ),
  {displayName: 'SheetHeader'}
)

interface SheetFooterComponent {
  (props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element
  displayName: string
}

const SheetFooter: SheetFooterComponent = Object.assign(
  ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  ),
  {displayName: 'SheetFooter'}
)

export const SheetTitle: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> &
    React.RefAttributes<React.ElementRef<typeof SheetPrimitive.Title>>
> = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({className, ...props}, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

export const SheetDescription: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> &
    React.RefAttributes<React.ElementRef<typeof SheetPrimitive.Description>>
> = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({className, ...props}, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetFooter,
}
