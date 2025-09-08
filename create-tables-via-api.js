const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'nkxeawivmzxbnoakpkvz';
const ACCESS_TOKEN = 'sbp_d5aac5a654621fc679b6df2e174dd859637a4f13';

async function executeSQLViaAPI() {
    console.log('🚀 Executing SQL via Supabase Management API...\n');

    // Read SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('./complete-setup.sql', 'utf8');

    try {
        // Use Supabase Management API to execute SQL
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: sql
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            
            // Try alternative approach using service role key
            console.log('\n🔄 Trying alternative approach with service role key...\n');
            return await executeSQLViaRPC();
        }

        const result = await response.json();
        console.log('✅ SQL executed successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));
        
        return true;
    } catch (error) {
        console.error('❌ Failed to execute SQL:', error.message);
        console.log('\n🔄 Trying alternative approach...\n');
        return await executeSQLViaRPC();
    }
}

async function executeSQLViaRPC() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('📝 Executing SQL statements individually...\n');

    const sqlStatements = [
        // Enable UUID extension
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
        
        // Create events table
        `CREATE TABLE IF NOT EXISTS events (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            unique_url VARCHAR(10) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            date TIMESTAMP WITH TIME ZONE,
            description TEXT,
            location VARCHAR(255),
            currency VARCHAR(3) DEFAULT 'JPY',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        // Create participants table
        `CREATE TABLE IF NOT EXISTS participants (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        // Create expenses table
        `CREATE TABLE IF NOT EXISTS expenses (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            paid_by UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'JPY',
            category VARCHAR(50) DEFAULT 'other',
            description TEXT,
            receipt_url TEXT,
            split_type VARCHAR(20) DEFAULT 'equal',
            splits JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        // Create expense_splits table
        `CREATE TABLE IF NOT EXISTS expense_splits (
            expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
            participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            is_settled BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (expense_id, participant_id)
        )`,
        
        // Create settlements table
        `CREATE TABLE IF NOT EXISTS settlements (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            from_participant UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
            to_participant UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'JPY',
            settled_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) DEFAULT 'pending',
            CHECK (from_participant != to_participant)
        )`
    ];

    const indexStatements = [
        `CREATE INDEX IF NOT EXISTS idx_events_unique_url ON events(unique_url)`,
        `CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id)`,
        `CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id)`,
        `CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by)`,
        `CREATE INDEX IF NOT EXISTS idx_expense_splits_participant_id ON expense_splits(participant_id)`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_event_id ON settlements(event_id)`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_from_participant ON settlements(from_participant)`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_to_participant ON settlements(to_participant)`
    ];

    const rlsStatements = [
        `ALTER TABLE events ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE participants ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE expenses ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE settlements ENABLE ROW LEVEL SECURITY`
    ];

    const policyStatements = [
        `CREATE POLICY IF NOT EXISTS "Allow all access to events" ON events FOR ALL USING (true)`,
        `CREATE POLICY IF NOT EXISTS "Allow all access to participants" ON participants FOR ALL USING (true)`,
        `CREATE POLICY IF NOT EXISTS "Allow all access to expenses" ON expenses FOR ALL USING (true)`,
        `CREATE POLICY IF NOT EXISTS "Allow all access to expense_splits" ON expense_splits FOR ALL USING (true)`,
        `CREATE POLICY IF NOT EXISTS "Allow all access to settlements" ON settlements FOR ALL USING (true)`
    ];

    let successCount = 0;
    let failCount = 0;

    // Execute table creation
    console.log('📊 Creating tables...');
    for (const sql of sqlStatements) {
        try {
            const tableName = sql.match(/CREATE TABLE.*?(\w+)/i)?.[1] || 'statement';
            console.log(`  Creating ${tableName}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', { query: sql });
            
            if (error) {
                console.log(`  ❌ Failed: ${error.message}`);
                failCount++;
            } else {
                console.log(`  ✅ Success`);
                successCount++;
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
            failCount++;
        }
    }

    // Execute indexes
    console.log('\n🔍 Creating indexes...');
    for (const sql of indexStatements) {
        try {
            const indexName = sql.match(/CREATE INDEX.*?(\w+)/i)?.[1] || 'index';
            console.log(`  Creating ${indexName}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', { query: sql });
            
            if (error) {
                console.log(`  ⚠️ Skipped: ${error.message}`);
            } else {
                console.log(`  ✅ Success`);
                successCount++;
            }
        } catch (err) {
            console.log(`  ⚠️ Skipped: ${err.message}`);
        }
    }

    // Execute RLS
    console.log('\n🔒 Enabling RLS...');
    for (const sql of rlsStatements) {
        try {
            const tableName = sql.match(/ALTER TABLE (\w+)/i)?.[1] || 'table';
            console.log(`  Enabling RLS on ${tableName}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', { query: sql });
            
            if (error) {
                console.log(`  ⚠️ Skipped: ${error.message}`);
            } else {
                console.log(`  ✅ Success`);
                successCount++;
            }
        } catch (err) {
            console.log(`  ⚠️ Skipped: ${err.message}`);
        }
    }

    // Execute policies
    console.log('\n📝 Creating policies...');
    for (const sql of policyStatements) {
        try {
            const policyName = sql.match(/CREATE POLICY.*?"([^"]+)"/i)?.[1] || 'policy';
            console.log(`  Creating policy: ${policyName}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', { query: sql });
            
            if (error) {
                console.log(`  ⚠️ Skipped: ${error.message}`);
            } else {
                console.log(`  ✅ Success`);
                successCount++;
            }
        } catch (err) {
            console.log(`  ⚠️ Skipped: ${err.message}`);
        }
    }

    console.log(`\n📊 Summary: ${successCount} successful, ${failCount} failed`);
    return failCount === 0;
}

async function verifyTables() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('\n🔍 Verifying tables...\n');

    const tables = ['events', 'participants', 'expenses', 'expense_splits', 'settlements'];
    let foundCount = 0;

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: Found`);
                foundCount++;
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }

    console.log(`\n📊 Status: ${foundCount}/${tables.length} tables found`);
    return foundCount === tables.length;
}

async function main() {
    console.log('🚀 Walican Database Setup via API\n');
    
    // Try to execute SQL
    const sqlExecuted = await executeSQLViaAPI();
    
    if (sqlExecuted) {
        // Verify tables
        const tablesReady = await verifyTables();
        
        if (tablesReady) {
            console.log('\n✅ Database setup complete!');
            console.log('You can now run: node verify-and-setup-types.js');
        } else {
            console.log('\n⚠️ Some tables might not be ready yet. Please wait a moment and run verification again.');
        }
    } else {
        console.log('\n❌ Failed to execute SQL. Please check the errors above.');
    }
}

main().catch(console.error);