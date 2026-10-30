# FormFlow — Plataforma SaaS Premium de Formulários

FormFlow é uma plataforma web completa e moderna para criação visual, publicação instantânea e gestão avançada de formulários e respostas. Inspirada na elegância e produtividade de produtos como **Linear**, **Vercel**, **Notion**, **Stripe** e **Typeform**, combina uma experiência visual de alto padrão com um backend robusto em Next.js App Router, Prisma ORM e PostgreSQL.

---

## 🚀 Principais Recursos

- **Editor Visual com Drag & Drop (@dnd-kit)**:
  - 14 tipos de campos suportados (Texto curto, Parágrafo, E-mail, Telefone, Número, Data, Hora, Seleção/Dropdown, Múltipla Escolha, Checkbox/Caixa de seleção, Chave Liga/Desliga, URL, Título e Parágrafo informativo).
  - Suporte a formulários multipáginas (Multi-step) com barra de progresso em tempo real.
  - Lógica condicional avançada por campo (Exibir/Ocultar baseado em igual, diferente, contém, maior que, etc.).
  - Validações dinâmicas de campos (mínimo, máximo, tamanho de texto, obrigatório).
  - Pré-visualização instantânea em moldura interativa de desktop e smartphone.
  - 4 temas visuais presets (*Dark Premium*, *Moderno*, *Minimalista*, *Corporativo*) com personalização de cor primária, superfícies, raio de botões/cards e alinhamento.
- **Preenchimento Público Fluido (`/f/[slug]`)**:
  - Links públicos amigáveis e QR Code automático para compartilhamento.
  - Proteção anti-spam via Honeypot transparente e Rate Limiting no servidor.
  - Animação festiva de confete ao enviar respostas com sucesso.
- **Gestão de Respostas & Exportação**:
  - Tabela interativa com busca em tempo real e filtro por formulário.
  - Drawer lateral para visualização detalhada de todas as perguntas e respostas.
  - Exportação para **CSV compatível com Microsoft Excel** com sanitização ativa contra *CSV Formula Injection* (`=`, `+`, `-`, `@`).
  - **Versionamento de Formulários**: Cada resposta é atrelada à versão exata em que foi preenchida, prevenindo corrupção de histórico caso o formulário seja alterado.
- **Autenticação & Controle de Acesso (RBAC)**:
  - Sessões seguras com cookies `HttpOnly`, `SameSite` e hash de senhas com **Bcrypt** (12 rounds).
  - Rate limiting contra ataques de força bruta no login.
  - 3 perfis hierárquicos:
    - **Administrador**: Acesso irrestrito a formulários, respostas, equipe e configurações.
    - **Editor**: Criação, edição e publicação de formulários e gestão de respostas.
    - **Visualizador**: Consulta de formulários e respostas, sem permissão de alteração.
- **Gestão de Usuários & Auditoria**:
  - Painel administrativo para cadastrar novos membros, alterar perfis e ativar/desativar contas.
  - Registro de auditoria (`AuditLog`) para operações críticas do sistema.
- **Dashboard com Métricas Reais**:
  - Indicadores numéricos reais de formulários, status e taxa de respostas.
  - Gráficos de área e barra com **Recharts** com filtros de período (7d, 30d, 90d).
- **Design System com Suporte a Temas**:
  - Alternância de tema **Escuro**, **Claro** ou **Automático** persistida localmente.
  - Paleta com grafite profundo, toques sutis de índigo/violeta e tipografia Geist.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript (Strict), Tailwind CSS v4 |
| **Componentes & UI** | shadcn/ui patterns, Lucide React, Sonner (Toast), Canvas Confetti, QRCode |
| **Arrastar e Soltar** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Gráficos** | Recharts |
| **Backend** | Route Handlers do Next.js, Node.js v22/24 |
| **Banco de Dados & ORM** | PostgreSQL 16, Prisma ORM |
| **Autenticação** | Sessões em banco com Cookies HttpOnly e Bcrypt |
| **Testes** | Vitest |
| **Infraestrutura** | Docker, Docker Compose, Cloudflare Tunnel |

---

## 📦 Como Executar Localmente (Desenvolvimento)

### Pré-requisitos
- Node.js 20+ ou 22+
- PostgreSQL (ou container Docker)

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/luanchaaves/sistema-formulario.git
cd sistema-formulario
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

### 3. Migrar e Popular o Banco de Dados
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`.

### 🔑 Credenciais Padrão (Seed)
- **Administrador**: `admin@formflow.local` / `FormFlow@2026!Admin`
- **Editor**: `editor@formflow.local` / `FormFlow@2026!Editor`

---

## 🐳 Implantação em Produção com Docker Compose & Proxmox

O repositório já inclui configuração completa com `Dockerfile` multi-stage otimizado (Next.js standalone) e `docker-compose.yml`.

### 1. No Servidor Linux (VM Ubuntu / Proxmox VE):
```bash
git clone https://github.com/luanchaaves/sistema-formulario.git /opt/formflow
cd /opt/formflow

# Configure suas senhas seguras de produção
cp .env.example .env
nano .env
```

### 2. Iniciar os Containers (PostgreSQL + FormFlow App)
```bash
docker compose up -d --build
```
A aplicação estará disponível na porta `3004`.

### 3. Publicação Segura com Cloudflare Tunnel (Sem abrir portas no roteador)
Se você utiliza Cloudflare Zero Trust:
1. Obtenha o token do seu túnel no painel da Cloudflare.
2. Adicione a variável `CLOUDFLARE_TUNNEL_TOKEN=seu_token` no arquivo `.env`.
3. Suba o container do Cloudflare Tunnel:
```bash
docker compose --profile cloudflare up -d
```
4. Aponte seu domínio público (ex: `forms.seudominio.com.br`) para `http://app:3004`.

---

## 🧪 Testes Automatizados

O projeto conta com suite de testes com **Vitest** cobrindo validação de formulários, regras de obrigatoriedade, tipos de dados e segurança de exportação CSV (anti-formula injection):

```bash
npm test
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
