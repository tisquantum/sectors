"use client";
import React, { createContext, useContext, useState } from "react";

// Create the Drawer context
const DrawerContext = createContext({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: (drawerState: boolean) => {},
  onOpenChange: (open: boolean) => {},
});

// Custom hook to use the Drawer context
export const useDrawer = () => useContext(DrawerContext);

// DrawerProvider component to wrap around your app
export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const toggleDrawer = (drawerState: boolean) => {
    setIsOpen(drawerState);
  }
  const onOpenChange = (open: boolean) => setIsOpen(open);

  return (
    <DrawerContext.Provider
      value={{ isOpen, openDrawer, closeDrawer, toggleDrawer, onOpenChange }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
