import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read env variables from client/.env
const envPath = path.resolve('client/.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name: string): string => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

console.log('URL:', supabaseUrl);
console.log('Service Role Key exists:', !!serviceRoleKey);

// Use service role client (admin privileges)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTest() {
  console.log('Testing connection as admin...');
  
  // 1. Get all users in auth.users
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error listing users:', usersError);
    return;
  }
  
  console.log(`Found ${users?.length} users in auth.users:`);
  for (const user of users || []) {
    console.log(`- ID: ${user.id}, Email: ${user.email}, CreatedAt: ${user.created_at}, Metadata:`, user.user_metadata);
  }

  // 2. Get all profiles in public.profiles
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*');
    
  console.log(`Found ${profiles?.length} profiles in public.profiles:`, { profiles, profileError });

  // 3. Check for users that don't have a profile and auto-create them
  if (users && profiles) {
    const profileIds = new Set(profiles.map(p => p.id));
    const missingProfiles = users.filter(u => !profileIds.has(u.id));
    
    console.log(`Found ${missingProfiles.length} users with missing profiles.`);
    for (const user of missingProfiles) {
      console.log(`Creating missing profile for user ${user.email} (${user.id})...`);
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || ''
        })
        .select();
        
      console.log('Profile creation result:', { data, error });
    }
  }

  // 4. Check if the trigger is working by attempting to signup a user via the admin API
  console.log('Testing trigger with a new signup...');
  const testEmail = `test.user.${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  
  const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Trigger User'
    }
  });
  
  if (signUpError) {
    console.error('Admin signup failed:', signUpError);
  } else {
    const newUser = signUpData.user;
    console.log('New user created by admin. ID:', newUser?.id);
    
    // Wait for the trigger to execute
    console.log('Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if the profile was created
    const { data: profile, error: getProfileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.id)
      .single();
      
    console.log('Trigger verification - profile was created:', { profile, getProfileError });
  }
}

runTest();
