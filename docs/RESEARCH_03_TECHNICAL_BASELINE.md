# Research 03 — base técnica (piloto)

Esta nota separa decisiones ya confirmadas del producto de recomendaciones
técnicas y preguntas que siguen abiertas. No agrega funcionalidades al alcance.

## Decisiones confirmadas

- La tarjeta NFC abre un perfil público web; el receptor no requiere una app.
- El chip conserva una URL corta de TakeMyCard (`https://<dominio>/t/<codigo>`),
  no el slug del perfil.
- El destino puede cambiar en servidor sin regrabar el chip.
- Las métricas no identifican visitantes: no IP, user-agent, cookies ni
  fingerprinting.
- Supabase + RLS y Vercel continúan siendo la base del piloto.

## Recomendación técnica para el tag NFC

Grabar **un único NDEF URI record HTTPS** con una URL corta estable. Es el
formato de máxima interoperabilidad para el caso de uso: Android analiza los
tags NDEF y puede despachar URLs; iPhone procesa un URI NDEF en lectura de tags
en segundo plano y abre el enlace en Safari si no hay una app asociada.

Ejemplo de contenido del chip:

```
https://<dominio>/t/k7m4q9z2
```

El código debe ser opaco, generado con aleatoriedad criptográfica y único. No
debe contener el nombre, slug, email, UUID interno ni el UID físico del tag.
Un identificador corto no es autenticación: cualquier URL impresa o fotografiada
puede abrir el perfil, por lo que sólo debe resolver contenido deliberadamente
público.

Al programar una tarjeta hay que verificar en teléfonos reales Android e iPhone
antes de entregarla y registrar la entrega. Bloquear el tag para impedir una
reescritura accidental es una decisión operativa a validar con el proveedor y
el modelo de chip; bloquearlo no evita que alguien copie la URL.

### Compatibilidad a tener en cuenta

- Android recomienda NDEF para la mayor compatibilidad y, desde Android 16,
  trata los enlaces web como acciones de abrir enlace; no se debe depender de
  una app propia para el flujo base.
- iPhone puede leer un URI NDEF en segundo plano, pero la lectura depende del
  estado del dispositivo y del sistema. La experiencia tiene que probarse con
  los modelos reales del piloto, no suponerse.
- La lectura del tag puede ocurrir sin red; cargar el perfil web requiere red.
  La comunicación comercial no debe prometer lo contrario.

## Redirecciones y disponibilidad

`/t/<codigo>` debe resolver en cada lectura contra la asignación actual y
redirigir al slug activo. No se cachea como redirect permanente: si cambia el
slug o se pausa el perfil, el próximo tap debe reflejarlo.

La página pública sí puede aprovechar el caché/revalidación de Next.js/Vercel.
La combinación buscada es:

```
NFC -> URL corta estable -> resolución dinámica -> perfil público cacheable
```

Esto protege las tarjetas frente a cambios de slug y permite servir perfiles
visitados recientemente durante una interrupción temporal de la base de datos.
El dominio es una dependencia crítica: debe configurarse antes de imprimir y
mantenerse bajo control de la identidad del proyecto.

## Seguridad y datos

La arquitectura actual va en la dirección correcta: cliente público con clave
anon, RLS para cada tabla expuesta y operaciones excepcionalmente privilegiadas
en funciones acotadas. Antes de desplegar cambios de base se debe revisar cada
función `SECURITY DEFINER`: permisos mínimos, `search_path` fijo, objetos con
esquema calificado y pruebas de autorización positivas y negativas.

Para eventos se conserva únicamente lo necesario para vistas/clics agregados:
perfil, tipo de evento, link opcional, fecha y, si aporta valor, el host del
referer normalizado. Quedan fuera IP, user-agent, URLs completas del referer,
cookies, device IDs y fingerprinting.

## Decisiones todavía pendientes

- Tipo de tag, capacidad, proveedor, método de grabación y política de bloqueo.
- Flujo de provisión: quién asigna el código, graba, prueba y registra cada
  tarjeta; además de reposiciones, pérdidas y reasignaciones.
- Dominio definitivo y estrategia de continuidad/renovación.
- Política de retención de eventos agregados y rate limiting del endpoint de
  analítica.
- Qué significa `agenda`: hoy puede seguir siendo un link de contacto; no se
  asume una integración ni un sistema de turnos.
- QR, Wallet, CRM, lead capture e IA siguen fuera del alcance confirmado.

## Checklist antes de entregar el piloto

1. Crear un perfil de prueba activo y su código corto.
2. Escribir y releer el URI NDEF en cada tarjeta.
3. Probar el tap en al menos un iPhone y un Android del equipo.
4. Confirmar redirección, perfil, links, vCard y el aviso de perfil pausado.
5. Probar que un cliente sólo edita su perfil y que un usuario no autorizado no
   puede leer datos privados ni métricas.
6. Verificar que los eventos no contienen identificadores del visitante.

## Fuentes primarias consultadas

- [Android: NFC basics](https://developer.android.com/develop/connectivity/nfc/nfc)
- [Apple: Background Tag Reading](https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: Database Functions](https://supabase.com/docs/guides/database/functions)
- [Vercel: Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)
