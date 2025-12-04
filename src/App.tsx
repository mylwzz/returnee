import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import SchedulePickup from "./pages/SchedulePickup";
import ReviewPickup from "./pages/ReviewPickup";
import PickupConfirmation from "./pages/PickupConfirmation";
import ActivePickup from "./pages/ActivePickup";
import PickupReceipt from "./pages/PickupReceipt";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverPickupDetail from "./pages/driver/DriverPickupDetail";
import DriverApplication from "./pages/driver/DriverApplication";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<SchedulePickup />} />
          <Route path="/schedule/review" element={<ReviewPickup />} />
          <Route path="/pickup/:id/confirmation" element={<PickupConfirmation />} />
          <Route path="/pickup/:id" element={<ActivePickup />} />
          <Route path="/pickup/:id/receipt" element={<PickupReceipt />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/pickup/:id" element={<DriverPickupDetail />} />
          <Route path="/driver/apply" element={<DriverApplication />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
