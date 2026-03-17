# Base de Conhecimento Unificada para IA de Investimentos (Mercados Tradicionais e Cripto)

## 1. Objetivo, Escopo e Convenções

Esta base de conhecimento define, em formato operacional, como um agente de IA deve analisar ativos, mercados e portfólios em renda variável tradicional e cripto, do nível macro ao micro, integrando análise fundamentalista, técnica, macroeconômica, setorial, gestão de risco, derivativos e cripto/Web3.[^1][^2][^3]

### 1.1 Objetivo do sistema

- Apoiar decisões de investimento, alocação de ativos e gestão de risco de forma consistente, auditável e escalável.[^2]
- Produzir recomendações explicáveis, com trilha de raciocínio clara (inputs → transformações → outputs).[^2]
- Ser agnóstico de estilo (value, growth, quant, macro, cripto), integrando múltiplas escolas em um framework único.[^2]

### 1.2 Convenções gerais

- Sempre seguir a hierarquia de análise: Macro → Setor/País → Empresa/Ativo → Timing (técnico/on-chain) → Tamanho de posição e risco.[^1][^2]
- Trabalhar com cenários (base, otimista, pessimista) em vez de ponto único sempre que houver incerteza relevante.[^2]
- Manter separação conceitual entre:
  - "Qualidade/valor intrínseco" (fundamentalista, on-chain, macro/setor).
  - "Momento/timing" (técnico, fluxo, sentimento).
  - "Risco e correlação" (nível de portfólio).[^3][^1][^2]

## 2. Taxonomia de Tipos de Análise

### 2.1 Visão geral das abordagens

- **Análise fundamentalista (TradFi):** estima valor intrínseco via demonstrações financeiras, vantagens competitivas, crescimento e qualidade dos lucros.[^1][^2]
- **Valuation:** converte análise fundamentalista em estimativas numéricas de valor (DCF, múltiplos, abordagem de ativos e ajustes).[^1][^2]
- **Análise técnica e quantitativa:** usa preços, volumes e estatística para identificar tendências, reversões e regimes de mercado.[^3][^2]
- **Análise macroeconômica e setorial:** avalia ambiente econômico, política monetária/fiscal, ciclos, setores e regiões.[^1][^2]
- **Gestão de risco e finanças comportamentais:** mede, controla e aloca risco, incorporando vieses humanos e anomalias de mercado.[^2]
- **Derivativos e estratégias avançadas:** usa futuros, opções, swaps e estratégias sistemáticas para hedge, alavancagem e arbitragem.[^2]
- **Análise cripto e on-chain:** aplica fundamentos, técnica e métricas on-chain a ativos digitais, protocolos e Web3.[^4][^3]

### 2.2 Fluxo de decisão padrão para um ativo

1. **Filtragem macro/regional:** verificar se o país/região está em regime razoável (crescimento, inflação, juros, risco político).[^1][^2]
2. **Análise setorial:** qual fase do ciclo setorial, estrutura competitiva, regulação e sensibilidade macro.[^1][^2]
3. **Análise fundamental da empresa/projeto:** qualidade do negócio, métricas financeiras/on-chain, vantagens competitivas.[^3][^2][^1]
4. **Valuation:** estimar intervalo de valor intrínseco e margem de segurança.[^2][^1]
5. **Análise de momento (técnica/on-chain/sentimento):** escolher pontos de entrada/saída.[^4][^3][^2]
6. **Dimensionamento de posição e risco:** definir tamanho, stop, hedge e impacto no portfólio como um todo.[^5][^2]

## 3. Análise Fundamentalista e Valuation (Mercados Tradicionais)

### 3.1 Hierarquia: Macro → Setor → Empresa

- **Macro:** PIB, inflação, juros, emprego, câmbio, balança de pagamentos, política monetária e fiscal.[^2]
- **Setor:** estrutura competitiva (Porter), ciclo próprio, regulação, intensidade de capital, drivers tecnológicos e demográficos.[^2]
- **Empresa:** modelo de negócio, posição competitiva, gestão, estrutura de capital, histórico de execução e governança.[^2]

### 3.2 Padrões contábeis e normalização (IFRS vs US GAAP)

- IFRS é mais "baseado em princípios", US GAAP mais "baseado em regras", gerando diferenças relevantes em P&D, passivos contingentes e apresentação.[^1]
- IA deve identificar o padrão usado, aplicar ajustes-chave (por exemplo, capitalização de P&D em IFRS vs despesa em US GAAP) e normalizar métricas para comparabilidade entre empresas e regiões.[^1]

### 3.3 Demonstrações financeiras e indicadores principais

**Demonstração do Resultado (DRE):**
- Focar em composição e qualidade da receita (recorrente vs não recorrente, orgânico vs aquisições), evolução de margens bruta/EBITDA/líquida e sazonalidade.[^2]

**Balanço patrimonial:**
- Avaliar qualidade e liquidez de ativos (caixa, contas a receber, estoques, intangíveis) e estrutura de passivos (prazo, custo, covenants).[^2]

**Fluxo de caixa:**
- Priorizar fluxo de caixa operacional recorrente, consistência entre lucro e caixa, e suficiência para CAPEX, dívida e dividendos.[^2]

**Indicadores padrão:**
- Liquidez corrente/seca/imediata, giro de estoques, prazo de recebimento, dívida líquida/EBITDA, cobertura de juros, margens, ROE, ROA, retorno sobre capital investido.[^2]

### 3.4 Qualidade dos lucros e políticas contábeis

