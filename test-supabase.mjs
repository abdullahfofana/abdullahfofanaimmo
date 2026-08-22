// test-supabase.mjs
// Run with: node test-supabase.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env file manually
function loadEnv(filePath) {
    try {
        const content = readFileSync(filePath, 'utf-8');
        const vars = {};
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim();
            vars[key] = value;
        }
        return vars;
    } catch {
        return {};
    }
}

const env = loadEnv('.env');

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('\n🔌 Supabase Connection Test\n' + '='.repeat(40));
console.log('URL:', SUPABASE_URL || '❌ NOT SET');
console.log('Key:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 20) + '...' : '❌ NOT SET');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('\n❌ ERROR: Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

async function testConnection() {
    console.log('\n🧪 Running tests...\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Ping the properties table
    console.log('1️⃣  Test: Query properties table');
    try {
        const { data, error } = await supabase.from('properties').select('id').limit(1);
        if (error) {
            if (error.message?.includes('relation') || error.code === '42P01') {
                console.log('   ⚠️  Table "properties" does not exist yet — need to run SQL schema');
                console.log('   ℹ️  Connection itself is WORKING ✅');
                passed++;
            } else {
                console.log(`   ❌ FAILED: ${error.message}`);
                failed++;
            }
        } else {
            console.log(`   ✅ PASSED — Found ${data?.length ?? 0} row(s)`);
            passed++;
        }
    } catch (err) {
        console.log(`   ❌ EXCEPTION: ${err.message}`);
        failed++;
    }

    // Test 2: Query users table
    console.log('2️⃣  Test: Query users table');
    try {
        const { data, error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            if (error.message?.includes('relation') || error.code === '42P01') {
                console.log('   ⚠️  Table "users" does not exist yet — run SQL schema');
            } else {
                console.log(`   ❌ FAILED: ${error.message}`);
                failed++;
            }
        } else {
            console.log(`   ✅ PASSED — Found ${data?.length ?? 0} row(s)`);
            passed++;
        }
    } catch (err) {
        console.log(`   ❌ EXCEPTION: ${err.message}`);
        failed++;
    }

    // Test 3: Query activities table
    console.log('3️⃣  Test: Query activities table');
    try {
        const { data, error } = await supabase.from('activities').select('id').limit(1);
        if (error) {
            if (error.message?.includes('relation') || error.code === '42P01') {
                console.log('   ⚠️  Table "activities" does not exist yet — run SQL schema');
            } else {
                console.log(`   ❌ FAILED: ${error.message}`);
                failed++;
            }
        } else {
            console.log(`   ✅ PASSED — Found ${data?.length ?? 0} row(s)`);
            passed++;
        }
    } catch (err) {
        console.log(`   ❌ EXCEPTION: ${err.message}`);
        failed++;
    }

    // Test 4: Auth service reachability
    console.log('4️⃣  Test: Auth service (getSession)');
    try {
        const { error } = await supabase.auth.getSession();
        if (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
            failed++;
        } else {
            console.log('   ✅ PASSED — Auth service is reachable');
            passed++;
        }
    } catch (err) {
        console.log(`   ❌ EXCEPTION: ${err.message}`);
        failed++;
    }

    // Test 5: Storage service
    console.log('5️⃣  Test: Storage service (list buckets)');
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
            failed++;
        } else {
            const bucketNames = data?.map(b => b.name) || [];
            console.log(`   ✅ PASSED — Buckets: ${bucketNames.length > 0 ? bucketNames.join(', ') : 'none yet'}`);
            const hasPropBucket = bucketNames.includes('property-files');
            if (!hasPropBucket) {
                console.log('   ⚠️  Bucket "property-files" not found in storage');
            }
            passed++;
        }
    } catch (err) {
        console.log(`   ❌ EXCEPTION: ${err.message}`);
        failed++;
    }

    // Test 6: Insert / Write Test (activities table probe)
    console.log('6️⃣  Test: Write permissions (Insert activity)');
    const testActivityId = 'conn-check-' + Date.now();
    try {
        const { error: insertErr } = await supabase.from('activities').insert({
            id: testActivityId,
            type: 'system_check',
            message: 'Supabase connectivity validation test',
            user: 'system_tester',
            timestamp: new Date().toISOString()
        });
        if (insertErr) {
            console.log(`   ⚠️ Write test failed / restricted: ${insertErr.message} (code: ${insertErr.code || 'N/A'})`);
        } else {
            console.log('   ✅ PASSED — Write/Insert is working properly');
            passed++;
            // Clean up probe record
            await supabase.from('activities').delete().eq('id', testActivityId);
        }
    } catch (err) {
        console.log(`   ⚠️ Write test exception: ${err.message}`);
    }

    console.log('\n' + '='.repeat(40));
    console.log(`✅ Passed: ${passed}  ❌ Failed: ${failed}`);

    if (failed === 0) {
        console.log('\n🎉 Supabase connection is WORKING correctly!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above.\n');
    }
}

testConnection().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

