-- Migration: Create Payments System
-- Description: Sistema de controlo de pagamentos (pipas) e multas
-- Date: 2025-11-04

-- =====================================================
-- Table: payments
-- Description: Registo de pagamentos base (10 pipas por jantar)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dinner_id UUID NOT NULL REFERENCES dinners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_amount INTEGER NOT NULL DEFAULT 10, -- 10 pipas fixas
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Uma pessoa só pode ter 1 pagamento base por jantar
  UNIQUE(dinner_id, user_id)
);

-- =====================================================
-- Table: fines
-- Description: Multas aplicadas a pagamentos
-- =====================================================
CREATE TABLE IF NOT EXISTS fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0), -- Valor da multa em pipas
  reason TEXT NOT NULL, -- Motivo da multa
  created_by UUID NOT NULL REFERENCES users(id), -- Admin que criou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_dinner_id ON payments(dinner_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_fines_payment_id ON fines(payment_id);
CREATE INDEX IF NOT EXISTS idx_fines_created_by ON fines(created_by);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Payments: Todos podem ler
CREATE POLICY "Anyone can view payments"
  ON payments FOR SELECT
  USING (true);

-- Payments: Apenas admins podem criar/atualizar
CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Fines: Todos podem ler
CREATE POLICY "Anyone can view fines"
  ON fines FOR SELECT
  USING (true);

-- Fines: Apenas admins podem criar
CREATE POLICY "Admins can insert fines"
  ON fines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- Triggers para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at
  BEFORE UPDATE ON fines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments para documentação
-- =====================================================
COMMENT ON TABLE payments IS 'Pagamentos base de 10 pipas por jantar';
COMMENT ON TABLE fines IS 'Multas adicionais aplicadas aos pagamentos';
COMMENT ON COLUMN payments.base_amount IS 'Valor fixo de 10 pipas';
COMMENT ON COLUMN payments.status IS 'pending ou paid';
COMMENT ON COLUMN fines.reason IS 'Motivo da multa (ex: atraso, esquecimento)';
