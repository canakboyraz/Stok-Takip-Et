-- Fix for project permissions - first drop all existing policies
DO $$
BEGIN
    -- Drop existing policies (if they exist)
    DROP POLICY IF EXISTS "Kullanıcılar kendi izinlerini görebilir" ON project_permissions;
    DROP POLICY IF EXISTS "Kullanıcılar izin verebilir" ON project_permissions;
    DROP POLICY IF EXISTS "Proje sahipleri izin yönetebilir" ON project_permissions;
    
    -- Create the policies correctly
    -- Allow all users to view all permissions (needed for shared project list to work)
    CREATE POLICY "Kullanıcılar tüm izinleri görebilir" ON project_permissions
        FOR SELECT
        USING (true);
    
    -- Allow users to insert/update/delete only if they are project owners
    CREATE POLICY "Proje sahipleri izin yönetebilir" ON project_permissions
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM project_permissions
                WHERE project_id = project_permissions.project_id
                AND user_id = auth.uid()::text
                AND permission_level = 'owner'
            )
        );
END
$$;

-- Update view to ensure it's working correctly
CREATE OR REPLACE VIEW project_users_view AS
SELECT 
    pp.id as permission_id,
    p.id as project_id,
    p.name as project_name,
    pp.user_id,
    u.email as user_email,
    pp.permission_level,
    pp.granted_by,
    g.email as granted_by_email,
    pp.created_at
FROM 
    project_permissions pp
JOIN 
    projects p ON pp.project_id = p.id
LEFT JOIN 
    auth.users u ON pp.user_id = u.id::text
LEFT JOIN 
    auth.users g ON pp.granted_by = g.id::text;

-- Update grant permission function
CREATE OR REPLACE FUNCTION grant_project_permission(
    p_project_id INTEGER,
    p_user_email TEXT,
    p_permission_level TEXT
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
    v_granter_id TEXT;
    v_has_permission BOOLEAN;
BEGIN
    -- Get user ID of the person granting permission
    v_granter_id := auth.uid()::text;
    
    -- Check if granter has owner permission
    SELECT EXISTS (
        SELECT 1 FROM project_permissions
        WHERE project_id = p_project_id
        AND user_id = v_granter_id
        AND permission_level = 'owner'
    ) INTO v_has_permission;
    
    IF NOT v_has_permission THEN
        RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
    END IF;
    
    -- Find user ID by email
    SELECT id::text INTO v_user_id
    FROM auth.users
    WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Belirtilen e-posta adresi ile kullanıcı bulunamadı.';
    END IF;
    
    -- Add or update permission
    INSERT INTO project_permissions (project_id, user_id, permission_level, granted_by)
    VALUES (p_project_id, v_user_id, p_permission_level, v_granter_id)
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET 
        permission_level = p_permission_level,
        granted_by = v_granter_id;
        
    RETURN TRUE;
END;
$$;

-- Update revoke permission function
CREATE OR REPLACE FUNCTION revoke_project_permission(
    p_permission_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_granter_id TEXT;
    v_project_id INTEGER;
    v_has_permission BOOLEAN;
BEGIN
    -- Get user ID of the person revoking permission
    v_granter_id := auth.uid()::text;
    
    -- Find the project ID for this permission
    SELECT project_id INTO v_project_id
    FROM project_permissions
    WHERE id = p_permission_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Belirtilen izin ID bulunamadı.';
    END IF;
    
    -- Check if the user has owner permission for this project
    SELECT EXISTS (
        SELECT 1 FROM project_permissions
        WHERE project_id = v_project_id
        AND user_id = v_granter_id
        AND permission_level = 'owner'
    ) INTO v_has_permission;
    
    IF NOT v_has_permission THEN
        RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
    END IF;
    
    -- Remove the permission
    DELETE FROM project_permissions
    WHERE id = p_permission_id;
        
    RETURN TRUE;
END;
$$; 