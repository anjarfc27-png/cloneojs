import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Cek atau buat user di auth.users
    const { data: existingUser, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single();

    let userId;
    if (userError || !existingUser) {
      // Buat user baru jika belum ada
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: 'temporarypassword123', // Password temporary, user bisa reset
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      userId = newUser.user.id;
      console.log('Created new user:', userId);
    } else {
      userId = existingUser.id;
      console.log('Found existing user:', userId);
    }

    // 2. Buat tenant default jika belum ada
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default-journal')
      .single();

    let tenantId;
    if (tenantError || !tenant) {
      const { data: newTenant, error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Default Journal',
          slug: 'default-journal',
          description: 'Default journal for super admin',
          is_active: true,
        })
        .select()
        .single();

      if (createTenantError) {
        console.error('Error creating tenant:', createTenantError);
        return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
      }

      tenantId = newTenant.id;
      console.log('Created new tenant:', tenantId);
    } else {
      tenantId = tenant.id;
      console.log('Found existing tenant:', tenantId);
    }

    // 3. Buat journal default untuk tenant
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    if (journalError || !journal) {
      const { error: createJournalError } = await supabase
        .from('journals')
        .insert({
          tenant_id: tenantId,
          title: 'Default Journal',
          description: 'Default journal for super admin management',
          abbreviation: 'DJ',
          language: 'id',
          is_active: true,
        });

      if (createJournalError) {
        console.error('Error creating journal:', createJournalError);
        // Lanjutkan tanpa journal, tidak kritis
      } else {
        console.log('Created new journal for tenant');
      }
    }

    // 4. Setup super admin role
    const { data: existingRole, error: roleError } = await supabase
      .from('tenant_users')
      .select('id, role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (roleError || !existingRole) {
      // Insert baru
      const { error: insertError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          role: 'super_admin',
          is_active: true,
        });

      if (insertError) {
        console.error('Error creating tenant user:', insertError);
        return NextResponse.json({ error: 'Failed to create super admin role' }, { status: 500 });
      }

      console.log('Created new super admin role');
    } else {
      // Update existing role
      const { error: updateError } = await supabase
        .from('tenant_users')
        .update({ 
          role: 'super_admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      if (updateError) {
        console.error('Error updating role:', updateError);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }

      console.log('Updated role to super admin');
    }

    // 5. Verifikasi hasil
    const { data: verification, error: verifyError } = await supabase
      .from('tenant_users')
      .select(`
        *,
        tenants!inner(name)
      `)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (verifyError) {
      console.error('Error verifying setup:', verifyError);
      return NextResponse.json({ error: 'Failed to verify setup' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin setup completed successfully',
      data: {
        user_id: userId,
        email: email,
        role: verification.role,
        tenant: verification.tenants.name,
        tenant_id: tenantId,
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Cek status user
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        exists: false,
        message: 'User not found'
      });
    }

    // Cek role di tenant_users
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select(`
        *,
        tenants!inner(name, slug)
      `)
      .eq('user_id', user.id);

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      roles: tenantUser || [],
      is_super_admin: tenantUser?.some(tu => tu.role === 'super_admin') || false
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}