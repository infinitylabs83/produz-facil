# ProduzFácil CMV

Sistema de controle de custo de produção para cozinhas profissionais.

## Como rodar o projeto

### 1. Instalar as dependências

```bash
npm install
```

### 2. Configurar as variáveis de ambiente

Copie o arquivo `.env.example` e crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Abra o `.env` e preencha com suas chaves do Supabase:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA
```

Você encontra essas chaves em: Supabase → seu projeto → Settings → API.

### 3. Criar o banco de dados

No Supabase, acesse **SQL Editor** e execute o conteúdo do arquivo:

```
supabase/schema.sql
```

Isso criará todas as tabelas, políticas de segurança e triggers necessários.

### 4. Criar um usuário de teste

No Supabase → Authentication → Users → Add user, crie um usuário com e-mail e senha.

Depois, no SQL Editor, defina o perfil dele:

```sql
-- Substitua o UUID pelo ID do usuário criado
-- e o UUID da empresa pela sua empresa

insert into empresas (nome) values ('Minha Cozinha');

update usuarios
set perfil = 'gestor', empresa_id = 'UUID_DA_EMPRESA'
where id = 'UUID_DO_USUARIO';
```

### 5. Rodar o app

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## Perfis de usuário

| Perfil | Acesso |
|---|---|
| `operador` | Somente tela de Nova Produção |
| `administrativo` | Nova Produção + Dashboard + Cadastros |
| `gestor` | Tudo acima + gerenciamento de usuários |

## Estrutura do projeto

```
src/
  lib/supabase.js        ← conexão com o Supabase
  hooks/useAuth.js       ← controle de sessão e perfil
  components/
    Layout.jsx           ← menu e estrutura de página
    MetricCard.jsx       ← card de métrica reutilizável
  pages/
    Login.jsx            ← tela de login
    KitchenProduction.jsx ← fluxo wizard da cozinha
    AdminDashboard.jsx   ← dashboard com gráficos
    AdminCadastros.jsx   ← cadastros administrativos
supabase/
  schema.sql             ← estrutura completa do banco
```
