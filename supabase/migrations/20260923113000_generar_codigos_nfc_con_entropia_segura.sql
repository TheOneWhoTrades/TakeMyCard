-- Los códigos no autorizan nada, pero son públicos y quedan impresos en la
-- tarjeta. Usamos la fuente criptográfica de pgcrypto para que no sean
-- predecibles. Conservamos longitud y alfabeto para no afectar tarjetas ya
-- emitidas ni el material de provisión.
create or replace function public.generar_codigo_corto()
returns text
language plpgsql
volatile
as $$
declare
  alfabeto constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  codigo text := '';
  byte_aleatorio integer;
begin
  -- 31 no divide 256. Se descartan 248..255 para no sesgar los caracteres.
  while length(codigo) < 7 loop
    byte_aleatorio := get_byte(gen_random_bytes(1), 0);

    if byte_aleatorio < 248 then
      codigo := codigo || substr(alfabeto, (byte_aleatorio % 31) + 1, 1);
    end if;
  end loop;

  return codigo;
end;
$$;
