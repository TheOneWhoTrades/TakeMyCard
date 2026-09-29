# Operación de tarjetas NFC durante el piloto

Esta guía convierte la decisión de producto en un procedimiento repetible: la
tarjeta física abre un perfil público, pero no es una cuenta de usuario ni una
fuente de identidad. El chip sólo contiene una URL corta estable:

```text
https://<dominio>/t/<codigo_corto>
```

No se escribe el slug (`/<slug>`) en el chip. El slug puede cambiar; el código
corto no. Así, una corrección de nombre, de URL pública o de dominio no exige
recuperar las tarjetas ya entregadas.

## Qué está resuelto en el piloto

- Cada perfil recibe un `codigo_corto` aleatorio e inmutable.
- Las dos tarjetas incluidas de un perfil llevan la **misma** URL corta.
- El backoffice muestra exactamente la URL que se debe programar.
- La tabla `cards` registra fecha de entrega, si es reposición y una nota; sólo
  la ven administradores.
- Pausar un perfil conserva el código y muestra un aviso público, en vez de
  borrar el perfil y dejar una tarjeta física sin destino.

## Entrega: lista de control

1. Crear y completar el perfil en `/admin`; verificar nombre, datos de contacto
   y links desde un teléfono.
2. Usar el botón *Copiar URL para el chip* que aparece en *Qué grabar en el
   chip*. No escribir una URL a mano ni usar el slug.
3. Programar cada tarjeta con un único registro NDEF de tipo URI/HTTPS usando
   esa URL. No incluir datos de contacto, URLs de terceros ni información de
   login dentro del chip.
4. Probar las dos tarjetas en, como mínimo, un iPhone y un Android reales con
   conexión. Confirmar que `/t/<codigo>` llega al perfil correcto y que
   *Guardar contacto* descarga la vCard.
5. Registrar cada unidad entregada en *Tarjetas físicas*, con la fecha y una
   nota operativa suficiente para reconocer el lote o la entrega. Marcar
   `reposición` sólo si no forma parte de las dos incluidas.
6. Si el cliente usará autoedición, vincular su cuenta **después** de verificar
   la tarjeta; una cuenta sin vincular no obtiene acceso al perfil.

## Incidencias que no requieren regrabar

| Situación | Acción durante el piloto |
|---|---|
| Cambia el nombre, rubro, teléfono o links | Editar el perfil. |
| Cambia el slug | Cambiar el slug desde administración; el código corto sigue resolviendo. |
| Falta de pago o pausa acordada | Pausar el perfil; no borrar ni reutilizar el código. |
| Tarjeta extraviada o dañada | Registrar una reposición y programarla con la misma URL corta. |
| Cambio de dominio | Mantener el dominio anterior redirigiendo y actualizar el destino operativo antes de imprimir nuevas tarjetas. |

## Límites deliberados

La tabla `cards` es un registro de entrega, no un inventario criptográfico de
chips: hoy no guarda UID, número de serie, proveedor, lote ni estado de bloqueo.
Eso es suficiente para saber cuántas tarjetas se entregaron y cuáles son
reposiciones, pero **no** permite revocar selectivamente una tarjeta clonada,
perdida o reasignada.

Por lo tanto, durante el piloto:

- no se reasigna una tarjeta entregada a otro perfil;
- no se reutiliza un `codigo_corto` de un perfil eliminado o pausado;
- una reposición comparte el código del mismo perfil;
- un caso que requiera invalidar sólo una tarjeta se resuelve operativamente
  (pausar el perfil o emitir un perfil/código nuevo) hasta que exista un modelo
  de inventario por chip aprobado.

Antes de escalar, se debe decidir y documentar: tipo y capacidad del tag,
proceso de escritura y bloqueo, identificador por tarjeta, proveedor/lotes,
reemplazos, pérdidas, reasignación y política de conservación de esos datos.
