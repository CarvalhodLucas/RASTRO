# Projeto RASTRO

## Visão Geral
O RASTRO é uma plataforma de inteligência de mercado e análise de ativos financeiros alimentada por IA. Ele serve para fornecer dados em tempo real, análises de sentimento do mercado, monitoramento de portfólio de investimentos e insights de inteligência artificial (integrado com Gemini/Grok) focado tanto na bolsa nacional (B3), acesso internacional (S&P 500) e Criptomoedas.

## Principais Recursos
* **Mapa de Calor (Heatmap) Multi-mercado**: Visualização avançada do desempenho de ativos em formato de grelha adaptativa (estilo "treemap"), filtrável por B3, S&P 500 e Criptomoedas.
* **Inteligência Artificial Integrada**: Motor que cria um "Pulso de IA" e fornece dados fundamentais e sentimentos do mercado baseados em leitura em tempo real e modelos LLMs.
* **Square / Community Insights**: Espaço estilo fórum para estrategistas e usuários contendo discussões de mercado, teses de Bull (otimista) e Bear (pessimista).
* **Busca Inteligente e Ticker Tape**: Barra de procura persistente para qualquer ticker e uma faixa na base do software reportando índices ao vivo (Ibovespa, Dólares, Bitcoin).
* **Perfil do Ativo Dedicado**: Páginas específicas para um Ticker que englobam todo seu relatório profundo de cenário e dados técnicos.

## Regras de Negócios e Arquitetura de Dados
* **Normalização Dinâmica de Tickers**: O sistema processa sufixos como `.SA` para o mercado local e `-USD` ou `USD` para cripto, garantindo consistência no cache do navegador (LocalStorage) e requisições para a API.
* **Cache Inteligente e Otimização**: Políticas estritas de cache, como salvar estados de variação dos "tickers" localmente no formato JSON com validade explícita de até 6 horas, atenuando Rate Limiting nos servidores fornecedores de cotação.
* **Bypass e Proxying de APIs**: Emprega rotas de API do próprio Next.js (`/api/quote`, etc) como servidores proxies locais para requisições a serviços como *Yahoo Finance* e *CoinGecko*, prevenindo bloqueios de CORS por navegadores.
* **Autenticação Extensível**: Integração base para sessão de usuário via `NextAuth`, ativando controles restritos e personalizados de percurso.

## Estrutura de Páginas e Rotas
O projeto utiliza o **App Router** do Next.js via pasta `src/app/`, com as seguintes seções de destaque:
* **`/` (Página Inicial)**: Painel central com Pesquisa, Mapa de Calor, Status dos Índices e Mockups de Insights Sociais.
* **`/asset/[ticker]`**: Visão técnica, gráficos, e diagnóstico detalhado por Inteligência Artificial para o ticker pesquisado.
* **`/mercado`**: Tela consolidando visões abrangentes e setorizadas das bolsas e moedas.
* **`/portfolio`**: Interface privada do usuário com lista de papéis acompanhados/guardados.
* **`/noticias`**: Feed de leitura analítica com resumo de mercado (GNews local/agregada).
* **`/square`**: O feed central da comunidade de trading (reunindo opiniões profissionais e discussões).
* **`/perfil`** e **`/admin`**: Gestão do usuário autenticado e painel de gerência/configuração.
* **`/login`**: Processos de Modal e acessos autenticados.

## Tecnologias Utilizadas
* **Core Framework**: React 19 com **Next.js 15 (App Router)** habilitado em Typescript.
* **Estilização e Layout**: Tailwind CSS v4, enriquecido com classes dinâmicas e utilitários (`clsx`, `tailwind-merge`). O ícone é renderizado misturando React-Lucide e Google Material Symbols.
* **Visualização de Dados**: `recharts` para desenho vetorial de históricos de preço/candle.
* **Backend Interno & APIs Web**: Módulos de extração de dados utilizando `yahoo-finance2`, roteamento nativo, Node.js para parsers (`pdf-parse`) e e-mails (`nodemailer`).
* **Ecossistema IA**: `@google/generative-ai` (API nativa do Google Gemini) e `groq-sdk` como provedora extra.
* **Gestão de Acesso**: `next-auth` (v4).

## Design System (Tema e Estética)
A aplicação busca um visual Premium, Dark-first e imersivo, focado em clareza extrema de números financeiros:
* **Tipografia**: O padrão visual global orienta a fonte `Inter` como fonte principal (`--font-display`).
* **Paletas de Cores (Themes)**:
  * O cenário principal usa `var(--color-background-dark): #050505` ou variações intensas (modo `amoled` em `#000000`, ou esquema de `market-blue` para #0a192f visando painéis estilo Bloomberg).
  * Cores Semânticas de Destaque: Amarelo Ouro (`#fbbf24`) como `--color-primary`, com toques enérgicos em Laranja e Vermelho como assentos complementares.
  * *Heatmap*: Gradientes sólidos como `#1B7A3D` para variação positiva e `#B91C1C` para queda dramática, criando alto contraste a leitura.
* **Micro-Animações**:
  * Animação Marquee (`animate-marquee`): Rolagem contínua para exibir dezenas de preços em loop sem barra de rolagem.
  * Progress Bar UI (`animate-progress-bar`) e Pulse effect (`animate-pulse`): Esforços em Skeleton Screens garantindo sensação de performance percebida enquanto a IA deduz resultados longos.
  * AI Scan (`animate-scan`): Animação decorativa simulando visual de radar de análise profunda atuando verticalmente nos ativos.