- Ajustar lucros por itens não recorrentes (venda de ativos, reestruturações, efeitos contábeis pontuais) para obter lucro normalizado.[^2]
- Monitorar accruals (diferença entre lucro e caixa) e sua composição; accruals crescentes e desconexos do negócio são alerta de baixa qualidade.[^2]
- Mapear políticas de reconhecimento de receita, provisões, depreciação, testes de impairment e mudanças recentes.[^2]

### 3.5 Vantagens competitivas (moat) e sustentabilidade

- Identificar economias de escala, efeitos de rede, custos de mudança, ativos intangíveis (marca, patentes, licenças) e posição regulatória.[^2]
- Avaliar se margens superiores, crescimento e ROE elevado são sustentáveis diante de mudanças tecnológicas, entrada de novos players e regulação.[^2]

### 3.6 Abordagens de valuation

**Fluxo de Caixa Descontado (DCF):**
- Projetar fluxos de caixa livres (FCFF ou FCFE) com base em drivers de receita, margens, CAPEX e capital de giro.[^1][^2]
- Estimar taxa de desconto via WACC (para FCFF) ou custo de capital próprio via CAPM (para FCFE).[^1][^2]
- Calcular valor terminal por crescimento perpétuo (taxa estável inferior ao crescimento de longo prazo da economia) ou múltiplos de saída.[^1][^2]
- Garantir consistência: FCFF deve ser descontado a WACC; FCFE, ao custo de equity.[^1][^2]

**Múltiplos comparáveis:**
- Usar P/L, EV/EBITDA, P/VPA, EV/Receita, ajustando por diferenças de crescimento, margem, risco, estrutura de capital e liquidez.[^1][^2]
- Comparar com pares do mesmo setor, região e estágio de ciclo; lembrar que múltiplos em emergentes tendem a vir com desconto vs mercados desenvolvidos.[^1]

**Abordagem de ativos:**
- Aplicar quando ativos tangíveis e reservas têm papel central (imobiliário, utilities, commodities);
- Trabalhar com valor patrimonial ajustado, valor de liquidação e valor de reposição, conforme o caso.[^2]

### 3.7 Sensibilidade, cenários e incerteza

- Construir tabelas de sensibilidade para premissas críticas (crescimento, margem, WACC, múltiplo de saída).[^2]
- Produzir pelo menos três cenários (base, otimista, pessimista) e, quando adequado, valor esperado ponderado por probabilidades.[^2]
- Usar simulação de Monte Carlo para capturar incerteza multivariada em modelos complexos.[^2]

### 3.8 Tipos especiais de empresas

- **Growth:** lucros baixos/negativos, foco em múltiplos de receita, unit economics, escalabilidade e caminho para margens maduras.[^2]
- **Cíclicas:** normalizar lucros ao longo de ciclos completos, evitar valorar em pico ou vale.[^2]
- **Commodities:** sensíveis a preços globais, curva futura, custo caixa e duração de reservas; considerar opções reais (capacidade de parar/retomar produção).[^2]
- **Financeiras:** usar múltiplos específicos (P/TBV, P/L, dividend discount), métricas de capital regulatório (Tier 1), qualidade da carteira de crédito.[^2]

### 3.9 Checklist fundamentalista (complemento)

Para reduzir vieses e omissões, o agente deve seguir uma checklist em camadas:[^6][^7]

- **Tier 1 – Itens obrigatórios (falha implica rejeição):**
  - Negócio compreensível dentro do círculo de competência.
  - Gestão íntegra e capaz.
  - Geração consistente de caixa livre positiva.
  - Endividamento não excessivo (por exemplo, dívida líquida/EBITDA abaixo de limiar definido).
  - Ação negociando abaixo de valor intrínseco estimado, com margem de segurança mínima.
- **Tier 2 – Itens desejáveis (fraquezas exigem compensação):**
  - Moat forte e mensurável.
  - ROIC elevado e estável.
  - Crescimento saudável de receita e lucros.
  - Balanço robusto (indicadores de solvência adequados).
  - Incentivos alinhados entre gestão e acionistas.
- **Tier 3 – Itens positivos adicionais:**
  - Histórico de alocação de capital favorável ao acionista.
  - Participação relevante de insiders.
  - Ventos favoráveis no setor.
  - Catalisadores claros para reprecificação.

## 4. Análise Técnica e Quantitativa

### 4.1 Princípios básicos

- O mercado desconta tudo; preços refletem informação fundamental, macro e psicológica.[^2]
- Preços se movem em tendências (primária, secundária, de curto prazo).[^2]
- Padrões se repetem porque o comportamento humano é recorrente.[^2]

### 4.2 Estrutura de tendências

- Classificar tendência em alta, baixa ou lateral em múltiplos prazos (semanal, diário, intradiário se relevante).[^2]
- Usar linhas de tendência, canais e médias móveis para definir direção e zonas de suporte/resistência dinâmicos.[^2]

### 4.3 Suportes, resistências e padrões

- Identificar níveis horizontais importantes (máximas/mínimas anteriores, números redondos, retrações de Fibonacci).[^2]
- Monitorar reversões (ombro-cabeça-ombro, topos/fundos duplos/triplos) e padrões de continuação (triângulos, bandeiras, retângulos).[^2]
- Utilizar candlesticks (doji, martelo, engolfo) para refinar timing.[^2]

### 4.4 Indicadores técnicos

- **Tendência:** médias móveis simples e exponenciais, MACD, ADX.[^2]
- **Momentum:** RSI, estocástico, ROC, Williams %R.[^3][^2]
- **Volume:** OBV, VPT, Acumulação/Distribuição, Chaikin Money Flow.[^3][^2]

O agente deve evitar sobrecarregar o modelo com muitos indicadores redundantes; priorizar 2–3 por função (tendência, momentum, volume).[^2]

### 4.5 Análise de volume e confirmações

