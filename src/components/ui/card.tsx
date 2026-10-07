import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type * as React from "react"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
}
const cardTitleVariants = cva("font-semibold leading-none tracking-tight", {
  variants: {
    size: {
      default: "text-lg",
      xl: "text-2xl",
    },
  },
  defaultVariants: { size: "default" },
})

function CardTitle({
  className,
  size,
  ...props
}: React.ComponentProps<"h3"> & VariantProps<typeof cardTitleVariants>) {
  return <h3 data-slot="card-title" className={cn(cardTitleVariants({ size }), className)} {...props} />
}
function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center p-6 pt-0", className)} {...props} />
}

export { Card, CardHeader, CardTitle, cardTitleVariants, CardDescription, CardContent, CardFooter }
