import { useState, useEffect, useRef } from 'react';
import { LoadingScreen } from './LoadingScreen';

interface PageLoaderProps {
  children: React.ReactNode;
  minLoadTime?: number;
}

export function PageLoader({ children, minLoadTime = 500 }: PageLoaderProps) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const hasLoadedRef = useRef(false);

  // Only show loader on initial app load, not on route changes
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const handleLoad = () => {
      setTimeout(() => {
        setIsInitialLoad(false);
        setTimeout(() => setShowContent(true), 50);
        hasLoadedRef.current = true;
      }, minLoadTime);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [minLoadTime]);

  // If already loaded, show content immediately
  if (hasLoadedRef.current) {
    return <>{children}</>;
  }

  return (
    <>
      {isInitialLoad && <LoadingScreen />}
      <div 
        className={`transition-opacity duration-200 ${showContent ? 'opacity-100' : 'opacity-0'}`}
        style={{ visibility: showContent ? 'visible' : 'hidden' }}
      >
        {children}
      </div>
    </>
  );
}
