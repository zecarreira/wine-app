-- Migration: Add Update/Delete Policies for Fines
-- Description: Permitir que admins possam editar e remover multas
-- Date: 2025-11-04

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update fines" ON fines;
DROP POLICY IF EXISTS "Admins can delete fines" ON fines;

-- Fines: Apenas admins podem atualizar
CREATE POLICY "Admins can update fines"
  ON fines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Fines: Apenas admins podem deletar
CREATE POLICY "Admins can delete fines"
  ON fines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
