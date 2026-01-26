-- Enable trigram extension for fast substring searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for O(1) substring search instead of O(n) full table scan
CREATE INDEX idx_expenses_desc_trgm ON expenses
  USING GIN(description_normalized gin_trgm_ops);

CREATE INDEX idx_incomes_desc_trgm ON incomes
  USING GIN(description_normalized gin_trgm_ops);

CREATE INDEX idx_transfers_desc_trgm ON transfers
  USING GIN(description_normalized gin_trgm_ops);
