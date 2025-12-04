-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'driver', 'admin');

-- Create drop_carrier enum
CREATE TYPE public.drop_carrier AS ENUM ('ups', 'fedex', 'usps', 'best_option');

-- Create pickup_status enum
CREATE TYPE public.pickup_status AS ENUM ('requested', 'scheduled', 'driver_assigned', 'picked_up', 'dropped_at_carrier', 'completed', 'canceled');

-- Create return_artifact_type enum
CREATE TYPE public.return_artifact_type AS ENUM ('file', 'qr_code');

-- Create custody_event_type enum
CREATE TYPE public.custody_event_type AS ENUM ('pickup_photo', 'pickup_scan', 'drop_photo', 'drop_receipt');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create pickups table
CREATE TABLE public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  drop_carrier drop_carrier NOT NULL,
  drop_location_label TEXT,
  return_artifact_type return_artifact_type NOT NULL,
  return_artifact_url TEXT,
  return_artifact_text TEXT,
  needs_box BOOLEAN NOT NULL DEFAULT false,
  needs_label_print BOOLEAN NOT NULL DEFAULT false,
  return_deadline DATE NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  notes_for_driver TEXT,
  status pickup_status NOT NULL DEFAULT 'requested',
  estimated_fee_cents INTEGER NOT NULL DEFAULT 299,
  final_fee_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create custody_events table
CREATE TABLE public.custody_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES public.pickups(id) ON DELETE CASCADE,
  event_type custody_event_type NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_events ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'driver' THEN 2 
      WHEN 'customer' THEN 3 
    END
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies (users can only view their own roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Pickups policies
CREATE POLICY "Customers can view their own pickups"
  ON public.pickups FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own pickups"
  ON public.pickups FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own pickups"
  ON public.pickups FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view assigned pickups"
  ON public.pickups FOR SELECT
  USING (
    public.has_role(auth.uid(), 'driver') AND 
    (driver_id = auth.uid() OR driver_id IS NULL)
  );

CREATE POLICY "Drivers can update assigned pickups"
  ON public.pickups FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'driver') AND 
    driver_id = auth.uid()
  );

CREATE POLICY "Admins can manage all pickups"
  ON public.pickups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Custody events policies
CREATE POLICY "Customers can view custody events for their pickups"
  ON public.custody_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pickups 
      WHERE pickups.id = custody_events.pickup_id 
      AND pickups.customer_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can manage custody events for their pickups"
  ON public.custody_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pickups 
      WHERE pickups.id = custody_events.pickup_id 
      AND pickups.driver_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all custody events"
  ON public.custody_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  
  -- Assign default customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pickups_updated_at
  BEFORE UPDATE ON public.pickups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();