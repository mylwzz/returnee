import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  MapPin, Navigation, User, Package, ChevronRight, DollarSign, 
  ShieldCheck, Map as MapIcon, ArrowLeft, Star, Truck, FileText, 
  CreditCard, LogOut, Calendar, Box, Store, Clock
} from "lucide-react";

// Mock Data: Multiple pickup locations on the map
const MOCK_LOCATIONS = [
  {
    id: '1',
    name: 'Sunset Apartments',
    packages: 3,
    deadline: '12/26',
    distance: '0.8 mi',
    top: '30%',
    left: '20%',
    urgent: false,
    items: ['Zara Jacket', 'Nike Shoes', 'Blender'],
    earnings: 12.50,
    address: '1234 Sunset Blvd, Apt 5B',
    windowStart: '9:00 AM',
    windowEnd: '12:00 PM',
    carrier: 'UPS'
  },
  {
    id: '2',
    name: 'Tech Office Park',
    packages: 5,
    deadline: '12/24', // Urgent
    distance: '1.2 mi',
    top: '60%',
    left: '70%',
    urgent: true,
    items: ['Monitor Stand', 'Keyboard', 'Mouse', 'Cables', 'Headset'],
    earnings: 22.00,
    address: '555 Innovation Dr, Suite 200',
    windowStart: '10:00 AM',
    windowEnd: '2:00 PM',
    carrier: 'FedEx'
  },
  {
    id: '3',
    name: 'Downtown Lofts',
    packages: 1,
    deadline: '12/28',
    distance: '2.5 mi',
    top: '40%',
    left: '80%',
    urgent: false,
    items: ['Coffee Maker'],
    earnings: 8.00,
    address: '789 Main St, Unit 12',
    windowStart: '1:00 PM',
    windowEnd: '5:00 PM',
    carrier: 'USPS'
  }
];

type MockLocation = typeof MOCK_LOCATIONS[number];

// Mock Drop-off Options
const DROPOFF_OPTIONS = [
  { id: 'ups', name: 'The UPS Store', distance: '0.4 mi', time: '3 min', icon: 'bg-amber-700' },
  { id: 'wholefoods', name: 'Whole Foods Market', distance: '1.2 mi', time: '8 min', icon: 'bg-primary' },
  { id: 'fedex', name: 'FedEx Office', distance: '0.9 mi', time: '5 min', icon: 'bg-purple-600' }
];