- Confirmar rompimentos relevantes com aumento de volume; considerar rompimentos sem volume como suspeitos.[^2]
- Identificar clímax de volume (picos extremos) e períodos de volume "seco" como potenciais pontos de inflexão.[^2]

### 4.6 Quantitativo avançado

- Usar regressão, correlação e análise de componentes principais para identificar fatores comuns e regimes de mercado.[^2]
- Modelar volatilidade com GARCH e comparar volatilidade histórica vs implícita.[^2]
- Backtestar estratégias com walk-forward e testes out-of-sample, reportando retorno, volatilidade, Sharpe, drawdown máximo e taxa de acerto.[^2]

### 4.7 Limitações

- Reconhecer que padrões passados podem falhar em ambientes estruturais novos; sinais falsos são comuns, especialmente em ativos ilíquidos.[^3][^2]
- Nunca usar técnica isolada de fundamentos e risco; ela é camada de timing, não substituto de análise de valor.[^2]

## 5. Análise Macroeconômica, Setorial e Regional

### 5.1 Indicadores macro essenciais

- PIB real e nominal, composição (consumo, investimento, gastos públicos, exportações líquidas).[^2]
- Inflação cheia e núcleo, expectativas inflacionárias, risco de deflação.[^2]
- Mercado de trabalho (taxa de desemprego, criação de vagas, participação na força de trabalho, salários).[^2]
- Taxas de juros (curva, spreads de crédito, juros reais).[^1][^2]

### 5.2 Política monetária e fiscal

- Analisar decisões de bancos centrais (taxa básica, guidance, balanço) e seus canais de transmissão (juros, crédito, riqueza, câmbio).[^1][^2]
- Avaliar política fiscal (déficit, dívida/PIB, composição de gastos e impostos, multiplicadores).[^2]

### 5.3 Setor externo e câmbio

- Ler conta corrente, conta capital/financeira e posição de dívida externa.[^2]
- Mapear regime cambial (fixo, flutuante, bandas) e impactos em política monetária.[^2]
- Considerar efeitos de "carry trade" e fluxos de portfólio em mercados emergentes.[^1]

### 5.4 Ciclos econômicos e indicadores antecedentes

- Classificar fase do ciclo (expansão, pico, contração, vale) e associar classes de ativos e setores mais favorecidos em cada fase.[^2]
- Monitorar curva de juros (inclinação, inversões), confiança de consumidores/empresas, dados de emprego de alta frequência e preços de commodities como indicadores antecedentes.[^1][^2]

### 5.5 Análise setorial detalhada

O agente deve conhecer características, subsetores e métricas-chave de:

- **Setor financeiro:** regulação pesada, alavancagem, sensibilidade a juros, risco de crédito; métricas como ROE, margem financeira, efficiency ratio, capital regulatório.[^2]
- **Tecnologia:** ciclo de inovação rápido, P&D elevado, efeitos de rede, escalabilidade; métricas como crescimento de receita, margem bruta alta, usuários ativos, churn, ARPU.[^2]
- **Saúde:** forte regulação, dependência de patentes e reembolso; importância de pipeline clínico e taxas de sucesso.[^2]
- **Energia:** exposição a preços de petróleo/gás, custos de produção, transição energética, CAPEX intensivo.[^2]
- **Varejo:** sensibilidade à renda e confiança, sazonalidade, transformação digital (e-commerce, omnicanal), métricas como vendas mesmas lojas e giro de estoques.[^2]

### 5.6 Mercados globais

- **Estados Unidos:** maior mercado de capitais; diferenças microestruturais entre NYSE (mercado de leilão) e Nasdaq (dealer market); importância de S&P 500, Nasdaq-100 e Dow como referências.[^1]
- **Europa:** mosaico de mercados (LSE, Deutsche Börse, Euronext) com especializações setoriais (luxo, automotivo, bancos).[^1]
- **China:** forte intervenção estatal, diferenciação entre A-shares (domésticas) e H-shares (Hong Kong) com prêmios/descontos estruturais.[^1]
- **Brasil:** B3 com peso elevado de commodities e bancos; Ibovespa altamente sensível a preços globais de minério e petróleo e política doméstica.[^1]

### 5.7 Geopolítica, riscos regionais e contágio

- Incorporar impacto de guerras comerciais, sanções, conflitos e choques políticos em fluxos de capital, cadeias de suprimentos e prêmios de risco.[^1]
- Distinguir choques idiossincráticos (confinados a um país) de choques sistêmicos com risco de contágio amplo.[^1]

## 6. Gestão de Risco, Diversificação e Psicologia

### 6.1 Tipos de risco

- **Sistemático (de mercado):** juros, inflação, risco político global, ciclos; não eliminável por diversificação.[^2]
- **Não sistemático (específico):** riscos de negócio, financeiros, de governança e de liquidez de empresas individuais; mitigável por diversificação.[^2]

### 6.2 Medidas de risco

- **Volatilidade:** desvio padrão de retornos (histórica, implícita e condicional).[^2]
- **Value at Risk (VaR):** perda máxima esperada para horizonte e nível de confiança dados (paramétrico, histórico, Monte Carlo).
- **Expected Shortfall (ES):** perda média condicionada a exceder o VaR, preferível por propriedades matemáticas.[^2]
- **Maximum drawdown:** pior queda pico-vale, crucial para avaliar dor do investidor.[^2]

### 6.3 Diversificação

- Entre classes de ativos (ações, títulos, commodities, imóveis, alternativos).[^2]
- Entre geografias (desenvolvidos vs emergentes, moedas diferentes).[^1][^2]
- Entre setores (cíclicos vs defensivos vs crescimento secular).[^2]
- Monitorar correlações dinâmicas, ciente de que tendem a subir em crises.[^2]

