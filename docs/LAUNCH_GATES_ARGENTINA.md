# Puertas de lanzamiento comercial en Argentina

Este documento traduce la investigación de operación del proyecto en controles
concretos antes de pasar del piloto a cobrar clientes. No reemplaza el criterio
de un contador ni de un abogado: deja explícito qué decisiones no deben quedar
ocultas dentro del código o de una pantalla.

## Estado actual

El repositorio está en modo piloto (`MODO_PILOTO`). Las páginas legales avisan
ese estado y no deben anunciar una venta efectiva mientras falten los datos del
prestador y las decisiones de esta lista.

El software ya aplica estas decisiones de producto:

- el tag NFC sólo contiene `https://<dominio>/t/<codigo_corto>`;
- el código es estable, opaco y de buena entropía; cambiar el slug no invalida
  una tarjeta impresa;
- una baja o impago pausa el perfil sin borrar su contenido de inmediato;
- las métricas no almacenan IP, user-agent, cookies, fingerprinting ni la URL
  completa de referencia;
- cada plan incluye dos tarjetas y las reposiciones quedan registradas como
  operación interna.

## Antes de aceptar el primer pago

| Puerta | Evidencia para cerrarla | Responsable sugerido |
| --- | --- | --- |
| Identidad comercial | Titular, CUIT y domicilio legal cargados en `LEGAL`; `MODO_PILOTO=false`; revisión visual de `/terminos` y `/privacidad`. | Titular + contador/abogado |
| Facturación | Régimen fiscal definido y circuito para emitir comprobantes por alta, abono mensual, renovación y reposición. | Contador |
| Precio y cobro | Precio final y conversión USD/ARS definidos antes de cada contratación; medio de pago y autorización de recurrencia acordados. | Titular + contador |
| Impago y baja | Plazos de aviso, gracia, suspensión, reactivación y baja documentados; el mismo canal de alta permite solicitar la baja. | Titular + asesor legal |
| Garantías y reposiciones | Precio de reposición, cobertura por defecto de fabricación, error de impresión y pérdida/deterioro definidos y facturables. | Titular + asesor legal |
| Datos personales | Textos legales revisados con la identidad real del responsable y proveedores; proceso para acceso, rectificación y supresión operativo. | Asesor legal |
| Dominio y NFC | Dominio controlado por el proyecto, `NEXT_PUBLIC_SITE_URL` configurada, callback de autenticación probado y lectura real en iPhone/Android antes de imprimir. | Titular + operación |
| Continuidad | Backups, acceso a cuentas de hosting/base, renovaciones de dominio y contacto ante incidentes documentados. | Titular + operación |

## Reglas para futuras implementaciones

1. No agregar cobros, descuentos, renovaciones automáticas ni facturación hasta
   que las puertas de precio/cobro y facturación estén cerradas.
2. No transformar información de visitas en perfiles de personas: la analítica
   sigue siendo agregada y privada por diseño.
3. No asociar el UID del tag NFC, una IP o un identificador de dispositivo con
   un visitante.
4. Una reposición conserva el perfil y el código de la tarjeta original salvo
   que se apruebe y documente expresamente un flujo de reasignación.
5. Cambios en términos, privacidad, garantía o impago requieren revisión humana
   antes de activarse en producción.

## Fuentes oficiales para la revisión profesional

- [Ley 24.240 de Defensa del Consumidor](https://www.argentina.gob.ar/normativa/nacional/638/actualizacion): información clara, contratación y derechos de consumo.
- [Ley 25.326 de Protección de los Datos Personales](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion): tratamiento, derechos y seguridad de datos personales.
- [Factura electrónica — ARCA](https://www.arca.gob.ar/fe/emision-autorizacion/solicitud-autorizacion.asp): emisión y autorización de comprobantes electrónicos.

Las referencias son puntos de partida para profesionales. La normativa y las
circunstancias fiscales cambian; no son una autorización automática para vender
ni para afirmar cumplimiento legal.
