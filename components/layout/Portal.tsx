import React, { createContext, useContext, useEffect, useState } from "react";
import { View } from "react-native";

type PortalMap = Map<string, React.ReactNode>;

interface PortalContextType {
  mount: (name: string, children: React.ReactNode) => void;
  unmount: (name: string) => void;
  portals: PortalMap;
}

const PortalContext = createContext<PortalContextType>({
  mount: () => {},
  unmount: () => {},
  portals: new Map(),
});

export const PortalProvider = ({ children }: { children: React.ReactNode }) => {
  const [portals, setPortals] = useState<PortalMap>(new Map());

  const mount = (name: string, children: React.ReactNode) => {
    setPortals((prev) => new Map(prev).set(name, children));
  };

  const unmount = (name: string) => {
    setPortals((prev) => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
  };

  return (
    <PortalContext.Provider value={{ mount, unmount, portals }}>
      {children}
    </PortalContext.Provider>
  );
};

interface PortalHostProps {
  name: string;
}

export const PortalHost = ({ name }: PortalHostProps) => {
  const { portals } = useContext(PortalContext);
  const content = portals.get(name);

  return content ? <>{content}</> : null;
};

interface PortalOutletProps {
  name: string;
  children: React.ReactNode;
}

export const PortalOutlet = ({ name, children }: PortalOutletProps) => {
  const { mount, unmount } = useContext(PortalContext);

  useEffect(() => {
    mount(name, children);
    return () => unmount(name);
  }, [name, children, mount, unmount]);

  return null;
};
