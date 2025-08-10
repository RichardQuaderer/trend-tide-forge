import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Generate from "./pages/Generate";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";
import Editor from "./pages/Editor";
import Publish from "./pages/Publish";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/oauth-callback";

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/library" element={<Library />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/publish/:id" element={<Publish />} />
          </Route>
          <Route path="/" element={<Welcome />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