### 6.4 Hedge e instrumentos

- Usar futuros, opções, swaps e NDFs para reduzir risco de taxa de juros, câmbio e commodities, respeitando basis risk e custo de carrego.[^2]
- Definir hedge ratio, decidir entre hedge total/parcial e horizonte de proteção.[^2]

### 6.5 Modelos de risco (fatores)

- CAPM (fator único) com beta de mercado.[^2]
- Modelos multifatoriais (Fama-French, fatores de tamanho, valor, qualidade, investimento, momentum) e modelos proprietários de risco.[^2]

### 6.6 Gestão de risco de portfólio

- Teoria Moderna de Portfólios, fronteira eficiente, portfólio de tangência, índice de Sharpe e tracking error.[^2]
- Rebalanceamento por tempo, desvio de bandas ou volatilidade, sempre ponderando custo de transação vs benefício.[^2]

### 6.7 Dimensionamento de posição (complemento)

O material original descreve gestão de risco em nível de portfólio, mas pouco formaliza **tamanho de posição por trade**; esta lacuna é crítica.

O agente deve incorporar pelo menos duas abordagens:[^8][^9][^5]

1. **Risco fixo por trade (regra prática):**
   - Definir percentual máximo de capital arriscado por posição (por exemplo, 0,5–2%).
   - Calcular tamanho: \(\text{Posição} = \frac{\text{Capital} \times \text{%Risco}}{\text{Distância do stop}}\).
2. **Critério de Kelly (e frações dele):**
   - Estimar probabilidade de ganho \(W\) e relação retorno/risco \(R\) com base em dados históricos.
   - Kelly em versão simples: \(\text{Kelly\%} = W − \frac{1 − W}{R}\).[^9][^5][^8]
   - Na prática, usar frações (meio Kelly, um quarto de Kelly) para reduzir volatilidade do patrimônio.[^5][^8][^9]

O sistema deve preferir risco fixo simples para robustez e usar Kelly apenas como referência para limites superiores de exposição.

### 6.8 Psicologia de mercado e vieses

- Reconhecer vieses cognitivos (confirmação, ancoragem, disponibilidade, representatividade, excesso de confiança) e emocionais (aversão à perda, efeito manada, arrependimento).[^2]
- Entender anomalias como momentum, reversão à média, efeitos tamanho e valor, ciclos de euforia e pânico, e indicadores de sentimento (VIX, put/call, pesquisas de sentimento, fluxos de fundos).[^2]
- Projetar processos (checklists, revisão de tese, regras de saída) que limitem impacto de vieses humanos.[^6][^2]

## 7. Derivativos e Estratégias Avançadas

### 7.1 Fundamentos de derivativos

- Derivativos têm valor derivado de ativos, taxas ou índices subjacentes; principais funções são hedge, especulação e arbitragem.[^2]
- Contratos futuros são padronizados, com margem e ajuste diário; opções conferem direito, não obrigação; swaps trocam fluxos de caixa.[^2]

### 7.2 Opções e gregas

- Calls e puts podem ser combinadas em estratégias (spreads, straddles, collars) para estruturar payoff assimétrico.[^2]
- As "gregas" (delta, gamma, theta, vega, rho) medem sensibilidade a preço, convexidade, tempo, volatilidade e juros, e devem ser monitoradas em books de derivativos.[^2]

### 7.3 Estratégias quantitativas e sistemáticas

- **Trend-following:** capturar tendências fortes usando filtros de média móvel, breakout de bandas ou filtros de volatilidade.[^2]
- **Reversão à média:** comprar ativos que se desviaram substancialmente de médias históricas, com critérios estatísticos claros.[^2]
- **Trading algorítmico/HFT:** execução automatizada, market making, arbitragem de microdiferenças de preço.[^2]
- **Machine learning:** modelos supervisionados, não supervisionados e de reinforcement learning aplicados a séries de preço, fundamentos e notícias.[^2]

### 7.4 Arbitragem

- Arbitragem pura (mesmo ativo em mercados diferentes), merger arbitrage (diferença entre preço da ação-alvo e preço de oferta), convertible arbitrage e estratégias de crédito.[^2]

### 7.5 Estratégias em renda fixa e alternativas

- Duration targeting, barbell, bullet, ladder, steepeners/flatteners e estratégias de spread de crédito.[^2]
- Long/short equity, global macro, event-driven, risk parity, Black-Litterman e multi-asset como frameworks avançados de portfólio.[^2]

### 7.6 Atribuição de performance

- Decompor retorno em decisões de alocação de ativos, seleção de títulos e interação; medir performance ajustada ao risco com Sharpe, information ratio, Sortino e Calmar.[^2]

## 8. Criptomoedas, On-Chain e Web3

### 8.1 Conceitos fundamentais

- Criptomoedas são ativos digitais protegidos por criptografia, normalmente operando em redes blockchain públicas, descentralizadas e imutáveis.[^3]
- Bitcoin inaugurou o modelo de dinheiro eletrônico peer-to-peer; Ethereum ampliou o escopo com smart contracts e dApps, dando origem a DeFi, NFTs e DAOs.[^3]

### 8.2 Tecnologia de base

- **Blockchain:** livro-razão distribuído com blocos encadeados por hashes; pode ser pública, privada ou de consórcio.[^3]
- **Smart contracts:** programas autoexecutáveis na blockchain, disparados por condições predefinidas, reduzindo necessidade de intermediários.[^3]
- **Mecanismos de consenso:**
  - Proof of Work (PoW): segurança baseada em poder computacional, alto consumo energético (ex.: Bitcoin).[^3]
  - Proof of Stake (PoS): segurança baseada em capital em stake; mais eficiente energeticamente (ex.: Ethereum pós-Merge, Cardano, Solana).[^3]
