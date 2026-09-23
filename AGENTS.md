# TakeMyCard — instrucciones para contribuciones

## Fuente de verdad y alcance

Antes de modificar producto, leer `README.md`, `docs/SUPABASE.md`,
`docs/DEPLOY.md` y `docs/RESEARCH_03_TECHNICAL_BASELINE.md`.

El piloto confirmado es una tarjeta NFC que abre un perfil web público con
contacto, links y vCard. Básico, Plus y Premium son los únicos tres planes; no
existe un plan gratuito.

No agregar QR, Apple/Google Wallet, CRM, lead capture, IA, integraciones,
equipos/SSO, white-label, dominios por cliente, multi-idioma ni freemium sin
una decisión explícita de producto. Que un competidor tenga una función no la
convierte en requisito de TakeMyCard.

## NFC y URLs

- El tag guarda una URL corta HTTPS: `/t/<codigo_corto>`, nunca el slug.
- `codigo_corto` es estable e inmutable; el slug puede cambiar.
- La resolución de `/t/<codigo>` es dinámica y no debe convertirse en una
  redirección permanente cacheada.
- Un código de tarjeta identifica un destino público; nunca es autenticación ni
  debe contener datos personales.

## Privacidad y seguridad

- No usar `service_role` en la app web.
- Toda lectura/escritura de datos pasa por Supabase RLS.
- No recolectar IP, user-agent, cookies, fingerprinting, IDs de dispositivo ni
  URL completa de referer para la analítica. Sólo se admiten vistas/clics
  agregados y, opcionalmente, el host normalizado del referer.
- Para una función `SECURITY DEFINER`, usar la menor superficie posible:
  `search_path` vacío, objetos con esquema explícito, GRANT mínimo y prueba de
  autorización. No crear funciones privilegiadas para resolver comodidad de la
  aplicación.

## Cambios de base de datos

- Las migraciones son aditivas, ordenadas y van en `supabase/migrations/`.
- No editar una migración ya publicada; crear una nueva.
- Toda modificación de RLS, RPC o triggers debe conservar o ampliar
  `supabase/tests/02_asserts.sql` cuando aplique.

## Verificación y publicación

Ejecutar, cuando el entorno lo permita:

```bash
npm run lint
npm run typecheck
npm run test:vcard
npm run test:db
npm run build
```

Cada cambio debe terminar en un commit y push a GitHub. No dejar cambios de
producto o base únicamente en una copia de trabajo.
