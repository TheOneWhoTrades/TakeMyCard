/**
 * Normaliza un slug a lo que acepta el CHECK de la base: minúsculas, sin
 * acentos, guiones como separador. Se usa en el cliente (preview mientras se
 * tipea) y en el servidor (al guardar), por eso vive fuera de las acciones.
 */
export function normalizarSlug(entrada: string): string {
  return entrada
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}