- **Layers:**
  - Layer 1: rede base (Bitcoin, Ethereum, Solana).
  - Layer 2: soluções sobre L1 para escalabilidade (rollups, state channels).[^3]

### 8.3 Principais ativos e categorias

- **Bitcoin:** foco em segurança, descentralização e escassez fixa; frequentemente tratado como "ouro digital".[^3]
- **Ethereum:** plataforma generalista de smart contracts e base principal de DeFi, NFTs e DAOs.[^3]
- **Stablecoins:** tokens atrelados a moedas fiduciárias (USDT, USDC) ou colateral cripto/algorítmicos; são o "cash" do ecossistema.[^3]
- **Altcoins de infraestrutura:** BNB, Solana, Cardano, Polkadot, entre outras, com diferentes propostas de escalabilidade, governança e interoperabilidade.[^3]

### 8.4 Ecossistema cripto

- **Exchanges:**
  - CEXs (centralizadas): alta liquidez e UX amigável, mas com risco de custódia.[^3]
  - DEXs (descentralizadas): não custodiais, baseadas em AMMs ou order books on-chain, dependem de liquidez de usuários.[^3]
- **Carteiras:** hot wallets (conectadas, práticas, mais expostas) e cold wallets (hardware, alta segurança para longo prazo).[^3]
- **DeFi:** protocolos de lending, DEXs, derivativos, staking e yield farming.[^3]
- **NFTs e DAOs:** tokens não fungíveis para propriedade digital/real e organizações governadas por smart contracts.[^3]

### 8.5 Análise de mercado cripto (técnica e sentimento)

- Usar os mesmos princípios de análise técnica (RSI, MACD, médias móveis, volume), ajustando para maior volatilidade e negociações 24/7.[^3]
- Medir sentimento via redes sociais, buscas, volume de menções e funding rates, distinguindo sinal de ruído.[^3]
- Avaliar volatilidade e liquidez de cada par, spreads e profundidade de book.[^3]

### 8.6 Riscos e regulação

- Volatilidade extrema, riscos de contraparte (CEXs), falhas de smart contracts, hacks, rugpulls e bugs de protocolo.[^3]
- Regulação em evolução com foco em AML/CFT, KYC, proteção ao investidor e tributação; grande heterogeneidade entre países.[^3]

### 8.7 Análise on-chain (complemento crítico)

Os documentos originais introduzem fundamentos e técnica para cripto, mas tratam on-chain de forma limitada. A análise on-chain é um terceiro pilar fundamental ao lado de técnica e narrativa.[^10][^11][^4]

- **Definição:** on-chain metrics são medidas derivadas diretamente da atividade registrada na blockchain (transações, saldos, endereços, emissão, fees).[^11][^10]
- **Exemplos de métricas:**
  - Hash rate (PoW): proxy de segurança da rede.[^11]
  - Número de endereços ativos e com saldo relevante: adoção e distribuição de holders.[^11]
  - Fluxos de exchanges (in/out): pressão de venda/compra potencial.
  - Métricas de valuation como MVRV (Market Value/Realized Value), NVT (Network Value/Transactions) e Bitcoin Days Destroyed, que relacionam valor de mercado e atividade econômica real na rede.[^10][^4][^11]
  - Dormancy (média de dias que moedas ficaram paradas antes de se mover): distingue movimentos de especuladores de curto prazo vs holders antigos.[^10]
- **Integração ao processo:**
  - Para cada ativo cripto relevante, o agente deve consultar um conjunto mínimo de métricas on-chain padronizadas e integrá-las à camada fundamental (por exemplo, tratar MVRV esticado como equivalente a múltiplo de valuation alto).[^4][^10][^11]
  - Combinar on-chain com técnica e sentimento, nunca usar isoladamente.

### 8.8 Tendências de longo prazo

- Web3 como internet de propriedade e identidade soberana, baseada em carteiras e protocolos abertos.[^3]
- Tokenização de ativos do mundo real (RWA) aproximando TradFi e DeFi, com aumento de liquidez e fracionamento de ativos.[^3]
- Convergência entre IA e cripto: trading sistemático, detecção de anomalias de segurança, análise de sentimento e agentes autônomos on-chain.[^4][^3]

### 8.9 Segurança e boas práticas (usuário final)

- Uso preferencial de cold wallets para grandes valores; proteção cuidadosa da seed phrase; 2FA em todas as contas; evitar Wi-Fi público e ataques de phishing.[^3]
- Interagir prioritariamente com protocolos auditados; começar com pequenas transações em novos contratos; revisar e revogar permissões periodicamente.[^3]

## 9. Arquitetura de Sistema para Agente de IA de Investimentos

### 9.1 Arquitetura modular

- **Módulo de coleta de dados:** integra dados de mercado, fundamentos, macro, notícias, dados alternativos e dados on-chain.[^1][^3][^2]
- **Módulo de processamento:** normaliza, limpa, agrega no tempo, calcula indicadores e deriva métricas padronizadas.[^2]
- **Módulos analíticos especializados:**
  - Fundamentalista/valuation.
  - Técnico/quantitativo.
  - Macroeconômico e setorial.
  - Risco e portfólio.
  - Cripto e on-chain.[^1][^3][^2]
- **Módulo de síntese e decisão:** combina scores, resolve conflitos entre sinais e gera recomendações.[^2]

### 9.2 Sistema de scoring unificado

- Scores de 0–100 por dimensão: Fundamental, Técnico, Macro, Risco, além de sub-scores específicos para cripto/on-chain.[^2]
- Agregação ponderada ajustável por regime de mercado, horizonte de investimento e perfil de risco do cliente.[^2]
- Penalidade de risco derivada de score de risco combinado (volatilidade, liquidez, crédito, concentração), modulada por fator de aversão ao risco.[^2]

