#  CineByte — Frontend

> Red social para cinéfilos y aficionados a las series. Descubre, valora y comparte tu pasión por el cine y la televisión en un entorno gamificado y social.

** [cinebyte.es](https://cinebyte.es)**

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Librería principal de UI con componentes funcionales y hooks |
| Vite | 7 | Bundler y servidor de desarrollo con HMR instantáneo |
| React Router | v7 | Rutas SPA con `ProtectedRoute` y `AdminRoute` |
| TanStack Query | v5 | Caché de estado asíncrono, `useQueries` para batch-fetch |
| Supabase JS SDK | v2 | Autenticación, consultas y RLS |
| Axios | v1 | Cliente HTTP con interceptor de token automático |
| Tailwind CSS | v4 | Estilos (complementado con estilos inline) |
| PrimeReact | v10 | Componentes UI adicionales e iconos |

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend.railway.app
```

---

## Instalación y desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## Estructura del proyecto

```
src/
├── components/
│   ├── Navbar.jsx            # Navegación con búsqueda debounced en tiempo real
│   ├── Moviecard.jsx         # Tarjeta de película/serie reutilizable
│   ├── ReviewModal.jsx       # Modal para escribir reseñas con moderación IA previa
│   ├── SessionTracker.jsx    # Componente invisible para analítica de sesiones
│   └── AdminRoute.jsx        # Ruta protegida que verifica rol 'admin'
├── pages/
│   ├── Home.jsx              # Hero dinámico, tendencias, populares y noticias
│   ├── Movie.jsx             # Detalle de película/serie (media_type dinámico)
│   ├── AllSeasons.jsx        # Listado de temporadas de una serie
│   ├── SeasonDetails.jsx     # Detalle de temporada con valoraciones por episodio
│   ├── Search.jsx            # Búsqueda clásica + búsqueda IA por lenguaje natural
│   ├── Profile.jsx           # Perfil con XP, trofeos, stats, follows y reseñas
│   ├── EditProfile.jsx       # Edición de bio, avatar y película de fondo
│   ├── Actor.jsx             # Filmografía combinada de actores y directores
│   ├── AdminDashboard.jsx    # Panel de administración con analítica y gestión
│   ├── Login.jsx             # Formulario de inicio de sesión
│   └── Register.jsx          # Registro con confirmación de email
├── hooks/
│   └── useMovieTitles.js     # Batch-fetch de títulos/posters con useQueries
├── services/
│   ├── api.js                # Cliente Axios con interceptor de token Supabase
│   └── tmdb.js               # Wrapper de todos los endpoints del backend
├── context/
│   └── AuthContext.jsx       # Estado global de autenticación (signUp/In/Out)
└── lib/
    └── supabase.js           # Inicialización del cliente Supabase
```

---

## Rutas de la aplicación

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | Login.jsx | Público |
| `/register` | Register.jsx | Público |
| `/` | Home.jsx | Autenticado |
| `/movie/:id` | Movie.jsx | Autenticado |
| `/profile/:username` | Profile.jsx | Autenticado |
| `/profile/:username/edit` | EditProfile.jsx | Autenticado (propio) |
| `/search` | Search.jsx | Autenticado |
| `/admin` | AdminDashboard.jsx | Admin |

---

## Funcionalidades principales

###  Películas y series
- Página de inicio con tendencias y populares para películas y series
- Detalle completo con reparto, reseñas, contenido similar y proveedores de streaming
- Soporte completo para temporadas y episodios con valoración individual (1–10)

###  Búsqueda
- Búsqueda clásica con scroll infinito (IntersectionObserver nativo)
- Búsqueda por lenguaje natural con IA: *"películas de terror japonés de los 90 con alta puntuación"*
- Dropdown en navbar con resultados en tiempo real (debounced)

###  Reseñas
- Rating del 1 al 10 con texto opcional
- Moderación automática previa mediante Google Gemma 3
- Likes y dislikes en reseñas de otros usuarios
- Eliminación de reseñas propias

###  Perfil social
- Barra de XP, nivel y racha diaria
- Trofeos desbloqueables
- Pestañas de reseñas, watchlist y favoritas
- Sistema de seguimiento (follows/seguidores/siguiendo)
- Edición de bio, avatar y película de fondo del perfil

###  Administración
- Panel `/admin` protegido por rol
- Estadísticas con filtros temporales (24h, 7d, 1m, 1a, total)
- Gestión y eliminación de reseñas con notificación automática al usuario
- Timeline de actividad reciente

###  Noticias
- Noticias de cine en español integradas en la página de inicio (GNews API)

---

## Patrones técnicos destacados

### Interceptor de Axios — token automático
```js
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
```

### Hook useMovieTitles — batch fetching sin N+1
```js
const results = useQueries({
  queries: movieIds.map(id => ({
    queryKey: ['movie-title', id],
    queryFn: () => tmdbService.getMovieDetails(id),
    staleTime: Infinity,
  }))
})
```

### Nota sobre Tailwind CSS
Las clases de utilidad de Tailwind v4 no compilan correctamente en esta configuración de Vite. Se usan **estilos inline** en todos los componentes como solución estable (`style={{ maxWidth: '1280px', margin: '0 auto' }}`).

---

## Despliegue (Vercel)

El proyecto está configurado para Vercel con SPA routing mediante `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Cada push a `main` genera un despliegue automático. Las variables de entorno se configuran en el panel de Vercel.
