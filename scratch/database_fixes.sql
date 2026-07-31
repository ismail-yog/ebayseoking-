-- ERROR 2 FIX: Update the trigger to handle missing full_name in OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'eBay Seller'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ERROR 3 FIX: Create an RPC for atomic credit deduction to prevent double-spend
CREATE OR REPLACE FUNCTION public.deduct_optimization_credit(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  current_used INT;
  current_limit INT;
  result JSONB;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT optimizations_used, optimization_limit 
  INTO current_used, current_limit
  FROM public.users
  WHERE id = user_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "User not found"}'::JSONB;
  END IF;

  IF current_used >= current_limit THEN
    RETURN '{"success": false, "error": "Insufficient credits"}'::JSONB;
  END IF;

  -- Deduct the credit
  UPDATE public.users
  SET optimizations_used = optimizations_used + 1,
      updated_at = NOW()
  WHERE id = user_uuid;

  RETURN '{"success": true}'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
