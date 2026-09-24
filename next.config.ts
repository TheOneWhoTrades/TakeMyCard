import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : undefined

const nextConfig: NextConfig = {
  async headers() {
    // La tarjeta pública usa JavaScript propio de Next, imágenes del bucket de
    // Supabase y llamadas a Supabase desde el navegador. Todo lo demás queda
    // fuera por defecto: una URL cargada por un cliente no puede convertir la
    // página en un marco para recursos de terceros.
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      ["img-src 'self' data: blob:", supabaseOrigin].filter(Boolean).join(' '),
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      ["connect-src 'self'", supabaseOrigin].filter(Boolean).join(' '),
      'upgrade-insecure-requests',
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  images: {
    // Las fotos viven en el bucket público `fotos` del proyecto Supabase.
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
}

export default nextConfig
