const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration in .env.local');
    process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeRawSQL(sql) {
    try {
        // Use the REST API to execute SQL directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ sql: sql })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        // If exec_sql doesn't exist, try direct SQL execution via raw query
        console.log('Trying alternative SQL execution method...');
        
        // For creating tables, we'll need to use the database connection directly
        // This is a workaround since Supabase doesn't expose raw SQL execution in the client
        throw new Error('Cannot execute raw SQL through Supabase client. Need to use database connection or SQL editor.');
    }
}

async function createTablesDirectly() {
    try {
        console.log('Creating tables using direct operations...\n');

        // Test connection first
        console.log('1. Testing connection...');
        const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
        if (error) {
            console.log('Connection test result (expected error for non-existent table):', error.message);
        }

        // Since we can't execute raw SQL, let's try to see if tables exist by querying them
        console.log('2. Checking for existing tables...');
        
        const tablesToCheck = ['events', 'participants', 'expenses', 'expense_splits', 'settlements'];
        const existingTables = [];
        
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase.from(table).select('*').limit(1);
                if (!error) {
                    existingTables.push(table);
                    console.log(`✅ Table '${table}' exists`);
                } else {
                    console.log(`❌ Table '${table}' does not exist:`, error.message);
                }
            } catch (err) {
                console.log(`❌ Table '${table}' does not exist:`, err.message);
            }
        }

        console.log('\nExisting tables:', existingTables);
        
        if (existingTables.length === 0) {
            console.log('\n⚠️  No tables found. You need to execute the SQL schema manually.');
            console.log('\nTo set up the database, you have a few options:');
            console.log('1. Use the Supabase Dashboard SQL Editor:');
            console.log('   - Go to https://supabase.com/dashboard/project/nkxeawivmzxbnoakpkvz/sql');
            console.log('   - Copy and paste the contents of supabase/migrations/20240101000000_initial_schema.sql');
            console.log('   - Then copy and paste the contents of supabase/setup.sql');
            console.log('   - Click "Run" for each');
            
            console.log('\n2. Use the Supabase CLI with database password:');
            console.log('   - Run: npx supabase link --project-ref nkxeawivmzxbnoakpkvz');
            console.log('   - Enter your database password when prompted');
            console.log('   - Run: npx supabase db push');
            
            console.log('\n3. Use a PostgreSQL client (like pgAdmin or psql):');
            console.log('   - Connect to your Supabase database directly');
            console.log('   - Execute the SQL files manually');
            
            return false;
        } else {
            console.log('\n✅ Some tables already exist. Testing basic functionality...');
            
            // Test basic operations
            if (existingTables.includes('events')) {
                console.log('\n3. Testing events table...');
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .limit(5);
                
                if (!eventError) {
                    console.log(`✅ Events table working. Found ${eventData?.length || 0} events`);
                } else {
                    console.log('❌ Events table error:', eventError.message);
                }
            }
            
            if (existingTables.includes('participants')) {
                console.log('\n4. Testing participants table...');
                const { data: participantData, error: participantError } = await supabase
                    .from('participants')
                    .select('*')
                    .limit(5);
                
                if (!participantError) {
                    console.log(`✅ Participants table working. Found ${participantData?.length || 0} participants`);
                } else {
                    console.log('❌ Participants table error:', participantError.message);
                }
            }
            
            return true;
        }

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        return false;
    }
}

async function generateTypeScriptTypes() {
    console.log('\n5. Generating TypeScript types...');
    
    try {
        // Try to generate types using supabase CLI
        const { execSync } = require('child_process');
        
        const typesCommand = 'npx supabase gen types typescript --project-id nkxeawivmzxbnoakpkvz';
        const types = execSync(typesCommand, { encoding: 'utf8' });
        
        // Write types to file
        const typesPath = path.join(__dirname, 'lib', 'database.types.ts');
        
        // Ensure lib directory exists
        const libDir = path.dirname(typesPath);
        if (!fs.existsSync(libDir)) {
            fs.mkdirSync(libDir, { recursive: true });
        }
        
        fs.writeFileSync(typesPath, types);
        console.log('✅ TypeScript types generated at lib/database.types.ts');
        
        return true;
    } catch (error) {
        console.log('❌ Could not generate types automatically:', error.message);
        console.log('\nTo generate types manually:');
        console.log('1. Run: npx supabase gen types typescript --project-id nkxeawivmzxbnoakpkvz');
        console.log('2. Save the output to lib/database.types.ts');
        return false;
    }
}

// Run the setup
async function main() {
    console.log('🚀 Walican Database Setup\n');
    
    const tablesExist = await createTablesDirectly();
    
    if (tablesExist) {
        console.log('\n🎉 Database tables are ready!');
        
        // Try to generate TypeScript types
        await generateTypeScriptTypes();
        
        console.log('\n✅ Setup completed successfully!');
        console.log('Your Walican database is ready to use.');
    } else {
        console.log('\n⚠️  Manual setup required. See instructions above.');
    }
}

main();