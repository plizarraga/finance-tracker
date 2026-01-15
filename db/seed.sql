-- Finance Tracker Seed Data
-- Replace 'YOUR_USER_ID' with your actual user ID after signing up

-- Sample income categories
INSERT INTO categories (user_id, name, type) VALUES
  ('YOUR_USER_ID', 'Salary', 'income'),
  ('YOUR_USER_ID', 'Freelance', 'income'),
  ('YOUR_USER_ID', 'Investments', 'income'),
  ('YOUR_USER_ID', 'Other Income', 'income');

-- Sample expense categories
INSERT INTO categories (user_id, name, type) VALUES
  ('YOUR_USER_ID', 'Food & Dining', 'expense'),
  ('YOUR_USER_ID', 'Transportation', 'expense'),
  ('YOUR_USER_ID', 'Utilities', 'expense'),
  ('YOUR_USER_ID', 'Entertainment', 'expense'),
  ('YOUR_USER_ID', 'Shopping', 'expense'),
  ('YOUR_USER_ID', 'Health', 'expense'),
  ('YOUR_USER_ID', 'Housing', 'expense'),
  ('YOUR_USER_ID', 'Personal Care', 'expense'),
  ('YOUR_USER_ID', 'Education', 'expense'),
  ('YOUR_USER_ID', 'Travel', 'expense'),
  ('YOUR_USER_ID', 'Subscriptions', 'expense'),
  ('YOUR_USER_ID', 'Other Expenses', 'expense');

-- Sample accounts
INSERT INTO accounts (user_id, name, description) VALUES
  ('YOUR_USER_ID', 'Checking Account', 'Main bank account for daily expenses'),
  ('YOUR_USER_ID', 'Savings Account', 'Emergency fund and savings'),
  ('YOUR_USER_ID', 'Cash', 'Physical cash on hand'),
  ('YOUR_USER_ID', 'Credit Card', 'Credit card for purchases');
