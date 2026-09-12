import { Drawer as VaulDrawer } from "vaul"
import * as React from "react"
import { cn } from "@/lib/utils"

export const Drawer = VaulDrawer.Root
export const DrawerTrigger = VaulDrawer.Trigger
export const DrawerPortal = VaulDrawer.Portal

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Overlay>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80 backdrop-blur-sm", className)}
    {...props}
  />
))
DrawerOverlay.displayName = VaulDrawer.Overlay.displayName

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Content>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <VaulDrawer.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[2rem] border bg-background overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-border shrink-0" />
      {children}
    </VaulDrawer.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"
