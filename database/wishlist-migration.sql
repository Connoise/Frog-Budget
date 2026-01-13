-- Wishlist Table Migration
-- Run this in your Supabase SQL Editor to add wishlist functionality

-- ============================================
-- WISHLIST TABLE
-- Future purchase items
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_category_id ON wishlist(category_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist(priority);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Wishlist policies
CREATE POLICY "Users can view their own wishlist"
    ON wishlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wishlist items"
    ON wishlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items"
    ON wishlist FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items"
    ON wishlist FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE TRIGGER update_wishlist_updated_at
    BEFORE UPDATE ON wishlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE wishlist;
