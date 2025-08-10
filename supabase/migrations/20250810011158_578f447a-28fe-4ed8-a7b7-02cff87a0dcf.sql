-- Fix OTP expiry security issue by setting it to 1 hour (3600 seconds)
-- This addresses the security warning about OTP long expiry
UPDATE auth.config SET 
  password_min_length = 6,
  password_alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  otp_expiry = 3600,  -- Set OTP expiry to 1 hour (recommended security practice)
  otp_length = 6
WHERE true;