const USER_PROFILE = {
  name: 'Alex Driver',
  rating: 4.94,
  trips: 1243,
  years: 2.5,
  vehicle: 'Toyota Prius (Blue)'
};

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'dashboard' | 'profile'>('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  // orderStatus: idle -> active (pickup) -> dropoff_select -> delivering -> completed
  const [orderStatus, setOrderStatus] = useState<'idle' | 'active' | 'dropoff_select' | 'delivering' | 'completed'>('idle');
  const [selectedLocation, setSelectedLocation] = useState<MockLocation | null>(null);
  const [activeOrder, setActiveOrder] = useState<MockLocation | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<typeof DROPOFF_OPTIONS[0] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleGoOnline = () => {
    setIsOnline(true);
    setSelectedLocation(null);
  };

  const handleGoOffline = () => {
    setIsOnline(false);
    setSelectedLocation(null);
  };

  const handlePinClick = (location: MockLocation) => {
    setSelectedLocation(location);
  };

  const acceptOrder = () => {
    setActiveOrder(selectedLocation);
    setOrderStatus('active');
    setSelectedLocation(null);
    toast.success("Pickup claimed successfully!");
  };

  // Step 1: User confirms pickup, show dropoff options
  const confirmPickup = () => {
    setOrderStatus('dropoff_select');
  };

  // Step 2: User selects a dropoff location
  const selectDropoff = (dropoff: typeof DROPOFF_OPTIONS[0]) => {
    setSelectedDropoff(dropoff);
    setOrderStatus('delivering');
  };

  // Step 3: User confirms return complete
  const completeOrder = () => {
    setOrderStatus('completed');
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setOrderStatus('idle');
      setActiveOrder(null);
      setSelectedDropoff(null);
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden text-foreground relative">
      
      {/* --- DASHBOARD PAGE --- */}
      {view === 'dashboard' && (
        <div className="flex flex-col h-full w-full relative">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-background to-transparent pt-6 pointer-events-none">
            <div className="flex justify-between items-center pointer-events-auto">
              <div className="bg-card/90 backdrop-blur border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-elegant font-bold">
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-destructive'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              
              <button 
                onClick={() => setView('profile')}
                className="h-10 w-10 bg-card/90 backdrop-blur border border-border rounded-full flex items-center justify-center shadow-elegant active:scale-95 transition-transform"
              >
                <User size={20} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Map Layer */}
          <div className="flex-1 bg-secondary relative overflow-hidden" onClick={() => setSelectedLocation(null)}>
            <SimulatedMap isActive={orderStatus === 'active' || orderStatus === 'delivering'} />
            
            {/* Render Pickup Pins only when Online and Idle */}
            {isOnline && orderStatus === 'idle' && MOCK_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinClick(loc);
                }}
                className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 hover:scale-110 active:scale-95 z-10 flex flex-col items-center group"
                style={{ top: loc.top, left: loc.left }}
              >
                {/* Badge Count */}
                <div className="bg-card text-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-md mb-1 border border-border">
                  {loc.packages} pkgs
                </div>
                {/* Pin Icon */}
                <div className={`h-10 w-10 ${loc.urgent ? 'bg-destructive' : 'bg-primary'} rounded-full flex items-center justify-center shadow-lg border-2 border-background relative`}>
                  <Package size={20} className="text-primary-foreground" />
                  {/* Pulse effect for urgent items */}
                  {loc.urgent && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-destructive opacity-75"></div>
                  )}
                </div>
                {/* Triangle pointer */}
                <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${loc.urgent ? 'border-t-destructive' : 'border-t-primary'}`}></div>
              </button>
            ))}

            {/* Dropoff Marker (Visible during delivery) */}
            {orderStatus === 'delivering' && selectedDropoff && (
              <div className="absolute top-1/3 left-3/4 transform -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center animate-bounce">
                <div className={`h-12 w-12 ${selectedDropoff.icon} text-white rounded-full flex items-center justify-center shadow-xl border-2 border-background`}>
                  <Store size={24} />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-muted"></div>
              </div>
            )}

            {/* Driver Marker (Always visible when idle) */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center pointer-events-none transition-all duration-1000 ${orderStatus === 'active' || orderStatus === 'delivering' ? 'opacity-0' : 'opacity-100'}`}>
              <div className="relative">
                <div className="h-16 w-16 bg-primary/30 rounded-full animate-ping absolute top-0 left-0"></div>
                <div className="h-16 w-16 bg-card rounded-full shadow-glow flex items-center justify-center relative border-4 border-primary">
                  <Navigation size={28} className="text-primary fill-current" />
                </div>
              </div>
            </div>

            {/* Offline Overlay */}
            {!isOnline && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-foreground text-2xl font-bold mb-2">You are currently offline</h2>
                <p className="text-muted-foreground mb-8 max-w-xs">Go online to view return requests on the map.</p>
                <button 
                  onClick={handleGoOnline}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold px-12 py-4 rounded-full shadow-glow transition-all active:scale-95"
                >
                  GO ONLINE
                </button>
              </div>
            )}
          </div>

          {/* --- INTERACTIVE BOTTOM SHEETS --- */}

          {/* 1. IDLE STATE: Online - "Scan Map" instruction */}
          {isOnline && orderStatus === 'idle' && !selectedLocation && (
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
              <div className="bg-card/95 backdrop-blur rounded-2xl shadow-elegant p-4 flex items-center gap-4 pointer-events-auto border border-border">
                <div className="bg-primary/20 p-2 rounded-full text-primary">
                  <MapIcon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">Scan for Returns</h3>
                  <p className="text-xs text-muted-foreground">
                    {MOCK_LOCATIONS.length} pickups available • Tap pins to view
                  </p>
                </div>
                <button onClick={handleGoOffline} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground font-semibold rounded-lg text-sm border border-border">
                  Offline
                </button>
              </div>
            </div>
          )}

          {/* 2. SELECTED LOCATION DETAILS SHEET */}
          {isOnline && orderStatus === 'idle' && selectedLocation && (
            <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-elegant z-40 animate-slide-up flex flex-col max-h-[70vh] border-t border-border">
              {/* Close handle */}
              <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setSelectedLocation(null)}>
                <div className="h-1.5 w-12 bg-border rounded-full"></div>
              </div>
              <div className="p-6 pt-2 overflow-y-auto">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedLocation.name}</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                      <MapPin size={14} /> {selectedLocation.distance} away
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-bold text-primary">${selectedLocation.earnings.toFixed(2)}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Est. Earn</p>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-secondary p-3 rounded-xl border border-border flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                      <Box size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg leading-none">{selectedLocation.packages}</p>
                      <p className="text-xs text-muted-foreground">Packages</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${selectedLocation.urgent ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary border-border'}`}>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedLocation.urgent ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}`}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className={`font-bold text-lg leading-none ${selectedLocation.urgent ? 'text-destructive' : 'text-foreground'}`}>
                        {selectedLocation.deadline}
                      </p>
                      <p className={`text-xs ${selectedLocation.urgent ? 'text-destructive/80' : 'text-muted-foreground'}`}>Deadline</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-foreground uppercase mb-2">Manifest</h4>
                  <div className="bg-secondary rounded-xl p-1 border border-border">
                    {selectedLocation.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border-b border-border last:border-0">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-foreground uppercase mb-2">Details</h4>
                  <div className="bg-secondary rounded-xl p-4 space-y-3 border border-border">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{selectedLocation.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedLocation.windowStart} - {selectedLocation.windowEnd}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Drop at: {selectedLocation.carrier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setSelectedLocation(null)}
                    className="col-span-1 py-4 bg-secondary hover:bg-secondary/80 text-muted-foreground font-bold rounded-xl transition-colors border border-border"
                  >
                    Ignore
                  </button>
                  <button 
                    onClick={acceptOrder}
                    className="col-span-2 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-glow flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>Accept Pickup</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. ACTIVE ORDER DASHBOARD (PICKUP) */}
          {isOnline && orderStatus === 'active' && activeOrder && (
            <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-elegant z-30 flex flex-col max-h-[50vh] animate-slide-up border-t border-border">
              
              {/* Navigation Instruction Bar */}
              <div className="bg-primary p-4 text-primary-foreground rounded-t-3xl flex gap-4 items-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Navigation size={100} />
                </div>
                <div className="bg-primary-foreground/20 p-2 rounded-lg backdrop-blur-sm z-10">
                  <ChevronRight size={32} />
                </div>
                <div className="z-10">
                  <h3 className="text-2xl font-bold">Arrive in 4 min</h3>
                  <p className="text-primary-foreground/80">Heading to {activeOrder.name}</p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto bg-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-xl text-foreground">Pickup Details</h4>
                    <p className="text-muted-foreground text-sm">{activeOrder.packages} Packages • {activeOrder.items.length} Items</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors border border-border">
                      <ShieldCheck size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className={`flex items-start gap-3 p-4 rounded-xl ${activeOrder.urgent ? 'bg-destructive/10 border border-destructive/30' : 'bg-warning/10 border border-warning/30'}`}>
                    <Calendar className={`${activeOrder.urgent ? 'text-destructive' : 'text-warning'} shrink-0 mt-0.5`} size={18} />
                    <div>
                      <p className={`text-sm font-bold ${activeOrder.urgent ? 'text-destructive' : 'text-warning'}`}>
                        Deadline: {activeOrder.deadline}
                      </p>
                      <p className={`text-xs mt-1 ${activeOrder.urgent ? 'text-destructive/80' : 'text-warning/80'}`}>
                        {activeOrder.urgent ? 'URGENT: Return by this date to avoid penalties!' : 'Ensure items are scanned before the date.'}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={confirmPickup}
                  className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-glow flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Package size={20} />
                  <span>Confirm Pickup at Location</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. DROPOFF SELECTION MODAL */}
          {isOnline && orderStatus === 'dropoff_select' && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
              <div className="w-full bg-card rounded-t-3xl p-6 shadow-elegant animate-slide-up border-t border-border">
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Drop-off</h2>
                <p className="text-muted-foreground mb-6">Choose a nearby carrier location to return items.</p>
                
                <div className="space-y-3 mb-6">
                  {DROPOFF_OPTIONS.map((opt) => (
                    <button 
                      key={opt.id}
                      onClick={() => selectDropoff(opt)}
                      className="w-full flex items-center justify-between p-4 bg-secondary border border-border rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all active:scale-95 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 ${opt.icon} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                          <Store size={24} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-foreground group-hover:text-primary">{opt.name}</h4>
                          <p className="text-sm text-muted-foreground">{opt.distance} • {opt.time} away</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary" />
                    </button>
                  ))}
                </div>
                
                <button onClick={() => setOrderStatus('active')} className="w-full py-3 text-muted-foreground font-semibold hover:text-foreground transition-colors">
                  Back to Pickup
                </button>
              </div>
            </div>
          )}

          {/* 5. ACTIVE DELIVERY DASHBOARD (DROPOFF) */}
          {isOnline && orderStatus === 'delivering' && selectedDropoff && activeOrder && (
            <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-elegant z-30 flex flex-col max-h-[45vh] animate-slide-up border-t border-border">
              
              {/* Navigation Instruction Bar (Blue for delivery) */}
              <div className="bg-info p-4 text-white rounded-t-3xl flex gap-4 items-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Navigation size={100} />
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm z-10">
                  <ChevronRight size={32} />
                </div>
                <div className="z-10">
                  <h3 className="text-2xl font-bold">{selectedDropoff.time}</h3>
                  <p className="text-white/80">Heading to {selectedDropoff.name}</p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto bg-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-xl text-foreground">Return Drop-off</h4>
                    <p className="text-muted-foreground text-sm">Scan items at the counter</p>
                  </div>
                  <div className={`h-12 w-12 ${selectedDropoff.icon} rounded-full flex items-center justify-center text-white shadow-lg`}>
                    <Store size={20} />
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="p-4 bg-secondary border border-border rounded-xl flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Items to return</span>
                    <span className="bg-foreground text-background font-bold px-3 py-1 rounded-lg">{activeOrder.items.length}</span>
                  </div>
                </div>

                <button 
                  onClick={completeOrder}
                  className="w-full bg-info text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ShieldCheck size={20} />
                  <span>Order Returned</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. COMPLETED CONFETTI OVERLAY */}
          {showConfetti && activeOrder && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm animate-fade-in">
              <div className="text-center text-primary-foreground scale-125">
                <div className="h-20 w-20 bg-primary-foreground text-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <DollarSign size={40} strokeWidth={3} />
                </div>
                <h2 className="text-4xl font-extrabold mb-2">Success!</h2>
                <p className="font-medium text-primary-foreground/80">+${activeOrder.earnings.toFixed(2)} earned</p>
                <p className="text-sm text-primary-foreground/60 mt-1">Return Processed</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- PROFILE PAGE --- */}
      {view === 'profile' && (
        <div className="absolute inset-0 flex flex-col h-full w-full bg-background z-[100] overflow-y-auto animate-slide-left">
          
          {/* Navbar */}
          <div className="p-4 flex items-center gap-4 bg-background sticky top-0 z-10 border-b border-border">
            <button 
              onClick={() => setView('dashboard')}
              className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground">Profile</h2>
          </div>

          <div className="px-6 py-4">
            
            {/* Header Profile Info */}
            <div className="flex flex-col items-center mb-8">
              <div className="h-24 w-24 bg-secondary rounded-full mb-4 relative overflow-hidden ring-4 ring-card shadow-elegant">
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <User size={40} className="text-muted-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{user?.user_metadata?.name || USER_PROFILE.name}</h1>
              <div className="flex items-center gap-1 mt-1 bg-secondary px-3 py-1 rounded-full border border-border">
                <Star size={14} className="text-warning fill-current" />
                <span className="text-sm font-semibold text-foreground">{USER_PROFILE.rating} Rating</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-foreground">{USER_PROFILE.trips}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Trips</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-border flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-foreground">{USER_PROFILE.years}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Years Active</div>
              </div>
            </div>

            {/* Settings List */}
            <div className="space-y-2 mb-8">
              <h3 className="text-sm font-bold text-foreground uppercase mb-3 ml-1">Account Settings</h3>
              
              <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Vehicle</p>
                    <p className="text-xs text-muted-foreground">{USER_PROFILE.vehicle}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Documents</p>
                    <p className="text-xs text-muted-foreground">License, Insurance</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Payout</p>
                    <p className="text-xs text-muted-foreground">Weekly Deposit</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 p-4 text-destructive font-bold bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-colors border border-destructive/30"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Simulated CSS Map ---
const SimulatedMap = ({ isActive }: { isActive: boolean }) => {
  return (
    <div 
      className={`w-full h-full bg-secondary relative transition-transform duration-1000 ${isActive ? 'scale-125 rotate-3' : 'scale-100'}`}
      style={{ transformOrigin: 'center center' }}
    >
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Roads */}
      <div className="absolute top-0 bottom-0 left-1/3 w-8 bg-muted border-x-4 border-border"></div>
      <div className="absolute top-1/4 left-0 right-0 h-6 bg-muted border-y-4 border-border"></div>
      <div className="absolute top-2/3 left-0 right-0 h-10 bg-muted border-y-4 border-warning/30"></div>
      
      {/* Random Buildings / Parks */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-primary/10 rounded-lg border border-primary/20"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-card/50 rounded-lg border border-border"></div>
      <div className="absolute top-1/2 left-10 w-16 h-40 bg-card/50 rounded-lg border border-border"></div>

      {/* Navigation Path (SVG overlay for active route) */}
      {isActive && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <path 
            d="M 50% 50% L 50% 27% L 75% 27%" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeDasharray="10, 10"
            className="animate-dash"
          />
        </svg>
      )}
    </div>
  );
};
