-- Extensão necessária para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================
-- Tabela: clientes
-- ===============================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.trg_set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clientes_set_atualizado_em ON public.clientes;
CREATE TRIGGER clientes_set_atualizado_em
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE PROCEDURE public.trg_set_atualizado_em();

-- ===============================
-- Tabela: dominios
-- ===============================
CREATE TABLE IF NOT EXISTS public.dominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  dominio TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_dominios_cliente_id ON public.dominios (cliente_id);

-- ===============================
-- Tabela: lancamentos
-- ===============================
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao TEXT,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('E','S')), -- E=Entrada, S=Saída
  categoria TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_lanc_user_data ON public.lancamentos (user_id, data DESC);
CREATE INDEX IF NOT EXISTS ix_lanc_tipo ON public.lancamentos (tipo);
