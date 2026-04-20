/*
  # Add research_identifier column to profiles

  1. New Column
    - `research_identifier` (text, unique) - Auto-generated unique ID: first 3 letters of surname (uppercased) + 3 random digits (e.g., SMI482)

  2. Trigger
    - `generate_research_identifier` - Automatically generates research_identifier on INSERT or UPDATE of full_name
    - Uses first 3 letters of the last word in full_name, padded with 'X' if surname is shorter than 3 chars
    - Appends 3 random digits (000-999)
    - Retries up to 10 times on uniqueness collision

  3. Backfill
    - Generates research_identifier for all existing profiles that don't have one
*/

-- Add the column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'research_identifier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN research_identifier text;
  END IF;
END $$;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_research_identifier_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_research_identifier_key UNIQUE (research_identifier);
  END IF;
END $$;

-- Create the function that generates a research identifier
CREATE OR REPLACE FUNCTION generate_research_identifier()
RETURNS trigger AS $$
DECLARE
  surname_part text;
  name_parts text[];
  surname text;
  new_id text;
  attempts int := 0;
BEGIN
  -- Only generate if research_identifier is null or full_name changed
  IF NEW.research_identifier IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.full_name = NEW.full_name) THEN
    RETURN NEW;
  END IF;

  -- Extract surname (last word of full_name)
  IF NEW.full_name IS NOT NULL AND trim(NEW.full_name) != '' THEN
    name_parts := string_to_array(trim(NEW.full_name), ' ');
    surname := name_parts[array_length(name_parts, 1)];
  ELSE
    surname := 'XXX';
  END IF;

  -- Take first 3 letters, uppercase, pad with X if needed
  surname_part := upper(left(regexp_replace(surname, '[^a-zA-Z]', '', 'g'), 3));
  IF length(surname_part) < 3 THEN
    surname_part := rpad(surname_part, 3, 'X');
  END IF;

  -- Generate unique identifier with retry
  LOOP
    new_id := surname_part || lpad(floor(random() * 1000)::text, 3, '0');
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE research_identifier = new_id AND id != NEW.id) THEN
      NEW.research_identifier := new_id;
      RETURN NEW;
    END IF;

    attempts := attempts + 1;
    IF attempts >= 10 THEN
      -- Fallback: use 4 digits instead
      new_id := surname_part || lpad(floor(random() * 10000)::text, 4, '0');
      NEW.research_identifier := new_id;
      RETURN NEW;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_generate_research_identifier'
  ) THEN
    CREATE TRIGGER trg_generate_research_identifier
      BEFORE INSERT OR UPDATE OF full_name ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION generate_research_identifier();
  END IF;
END $$;

-- Backfill existing profiles that don't have a research_identifier
DO $$
DECLARE
  r RECORD;
  name_parts text[];
  surname text;
  surname_part text;
  new_id text;
  attempts int;
BEGIN
  FOR r IN SELECT id, full_name FROM profiles WHERE research_identifier IS NULL
  LOOP
    -- Extract surname
    IF r.full_name IS NOT NULL AND trim(r.full_name) != '' THEN
      name_parts := string_to_array(trim(r.full_name), ' ');
      surname := name_parts[array_length(name_parts, 1)];
    ELSE
      surname := 'XXX';
    END IF;

    surname_part := upper(left(regexp_replace(surname, '[^a-zA-Z]', '', 'g'), 3));
    IF length(surname_part) < 3 THEN
      surname_part := rpad(surname_part, 3, 'X');
    END IF;

    attempts := 0;
    LOOP
      new_id := surname_part || lpad(floor(random() * 1000)::text, 3, '0');
      
      IF NOT EXISTS (SELECT 1 FROM profiles WHERE research_identifier = new_id) THEN
        UPDATE profiles SET research_identifier = new_id WHERE id = r.id;
        EXIT;
      END IF;

      attempts := attempts + 1;
      IF attempts >= 10 THEN
        new_id := surname_part || lpad(floor(random() * 10000)::text, 4, '0');
        UPDATE profiles SET research_identifier = new_id WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;