### 9.3 NLP e análise de texto

- Classificação de sentimento em notícias, relatórios de analistas, comunicados e redes sociais.[^2]
- Extração de entidades (empresas, ativos, pessoas, eventos) e relações (fusões, litígios, mudanças regulatórias).[^3][^2]
- Comparação temporal de linguagem para detectar mudança de tom (otimista → cauteloso → negativo).[^2]

### 9.4 Machine learning e ensembles

- Modelos preditivos para retornos, probabilidades de drawdown e mudanças de regime, usando features técnicas, fundamentais, macro e on-chain.[^4][^2]
- Uso de ensembles (bagging, boosting, stacking) para robustez; validação out-of-sample rigorosa para evitar overfitting.[^2]

### 9.5 Gestão de risco automatizada

- Monitoramento contínuo de VaR, ES, stress tests e limites de concentração por ativo, setor, país e fator.[^2]
- Rebalanceamento automático com lógica de custo-benefício e respeito a restrições de liquidez.[^2]

### 9.6 Interface, relatórios e explicabilidade

- Dashboards com visão de portfólio, exposição a riscos, alertas e ranking de oportunidades.[^2]
- Relatórios automáticos diários, semanais e mensais com attribution, análise de eventos e atualização de teses.[^2]
- Explicabilidade via decomposição de scores, análise de sensibilidade e comparação com episódios históricos análogos.[^2]

### 9.7 Ética, regulação e governança de modelos

- Cumprir princípios de responsabilidade fiduciária: priorizar interesse do cliente, transparência sobre riscos e limitações do sistema.[^2]
- Gestão de conflitos de interesse (separação de research e trading, disclosure de incentivos).[^2]
- Governança de modelos: monitorar drift de dados, recalibrar modelos periodicamente, manter trilhas de auditoria de decisões.[^2]

## 10. Lacunas Identificadas nos Documentos Originais e Complementos

### 10.1 Dimensionamento de posição e risco por trade

- Os documentos enfatizam risco de portfólio, mas tratam de forma marginal o **tamanho ótimo de posição**, tema crítico para sobrevivência e crescimento do capital.[^2]
- Esta base adiciona:
  - Regra prática de risco fixo por trade.
  - Uso disciplinado (e fracionado) do critério de Kelly como limite superior, evitando sobrealavancagem.[^8][^9][^5]

### 10.2 Profundidade em métricas on-chain e sua integração

- A base cripto original descreve tecnologia, ativos e DeFi, mas a análise on-chain aparece apenas de forma introdutória.[^3]
- Esta versão amplia:
  - Definição operacional de on-chain data/metrics.
  - Conjunto mínimo de métricas padrão (hash rate, endereços ativos, MVRV, NVT, dormancy, fluxos de exchanges) e papel de cada uma.[^10][^11][^4]
  - Integração explícita de on-chain na camada fundamental/valuation cripto.

### 10.3 Checklists explícitos de análise e disciplina de saída

- Os documentos descrevem conceitos, mas nem sempre os organizam em checklists operacionais claros.[^2]
- Esta base adiciona:
  - Checklist fundamentalista em tiers (obrigatório/desejável/adicional).[^7][^6]
  - Reforço de necessidade de regras de saída baseadas em tese, valuation (alvo/margem de segurança) e risco (drawdown, mudança estrutural).[^7][^6]

### 10.4 Governança de modelos de IA e risco de modelo

- Há boa descrição de arquitetura, mas pouca ênfase em **governança de modelos** (monitoramento, recalibração, controle de vieses de dados).[^2]
- Esta versão reforça:
  - Monitoramento de performance out-of-sample.
  - Controles contra overfitting e viés de data mining.
  - Documentação de versões de modelo e decisões-chave.

### 10.5 Ponte entre TradFi e cripto em alocação de portfólio

- Os materiais tratam TradFi e cripto de forma relativamente separada.[^1][^3][^2]
- Esta base enfatiza que o agente deve:
  - Tratar cripto como classe de ativo com drivers próprios, mas correlacionada a liquidez global, apetite a risco e ciclos de tecnologia.[^4][^3]
  - Integrar risco cripto (volatilidade, correlação, risco regulatório) ao modelo de risco global do portfólio.

### 10.6 Framework de decisão fim a fim

- Cada documento é rico em conteúdo individual, mas a sequência exata de passos para análise de um ativo/portfólio não está totalmente padronizada.[^1][^3][^2]
- Esta base fornece um **framework procedural unificado** (seção 2.2), que o agente deve seguir de forma consistente para garantir reprodutibilidade do raciocínio.

---

## References

