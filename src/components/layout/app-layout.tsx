import { Outlet, useLocation } from "react-router-dom";
import { TopAppBar, BottomNavigation } from "@/components/ui/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1] as const
};

export function AppLayout() {
  const location = useLocation();
  
  // Hide navigation on welcome and onboarding screens
  const hideNavigation = ['/welcome', '/onboarding'].includes(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {!hideNavigation && <TopAppBar />}
        
        <main className={`${!hideNavigation ? 'pt-16 pb-20 md:pb-0' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {!hideNavigation && <BottomNavigation />}
      </div>
    </QueryClientProvider>
  );
}