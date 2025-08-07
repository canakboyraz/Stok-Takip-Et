-- Etkinlik görünümü (view) oluşturuluyor
CREATE OR REPLACE VIEW activities_view AS
SELECT 
  a.id,
  a.user_id,
  a.project_id,
  a.action_type,
  a.action_description,
  a.entity_type,
  a.entity_id,
  a.created_at,
  a.user_email,
  a.ip_address,
  p.name as project_name
FROM 
  activities a
LEFT JOIN
  projects p ON a.project_id = p.id; 