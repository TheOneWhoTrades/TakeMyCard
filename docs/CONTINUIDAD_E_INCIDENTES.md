# Continuidad e incidentes del piloto

Este procedimiento sirve para mantener disponible una tarjeta ya entregada y
para responder con orden si se compromete una cuenta, un dato o un proveedor.
No sustituye los controles de Supabase, Vercel ni del registrador del dominio:
indica qué tiene que hacer el equipo que opera TakeMyCard y qué evidencia debe
conservar.

Aplica desde el piloto. Antes del lanzamiento comercial hay que asignar nombres
de responsables y revisar el procedimiento con el asesor legal cuando la
incidencia involucre datos personales o una obligación de aviso.

## Lo que no se debe perder

1. El control del dominio y de su DNS: las tarjetas físicas usan URLs que no se
   pueden reimprimir ante un cambio menor.
2. El acceso administrativo a GitHub, Vercel, Supabase y al correo de contacto.
3. La base de perfiles, enlaces, contacto y el registro interno de tarjetas
   entregadas. No se guardan datos de visitantes identificables.
4. La correspondencia entre una tarjeta física y su código corto. Un código no
   se reutiliza ni se cambia por una pausa de pago.

## Preparación antes de cobrar

- Mantener al menos dos responsables con acceso administrativo a cada cuenta
  crítica. El acceso se comparte mediante el mecanismo seguro de cada
  proveedor, nunca enviando contraseñas por chat ni guardándolas en el
  repositorio.
- Registrar en un lugar privado quién administra dominio, Vercel, Supabase,
  GitHub y el correo de privacidad, junto con fecha de renovación y contacto de
  recuperación. Ese inventario no se versiona en GitHub.
- Configurar y revisar los respaldos ofrecidos por el plan de Supabase. Anotar
  fecha, responsable, alcance y resultado de una restauración de prueba antes
  de la primera venta y después de cada cambio de plan o migración importante.
- Antes de aplicar una migración, verificar que el último backup sea utilizable
  y que la CI esté en verde. Las migraciones se guardan en el repositorio, pero
  no reemplazan una copia de los datos reales.
- Mantener el dominio controlado por la marca y probar una tarjeta física con
  la URL corta `/t/<codigo>` después de cualquier cambio de dominio, DNS o
  redirecciones.

## Cómo registrar un incidente

Abrir un registro interno con fecha y hora, quién detectó el problema, servicios
afectados, perfiles potencialmente afectados y las acciones tomadas. No copiar
IP, contraseñas, tokens ni datos de visitantes al registro. Si se necesita
identificar a un cliente para contactarlo, usar únicamente su dato de contacto
operativo y limitar el acceso al equipo responsable.

Clasificarlo al menos como uno de estos casos:

| Caso | Primer objetivo | Acción inicial segura |
| --- | --- | --- |
| Cuenta administrativa comprometida | Evitar cambios adicionales | Quitar sesiones/accesos desde el proveedor y rotar credenciales afectadas. |
| Perfil con contenido incorrecto o riesgoso | Detener la publicación | Pausar el perfil; no borrar un perfil con tarjeta física registrada. |
| Sitio, DNS o proveedor caído | Recuperar la tarjeta pública | Revisar estado del proveedor y del dominio; no cambiar la URL NFC sin un plan de redirección probado. |
| Posible acceso no autorizado a datos | Contener y determinar alcance | Restringir accesos, conservar evidencia y evaluar aviso a afectados y autoridad con asesoramiento profesional. |
| Error de datos o migración | Preservar recuperabilidad | Detener escrituras riesgosas, verificar backup y restaurar sólo en un entorno o bajo un plan documentado. |

## Respuesta

1. **Contener.** Revocar o limitar el acceso que pueda seguir causando daño.
   Para contenido público, pausar el perfil es reversible y conserva la ruta NFC.
2. **Evaluar.** Determinar qué servicio, cuenta y datos estuvieron involucrados.
   Diferenciar un error visible de un acceso no autorizado y no atribuir una causa
   sin evidencia.
3. **Recuperar.** Aplicar el cambio mínimo que devuelva el servicio. Confirmar
   que la URL corta y el perfil correspondiente funcionen antes de comunicar que
   quedó resuelto.
4. **Comunicar.** Informar internamente el estado. Si existen datos personales
   afectados o hay riesgo real para una persona, evaluar el aviso a clientes y a
   la autoridad competente con asesoramiento legal; la página de privacidad ya
   promete informar incidentes que afecten datos.
5. **Aprender.** Documentar causa comprobada, impacto, decisión de recuperación
   y una acción preventiva. Si cambian controles técnicos, agregarlos al código,
   migraciones y pruebas, no sólo a este documento.

## Verificación periódica

Antes de una entrega de tarjetas y al menos en cada revisión operativa del
piloto, comprobar:

- que el responsable de respaldo puede acceder al procedimiento del proveedor;
- que los dos responsables críticos siguen teniendo acceso y métodos de
  recuperación vigentes;
- que el último backup y una restauración de prueba tienen fecha registrada;
- que una tarjeta física de prueba redirige a su perfil sin exponer datos de
  visitantes;
- que el último flujo de CI de GitHub está correcto antes de publicar cambios;
- que las solicitudes de privacidad llegan al correo indicado en el sitio.

Las decisiones comerciales, los plazos de retención y los avisos regulatorios
se revisan antes de salir del piloto. Ver también las
[puertas de lanzamiento](LAUNCH_GATES_ARGENTINA.md).
