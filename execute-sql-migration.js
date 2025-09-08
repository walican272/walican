const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'nkxeawivmzxbnoakpkvz';
const ACCESS_TOKEN = 'sbp_d5aac5a654621fc679b6df2e174dd859637a4f13';

async function executeSQL() {
    console.log('🚀 Executing SQL via Supabase Migration API...\n');

    const sql = fs.readFileSync('./complete-setup.sql', 'utf8');

    const postData = JSON.stringify({
        query: sql
    });

    const options = {
        hostname: 'api.supabase.com',
        port: 443,
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Response Status:', res.statusCode);
                console.log('Response:', data);

                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('\n✅ SQL executed successfully!');
                    resolve(true);
                } else {
                    console.log('\n❌ Failed to execute SQL');
                    // Try alternative approach
                    executeSQLViaRESTAPI();
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function executeSQLViaRESTAPI() {
    console.log('\n🔄 Trying REST API approach...\n');
    
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Create tables using direct REST API calls
    const tables = {
        events: {
            unique_url: 'test001',
            name: 'Test Event',
            description: 'Testing table creation',
            currency: 'JPY'
        }
    };

    console.log('🧪 Testing table creation by inserting data...\n');

    try {
        // Try to insert into events table
        const { data, error } = await supabase
            .from('events')
            .insert([tables.events])
            .select();

        if (error) {
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.log('❌ Tables do not exist yet.');
                console.log('\n📋 Manual Setup Required:');
                console.log('1. Go to: https://supabase.com/dashboard/project/nkxeawivmzxbnoakpkvz/sql');
                console.log('2. Copy the SQL from complete-setup.sql');
                console.log('3. Paste and execute in the SQL Editor');
                console.log('4. Click "Run" button');
                return false;
            }
            console.log('❌ Error:', error.message);
        } else {
            console.log('✅ Table exists! Test data inserted:', data);
            // Clean up test data
            if (data && data[0]) {
                await supabase.from('events').delete().eq('id', data[0].id);
                console.log('🧹 Test data cleaned up');
            }
            return true;
        }
    } catch (err) {
        console.log('❌ Error:', err.message);
    }

    return false;
}

async function main() {
    try {
        const success = await executeSQL();
        
        if (!success) {
            console.log('\n⚠️ Automated setup failed.');
            console.log('\n📋 Please follow these steps:');
            console.log('1. Open: https://supabase.com/dashboard/project/nkxeawivmzxbnoakpkvz/sql');
            console.log('2. Copy all content from: complete-setup.sql');
            console.log('3. Paste into the SQL Editor');
            console.log('4. Click the "Run" button');
            console.log('5. After execution, run: node verify-and-setup-types.js');
        }
    } catch (error) {
        console.error('Error:', error);
        executeSQLViaRESTAPI();
    }
}

main();