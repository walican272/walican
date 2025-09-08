const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'nkxeawivmzxbnoakpkvz';
const ACCESS_TOKEN = 'sbp_d5aac5a654621fc679b6df2e174dd859637a4f13';

async function executeSQL() {
    console.log('🚀 Creating groups tables...\n');

    const sql = fs.readFileSync('./create-groups-table.sql', 'utf8');

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
                
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('\n✅ Groups tables created successfully!');
                    resolve(true);
                } else {
                    console.log('\n❌ Failed to create tables');
                    console.log('Response:', data);
                    resolve(false);
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

executeSQL().catch(console.error);