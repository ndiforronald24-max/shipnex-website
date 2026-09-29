import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

interface RouterContextType {
  path: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({ path: '/', navigate: () => {} });

export function useRouter() {
  return useContext(RouterContext);
}

export function SimpleRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function Routes({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  
  const findRoute = (children: ReactNode): ReactNode => {
    let result: ReactNode = null;
    
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child && typeof child === 'object' && 'props' in child) {
          const routeChild = child as { props: { path?: string; element?: ReactNode } };
          if (routeChild.props.path === path) {
            result = routeChild.props.element;
            break;
          }
        }
      }
    }
    
    return result;
  };

  return <>{findRoute(children)}</>;
}

export function Route({ element }: { path?: string; element?: ReactNode }) {
  return <>{element}</>;
}

export function Link({ to, children, className, onClick }: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  const { navigate } = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    onClick?.();
  };

  return <a href={to} className={className} onClick={handleClick}>{children}</a>;
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useLocation() {
  const { path } = useRouter();
  return { pathname: path };
}

export function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to); }, [navigate, to]);
  return null;
}
