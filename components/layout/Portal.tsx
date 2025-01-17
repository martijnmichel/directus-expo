import { useNavigation, usePathname, useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const mount = useCallback((name: string, children: React.ReactNode) => {
    setPortals((prev) => {
      const next = new Map(prev);
      next.set(name, children);
      return next;
    });
  }, []);

  const unmount = useCallback((name: string) => {
    setPortals((prev) => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mount,
      unmount,
      portals,
    }),
    [mount, unmount, portals]
  );

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
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
  path?: string | RegExp;
}

export const PortalOutlet = ({ name, children, path }: PortalOutletProps) => {
  const { mount, unmount } = useContext(PortalContext);
  const navigation = useNavigation();
  const currentPath = usePathname();

  useEffect(() => {
    const pathMatches = path
      ? typeof path === "string"
        ? currentPath === path
        : path.test(currentPath)
      : true;

    if (pathMatches) {
      mount(name, children);
      return () => unmount(name);
    } else {
      unmount(name);
    }
  }, [name, children, path, currentPath, mount, unmount]);

  useEffect(() => {
    const cleanup = navigation.addListener("beforeRemove", () => {
      unmount(name);
    });

    return cleanup;
  }, [navigation, name, unmount]);

  return null;
};
