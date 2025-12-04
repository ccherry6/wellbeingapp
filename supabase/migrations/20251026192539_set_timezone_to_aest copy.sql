/*
  # Set Database Timezone to Australian Eastern Time
  
  1. Changes
    - Set database timezone to Australia/Sydney (AEST/AEDT)
    - This will affect all timestamp operations in the database
    - Timestamps will be stored in UTC but displayed/handled in AEST
  
  2. Notes
    - Australia/Sydney automatically handles daylight saving time transitions
    - AEDT (UTC+11) during daylight saving (October-April)
    - AEST (UTC+10) during standard time (April-October)
*/

-- Set database timezone to Australian Eastern Time
ALTER DATABASE postgres SET timezone TO 'Australia/Sydney';

-- Set timezone for current session
SET timezone TO 'Australia/Sydney';
