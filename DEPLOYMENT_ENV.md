# Deployment Environment Variables

## Server (required in production)

- `DATABASE_URL`: PostgreSQL connection string.
- `SUPABASE_URL`: Supabase project URL (e.g. `https://<project>.supabase.co`).
- `SUPABASE_AUDIENCE`: JWT audience. Default is `authenticated`.
- `CORS_ALLOWED_ORIGINS`: Comma-separated frontend origins.
  - Example: `https://mind-weather-theta.vercel.app,https://app.example.com`

## Server (optional)

- `Gemini__ApiKey`: Gemini API key (uses ASP.NET double underscore mapping).

## Client build env

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_KAKAO_MAP_KEY`
- `VITE_KAKAO_REST_KEY`
- `VITE_API_URL`

## Notes

- Rotate any previously exposed keys before deploying.
- Keep `.env` and `appsettings.Development.json` local-only.
- Use your CI/CD secret manager for production values.
