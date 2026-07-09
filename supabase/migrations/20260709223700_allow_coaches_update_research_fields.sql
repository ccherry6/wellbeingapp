
CREATE POLICY "coaches_can_update_research_fields" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.actual_role = 'coach' OR p.actual_role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.actual_role = 'coach' OR p.actual_role = 'admin')
    )
  );