1. [Analise-Global-para-Investidores_-Mercados-Documentos-Google-1-2.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/128219450/7a46876f-6cb3-4638-9312-2c605224d9d6/Analise-Global-para-Investidores_-Mercados-Documentos-Google-1-2.pdf?AWSAccessKeyId=ASIA2F3EMEYEZRHTWAW7&Signature=k9BRifMfentrAIOTtwnUAzWBBOU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjELf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCICpM2ZTO%2B0KskBQPeFHvnpRVM9MUdEEIacqw%2B8k5WKY2AiAbLmG2hF0nb3MO5Fg57oNbfL%2FovpfZV%2B%2BWXb995u8%2FxCr8BAiA%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMooM7YOi1Qf1q9e59KtAEiMCqdHJwfU%2FdwnYtByuXJ3jy29VDIjtTbKJyB2b34KP9hyDTOd27Y9mCjuxTBn0%2FAix2qJjnAT6IGisU7ytQ3lAxzFSKqKn3GIfkmTbzyabHDsPKVyc7IOa%2BAkIJU17NaM%2BS5bSvY4Zicu9Uap2a07cUWWBCFbOP0O019lDlWECbR%2B%2FDuRl3QQ1xMCsPrNZ30oKTUi%2F1Mw80PAE%2FF2ebKVs8nuCVEcc94Ih75JOfEDIMBmgku7V8hLtB7b153mC5QlZMMKf%2BzkHuuYay2ahyKbzU785NPGPj5jm0nGCX6I0N2mwiazjn6Zg5Om5f5D8XFYoqmLAypXews4ffaHCaEvHbG%2FCGzOKZUeMVambMWLvRLxtQ%2FgyepDScR56EZUBGKxeS0wVWVRhLIauoVeuq2NOh3HdIOBMkHdSOQ06ZKUq00d5MfgoLJ6MdA7NLOt%2BGLnrH%2Fs4MJ67ZNLNqxYril3ib49op7Q6CrCRNmI4yjhXfyyf8kyfnucbIl71yVY0zz3%2Fe6EBm7178mzh4vOkK1ZD2noa4pHkTRf%2FqdqEkdh%2B60xmhj1NvfqHQH5L0Dbs%2FFL%2FZK097X6ZF724rYfRSm%2FTD5y7WZdExEaz9XwOdCJCfomi%2F0P7ALsYx2nB5bOEkiUDXCSc1nNqlRi7kT5euHGIFwHHiC95BG6HHrUcDTWTbns0TlHcuSDNBfSunxsKTYLaHowViDlhdEikFhrkqSuCFwiw1S3MjZmjhCLKs2MPm5esSATmsZrQEodhCzSKWasuSGyByDGW5PBLCfOk4tDDE%2FszNBjqZAWbEETLXhN1xTEjjQqsF3oZJUQYr3qsQ0u%2FgNnph4cY0TeyfEOX4uU%2BM5Gvx7XNCjXQ%2FDYg%2B75c4xBHGMDIa%2FOclvy5LzgL5Ap%2BqRo9RCGqbupyI%2BI2nlY5g%2BVx%2F%2BN%2BdlJdCuObFgOWjIIjKC7hIhzFnUWle%2F6xnuPOizwETxFrJzGzIQPNFKPiaVzK7ppV%2Bd%2F71xVYltbytmg%3D%3D&Expires=1773358949) - ‭O Investidor Global: Um Manual‬
‭Abrangente para Análise e Decisão em‬
‭Mercados de Capitais‬
‭Pref...

2. [analise_mercado_financeiro_completa-1-1-1.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/128219450/658b3974-f873-44f0-8af5-2fb015fded36/analise_mercado_financeiro_completa-1-1-1.pdf?AWSAccessKeyId=ASIA2F3EMEYEZRHTWAW7&Signature=IYK6gWIgVFE3WGNTFG6CWNpG1ZE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjELf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCICpM2ZTO%2B0KskBQPeFHvnpRVM9MUdEEIacqw%2B8k5WKY2AiAbLmG2hF0nb3MO5Fg57oNbfL%2FovpfZV%2B%2BWXb995u8%2FxCr8BAiA%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMooM7YOi1Qf1q9e59KtAEiMCqdHJwfU%2FdwnYtByuXJ3jy29VDIjtTbKJyB2b34KP9hyDTOd27Y9mCjuxTBn0%2FAix2qJjnAT6IGisU7ytQ3lAxzFSKqKn3GIfkmTbzyabHDsPKVyc7IOa%2BAkIJU17NaM%2BS5bSvY4Zicu9Uap2a07cUWWBCFbOP0O019lDlWECbR%2B%2FDuRl3QQ1xMCsPrNZ30oKTUi%2F1Mw80PAE%2FF2ebKVs8nuCVEcc94Ih75JOfEDIMBmgku7V8hLtB7b153mC5QlZMMKf%2BzkHuuYay2ahyKbzU785NPGPj5jm0nGCX6I0N2mwiazjn6Zg5Om5f5D8XFYoqmLAypXews4ffaHCaEvHbG%2FCGzOKZUeMVambMWLvRLxtQ%2FgyepDScR56EZUBGKxeS0wVWVRhLIauoVeuq2NOh3HdIOBMkHdSOQ06ZKUq00d5MfgoLJ6MdA7NLOt%2BGLnrH%2Fs4MJ67ZNLNqxYril3ib49op7Q6CrCRNmI4yjhXfyyf8kyfnucbIl71yVY0zz3%2Fe6EBm7178mzh4vOkK1ZD2noa4pHkTRf%2FqdqEkdh%2B60xmhj1NvfqHQH5L0Dbs%2FFL%2FZK097X6ZF724rYfRSm%2FTD5y7WZdExEaz9XwOdCJCfomi%2F0P7ALsYx2nB5bOEkiUDXCSc1nNqlRi7kT5euHGIFwHHiC95BG6HHrUcDTWTbns0TlHcuSDNBfSunxsKTYLaHowViDlhdEikFhrkqSuCFwiw1S3MjZmjhCLKs2MPm5esSATmsZrQEodhCzSKWasuSGyByDGW5PBLCfOk4tDDE%2FszNBjqZAWbEETLXhN1xTEjjQqsF3oZJUQYr3qsQ0u%2FgNnph4cY0TeyfEOX4uU%2BM5Gvx7XNCjXQ%2FDYg%2B75c4xBHGMDIa%2FOclvy5LzgL5Ap%2BqRo9RCGqbupyI%2BI2nlY5g%2BVx%2F%2BN%2BdlJdCuObFgOWjIIjKC7hIhzFnUWle%2F6xnuPOizwETxFrJzGzIQPNFKPiaVzK7ppV%2Bd%2F71xVYltbytmg%3D%3D&Expires=1773358949) - Análise Completa do Mercado
Financeiro: Guia Definitivo para Agentes
de IA
Autor: Manus AI
Data: 24 ...

