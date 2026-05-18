import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')

  console.log(data)
  console.log(error)

  return (
    <main style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Dashboard Working</h1>
      <section>
        <h2>Supabase Data</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </section>
      <section>
        <h2>Supabase Error</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </section>
    </main>
  )
}