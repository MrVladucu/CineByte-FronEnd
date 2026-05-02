import axios from 'axios'
import { supabase } from '../lib/supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

//Esto para anadir el token de Supabase en cada petición automáticamente
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export const getMovieNews = () => api.get('/api/news')

export default api