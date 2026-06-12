CREATE TABLE public.user_entitlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlement"
ON public.user_entitlements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entitlement"
ON public.user_entitlements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entitlement"
ON public.user_entitlements FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_entitlements_updated_at
BEFORE UPDATE ON public.user_entitlements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- מחיקת חוקי הגישה המסוכנים של המשתמשים
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_entitlements;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.user_entitlements;
DROP POLICY IF EXISTS "Individuals can create entitlements" ON public.user_entitlements;
DROP POLICY IF EXISTS "Individuals can update entitlements" ON public.user_entitlements;

-- יצירת חוק חדש ומאובטח המאפשר רק לקרוא נתונים
CREATE POLICY "Users can only read their own entitlements" 
ON public.user_entitlements 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
