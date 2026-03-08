import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_PROJECT_URL
const API_Key = process.env.REACT_APP_API_Key
export const supabase = createClient(supabaseUrl, API_Key)

