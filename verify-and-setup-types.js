const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabase() {
    console.log('🔍 Verifying Walican database setup...\n');

    const tables = ['events', 'participants', 'expenses', 'expense_splits', 'settlements'];
    const results = [];

    for (const table of tables) {
        try {
            console.log(`Checking table: ${table}`);
            const { data, error } = await supabase.from(table).select('*').limit(1);
            
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                results.push({ table, status: 'missing', error: error.message });
            } else {
                console.log(`✅ ${table}: OK`);
                results.push({ table, status: 'exists', data });
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
            results.push({ table, status: 'error', error: err.message });
        }
    }

    const successfulTables = results.filter(r => r.status === 'exists');
    console.log(`\n📊 Status: ${successfulTables.length}/${tables.length} tables found`);

    return successfulTables.length === tables.length;
}

async function generateTypes() {
    console.log('\n🏗️ Generating TypeScript types...');
    
    try {
        // Try to generate types using supabase CLI
        const command = 'npx supabase gen types typescript --project-id nkxeawivmzxbnoakpkvz';
        console.log(`Running: ${command}`);
        
        const types = execSync(command, { 
            encoding: 'utf8',
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        // Write types to file
        const typesPath = path.join(__dirname, 'lib', 'database.types.ts');
        fs.writeFileSync(typesPath, types);
        
        console.log('✅ TypeScript types generated successfully!');
        console.log(`📄 Types saved to: ${typesPath}`);
        
        return true;
    } catch (error) {
        console.log('❌ Failed to generate types automatically:', error.message);
        console.log('\n📝 To generate types manually:');
        console.log('1. Ensure all database tables are created');
        console.log('2. Run: npx supabase gen types typescript --project-id nkxeawivmzxbnoakpkvz');
        console.log('3. Save output to lib/database.types.ts');
        
        return false;
    }
}

async function testBasicOperations() {
    console.log('\n🧪 Testing basic database operations...');
    
    try {
        // Test creating a sample event
        const testEvent = {
            unique_url: `t${Date.now()}`.substring(0, 10), // Limit to 10 characters
            name: 'Database Test Event',
            description: 'Testing database connectivity',
            currency: 'JPY'
        };
        
        console.log('Creating test event...');
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .insert([testEvent])
            .select()
            .single();

        if (eventError) {
            console.log('❌ Failed to create test event:', eventError.message);
            return false;
        }

        console.log('✅ Test event created:', eventData.id);

        // Test creating a participant
        const testParticipant = {
            event_id: eventData.id,
            name: 'Test Participant',
            email: 'test@example.com'
        };

        console.log('Creating test participant...');
        const { data: participantData, error: participantError } = await supabase
            .from('participants')
            .insert([testParticipant])
            .select()
            .single();

        if (participantError) {
            console.log('❌ Failed to create test participant:', participantError.message);
            return false;
        }

        console.log('✅ Test participant created:', participantData.id);

        // Clean up test data
        console.log('Cleaning up test data...');
        await supabase.from('events').delete().eq('id', eventData.id);
        console.log('✅ Test data cleaned up');

        return true;
    } catch (error) {
        console.log('❌ Database operation test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Walican Database Verification & Setup\n');
    
    // Step 1: Verify all tables exist
    const tablesReady = await verifyDatabase();
    
    if (!tablesReady) {
        console.log('\n❌ Database setup incomplete!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to: https://supabase.com/dashboard/project/nkxeawivmzxbnoakpkvz/sql');
        console.log('2. Execute the SQL from complete-setup.sql');
        console.log('3. Run this script again to verify');
        return;
    }

    console.log('\n✅ All database tables are ready!');

    // Step 2: Test basic operations
    const operationsWork = await testBasicOperations();
    
    if (!operationsWork) {
        console.log('\n⚠️ Database operations failed. Check permissions and RLS policies.');
        return;
    }

    console.log('\n✅ Database operations working correctly!');

    // Step 3: Generate TypeScript types
    const typesGenerated = await generateTypes();

    // Final summary
    console.log('\n🎉 Setup Summary:');
    console.log(`✅ Database tables: Ready`);
    console.log(`✅ Basic operations: Working`);
    console.log(`${typesGenerated ? '✅' : '❌'} TypeScript types: ${typesGenerated ? 'Generated' : 'Manual setup required'}`);
    
    if (typesGenerated) {
        console.log('\n🚀 Your Walican database is fully configured and ready to use!');
        console.log('You can now start the development server with: npm run dev');
    } else {
        console.log('\n⚠️ Database is ready, but TypeScript types need manual generation.');
    }
}

main().catch(console.error);