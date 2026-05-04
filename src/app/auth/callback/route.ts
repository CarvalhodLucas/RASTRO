import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/';
  const intent = searchParams.get('intent');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError && user) {
      // REGRA DE NEGÓCIO: Verificar se o usuário já tem um perfil cadastrado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Usuário novo detectado: redireciona para a Home para aceitar os termos
        // Não fazemos logout aqui, pois ele precisa estar logado para o frontend finalizar o perfil
        console.log(`[Auth] 🆕 Novo usuário ${user.email} detectado. Solicitando aceite de termos.`);
        return NextResponse.redirect(`${origin}/?require_terms=true`);
      }

      // Usuário autorizado
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    // Se houver erro na troca do código
    const errorMsg = exchangeError?.message || 'Erro ao validar sessão';
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMsg)}`);
  }

  // If no code is present, check if there's an error in the URL
  const error = searchParams.get('error_description') || searchParams.get('error') || 'Falha na autenticação';
  return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
}
