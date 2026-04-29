const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Source map upload — set SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT in CI
  silent: !process.env.CI,
  telemetry: false,
  // Disable source map upload until auth token is configured
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Tree-shake Sentry debug code in production bundles
  webpack: { treeshake: { removeDebugLogging: true } },
});
