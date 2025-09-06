-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_url VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    category VARCHAR(50) DEFAULT 'other',
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense splits table
CREATE TABLE expense_splits (
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (expense_id, participant_id)
);

-- Settlements table
CREATE TABLE settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    from_participant UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    to_participant UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    settled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    CHECK (from_participant != to_participant)
);

-- Indexes for better performance
CREATE INDEX idx_events_unique_url ON events(unique_url);
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expense_splits_participant_id ON expense_splits(participant_id);
CREATE INDEX idx_settlements_event_id ON settlements(event_id);
CREATE INDEX idx_settlements_from_participant ON settlements(from_participant);
CREATE INDEX idx_settlements_to_participant ON settlements(to_participant);

-- Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Policies (for now, allow all access since we don't have auth yet)
CREATE POLICY "Allow all access to events" ON events
    FOR ALL USING (true);

CREATE POLICY "Allow all access to participants" ON participants
    FOR ALL USING (true);

CREATE POLICY "Allow all access to expenses" ON expenses
    FOR ALL USING (true);

CREATE POLICY "Allow all access to expense_splits" ON expense_splits
    FOR ALL USING (true);

CREATE POLICY "Allow all access to settlements" ON settlements
    FOR ALL USING (true);