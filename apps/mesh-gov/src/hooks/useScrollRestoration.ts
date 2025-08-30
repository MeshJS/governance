import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function useScrollRestoration() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Save scroll position before navigation
      const scrollPosition = window.scrollY;
      if (router.asPath === '/catalyst-proposals') {
        window.sessionStorage.setItem('scrollPos', scrollPosition.toString());
      }
    };

    const handleRouteChangeComplete = () => {
      // Restore scroll position after navigation
      if (router.asPath === '/catalyst-proposals') {
        const savedScrollPos = window.sessionStorage.getItem('scrollPos');
        if (savedScrollPos) {
          // Use RAF to ensure DOM is ready
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              window.scrollTo(0, parseInt(savedScrollPos));
              window.sessionStorage.removeItem('scrollPos');
            });
          });
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);
}
