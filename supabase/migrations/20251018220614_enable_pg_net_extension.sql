/*
  # Enable pg_net Extension
  
  1. Purpose
    - Enable the pg_net extension to allow database triggers to make HTTP calls
    - Required for the low metric alert system to call the edge function
  
  2. Changes
    - Enable pg_net extension if not already enabled
*/

-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;