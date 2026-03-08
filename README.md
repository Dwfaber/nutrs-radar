# NUTRS Radar

Dashboard de gestão de ciclos de produção para o sistema NUTRS.

## Features

- 📊 KPIs em tempo real (ciclos, refeições, eficiência, custos)
- 📅 Timeline visual dos ciclos por filial
- 🔍 Drill-down com detalhes diários de cada ciclo
- 📈 Gráficos de produção planejada vs realizada
- ⚠️ Monitoramento de acréscimos

## Stack

- **React 18** + TypeScript
- **Vite** (build)
- **Tailwind CSS** (styling)
- **Supabase** (database)
- **Lucide React** (icons)
- **date-fns** (datas)

## Setup

1. Instalar dependências:
```bash
npm install
```

2. Configurar `.env`:
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

3. Rodar em desenvolvimento:
```bash
npm run dev
```

4. Build para produção:
```bash
npm run build
```

## Estrutura

```
src/
├── components/
│   ├── KPICard.tsx      # Card de métrica
│   ├── Timeline.tsx     # Timeline horizontal
│   └── CicloDetalhe.tsx # Modal de drill-down
├── hooks/
│   ├── useCiclos.ts     # Hook de ciclos
│   └── useKPIs.ts       # Hook de KPIs
├── lib/
│   └── supabase.ts      # Cliente Supabase
├── types/
│   └── index.ts         # TypeScript types
├── App.tsx              # Componente principal
└── main.tsx             # Entry point
```

## Deploy

Para deploy em radar.hubnutrs.com.br:

1. Build: `npm run build`
2. Subir pasta `dist/` pro servidor
3. Configurar nginx/apache para SPA (redirect 404 → index.html)

## Sync de Dados

Os dados são sincronizados via N8N workflow diariamente às 7h.
Para sync manual, execute o workflow no N8N.

---

Desenvolvido para NUTRS - Sistema de Gestão de Alimentação