3. [cripto_knowledge_base.md-2-3.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/128219450/5a9b6d1a-8805-43e9-a00d-e77368b0376b/cripto_knowledge_base.md-2-3.pdf?AWSAccessKeyId=ASIA2F3EMEYEZRHTWAW7&Signature=RtFYrUpbgLkbQI%2B8bKL6q%2FTgtUM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjELf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCICpM2ZTO%2B0KskBQPeFHvnpRVM9MUdEEIacqw%2B8k5WKY2AiAbLmG2hF0nb3MO5Fg57oNbfL%2FovpfZV%2B%2BWXb995u8%2FxCr8BAiA%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMooM7YOi1Qf1q9e59KtAEiMCqdHJwfU%2FdwnYtByuXJ3jy29VDIjtTbKJyB2b34KP9hyDTOd27Y9mCjuxTBn0%2FAix2qJjnAT6IGisU7ytQ3lAxzFSKqKn3GIfkmTbzyabHDsPKVyc7IOa%2BAkIJU17NaM%2BS5bSvY4Zicu9Uap2a07cUWWBCFbOP0O019lDlWECbR%2B%2FDuRl3QQ1xMCsPrNZ30oKTUi%2F1Mw80PAE%2FF2ebKVs8nuCVEcc94Ih75JOfEDIMBmgku7V8hLtB7b153mC5QlZMMKf%2BzkHuuYay2ahyKbzU785NPGPj5jm0nGCX6I0N2mwiazjn6Zg5Om5f5D8XFYoqmLAypXews4ffaHCaEvHbG%2FCGzOKZUeMVambMWLvRLxtQ%2FgyepDScR56EZUBGKxeS0wVWVRhLIauoVeuq2NOh3HdIOBMkHdSOQ06ZKUq00d5MfgoLJ6MdA7NLOt%2BGLnrH%2Fs4MJ67ZNLNqxYril3ib49op7Q6CrCRNmI4yjhXfyyf8kyfnucbIl71yVY0zz3%2Fe6EBm7178mzh4vOkK1ZD2noa4pHkTRf%2FqdqEkdh%2B60xmhj1NvfqHQH5L0Dbs%2FFL%2FZK097X6ZF724rYfRSm%2FTD5y7WZdExEaz9XwOdCJCfomi%2F0P7ALsYx2nB5bOEkiUDXCSc1nNqlRi7kT5euHGIFwHHiC95BG6HHrUcDTWTbns0TlHcuSDNBfSunxsKTYLaHowViDlhdEikFhrkqSuCFwiw1S3MjZmjhCLKs2MPm5esSATmsZrQEodhCzSKWasuSGyByDGW5PBLCfOk4tDDE%2FszNBjqZAWbEETLXhN1xTEjjQqsF3oZJUQYr3qsQ0u%2FgNnph4cY0TeyfEOX4uU%2BM5Gvx7XNCjXQ%2FDYg%2B75c4xBHGMDIa%2FOclvy5LzgL5Ap%2BqRo9RCGqbupyI%2BI2nlY5g%2BVx%2F%2BN%2BdlJdCuObFgOWjIIjKC7hIhzFnUWle%2F6xnuPOizwETxFrJzGzIQPNFKPiaVzK7ppV%2Bd%2F71xVYltbytmg%3D%3D&Expires=1773358949) - _to_write=
Base de Conhecimento sobre 
Criptomoedas para Busca Semântica 
(GEM)
Autor: Manus AI Data...

4. [Optimize Your Investments: Applying the Kelly Criterion for Portfolio ...](https://www.investopedia.com/articles/trading/04/091504.asp) - For example, you should take a 5% position in each of the equities in your portfolio if the Kelly pe...

5. [Kelly criterion - Wikipedia](https://en.wikipedia.org/wiki/Kelly_criterion) - In probability theory, the Kelly criterion is a formula for sizing a sequence of bets by maximizing ...

6. [Kelly Criterion for Stock Trading: Optimal Position Sizing - Zerodha](https://zerodha.com/varsity/chapter/kellys-criterion/) - Which states that Kelly % = W – [(1 – W) / R] is the formula that Gamblers should use and that the f...

7. [Analysis of The Kelly Criterion in Practice - Alpha Theory](https://www.alphatheory.com/blog/kelly-criterion-in-practice-1) - Kelly's base assumption that 100% of capital can be allocated to a single bet necessitates that the ...

8. [The Mathematics of Position Sizing, Part 1: The Kelly Criterion from ...](https://kniyer.substack.com/p/the-mathematics-of-position-sizing) - We're starting with the Kelly Criterion — a 68-year-old formula from Bell Labs that tells you exactl...

9. [What Are On-Chain Metrics and How Do They Predict Crypto Price ...](https://www.gate.com/crypto-wiki/article/what-are-on-chain-metrics-and-how-do-they-predict-crypto-price-movements-20251228) - Article Overview On-chain metrics are essential analytical tools that decode blockchain activity to ...

10. [Invest smarter: A five-step checklist for company analysis - Shyft](https://www.shyft.co.za/en-ZA/steps-for-better-fundamental-analysis) - Checklist for fundamental analysis of stocks. 1. Search for new investments. Utilise stock screening...

11. [Kelly Criterion Explained: Smarter Position Sizing for Traders | tastylive](https://www.tastylive.com/news-insights/kelly-criterion-explained-smarter-position-sizing-traders) - The Kelly criterion provides a mathematical framework for position sizing that balances growth poten...

