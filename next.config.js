/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // pdfkit membaca file datanya sendiri dari node_modules; jangan dibundel webpack.
    serverComponentsExternalPackages: ['pdfkit'],
    // Font dan logo untuk PDF laporan dibaca dari disk saat runtime. Helvetica dimuat pdfkit
    // secara dinamis sebagai font awal dokumen, jadi tidak terlacak otomatis.
    outputFileTracingIncludes: { '/api/admin/report': ['./lib/pdf-assets/**', './node_modules/pdfkit/js/standard-fonts/Helvetica.cjs', './node_modules/pdfkit/js/standard-fonts/chunks/**'] }
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
      ]
    }];
  }
};
