# 🔐 Configuração do Login do Estabelecimento

## ✅ Implementado

Novo sistema de autenticação para o estabelecimento usando **Supabase Auth**.

---

## 📋 Fluxo de Autenticação

```
┌─────────────────────────────────────┐
│ 1. Página Inicial (/)               │
│    Botão: "🏪 Sou Estabelecimento"  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Login (/login-estabelecimento)   │
│    - Email                           │
│    - Senha                           │
│    - Link para Cadastro              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Cadastro (/cadastro-estabelecimento)
│    - Nome do Estabelecimento         │
│    - Nome do Responsável             │
│    - Email                           │
│    - Senha (mínimo 6 caracteres)     │
│    - CNPJ (opcional)                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Painel (/estabelecimento)        │
│    - Cria pedidos                    │
│    - Gerencia entregas               │
│    - Gera links de rastreamento      │
└─────────────────────────────────────┘
```

---

## 🗄️ Configuração no Supabase

### 1. Habilitar Authentication

No dashboard do Supabase:

1. Vá em **Authentication** → **Providers**
2. Ative **Email** como provider
3. Configure as opções de email:

```
✅ Enable Email Signup
✅ Enable Email Confirmations (recomendado para produção)
```

### 2. Configurar Template de Email

Em **Authentication** → **Email Templates**:

#### Email de Confirmação
```html
<h2>Confirme seu email</h2>
<p>Obrigado por se cadastrar no App de Entregas!</p>
<p>Para ativar sua conta, clique no link abaixo:</p>
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
<p>Ou use este código: {{ .Token }}</p>
```

### 3. Políticas de Segurança (RLS)

Se quiser proteger dados por usuário:

```sql
-- Exemplo: Apenas o dono do estabelecimento pode ver seus pedidos
CREATE POLICY "Usuário vê seus próprios pedidos"
  ON pedidos FOR SELECT
  USING (
    auth.uid()::text = estabelecimento_id::text
  );
```

---

## 🎯 URLs do Sistema

| Página | URL | Descrição |
|--------|-----|-----------|
| **Login** | `/login-estabelecimento` | Login com email e senha |
| **Cadastro** | `/cadastro-estabelecimento` | Criar nova conta |
| **Painel** | `/estabelecimento` | Painel do estabelecimento (protegido) |
| **Entregador** | `/login` | Login do entregador (telefone) |

---

## 🔒 Segurança

### Senha
- Mínimo de **6 caracteres**
- Validação no frontend e backend
- Hash automático pelo Supabase

### Sessão
- Token JWT armazenado no localStorage
- Sessão persistente (não expira)
- Logout limpa os dados

### Proteção de Rotas
```typescript
// Verifica se usuário está logado
const user = localStorage.getItem('estabelecimento_user');
if (!user) {
  router.push('/login-estabelecimento');
}
```

---

## 📱 Como Usar

### 1. Primeiro Acesso (Cadastro)

1. Acesse `http://localhost:3000`
2. Clique em **"🏪 Sou Estabelecimento"**
3. Clique em **"Cadastre-se"**
4. Preencha os dados:
   - Nome do Estabelecimento
   - Seu Nome
   - Email
   - Senha (mínimo 6 caracteres)
   - CNPJ (opcional)
5. Clique em **"Cadastrar"**
6. Verifique seu email (se confirmação estiver ativa)
7. Faça login com email e senha

### 2. Login

1. Acesse `http://localhost:3000/login-estabelecimento`
2. Digite **Email** e **Senha**
3. Clique em **"Entrar"**
4. Será redirecionado para `/estabelecimento`

### 3. Logout

1. No painel, clique em **"🚪 Sair"** no canto superior direito
2. Será redirecionado para `/login-estabelecimento`

---

## 💾 Armazenamento Local

Dados salvos no localStorage:

```javascript
// Após login bem-sucedido
localStorage.setItem('estabelecimento_user', JSON.stringify({
  id: 'uuid-do-usuario',
  email: 'usuario@email.com',
  token: 'access-token-jwt'
}));
```

---

## 🎨 Interface

### Tela de Login
```
┌─────────────────────────────────┐
│         🏪                      │
│  Painel do Estabelecimento      │
│  Faça login para gerenciar      │
│                                 │
│  📧 Email                       │
│  [____________]                 │
│                                 │
│  🔒 Senha                       │
│  [____________]                 │
│                                 │
│  [    🚀 Entrar    ]            │
│                                 │
│  Não tem conta? Cadastre-se    │
│  [← Voltar]                     │
└─────────────────────────────────┘
```

### Tela de Cadastro
```
┌─────────────────────────────────┐
│         🏪                      │
│  Cadastrar Estabelecimento      │
│                                 │
│  🏪 Nome do Estabelecimento *   │
│  [____________]                 │
│                                 │
│  👤 Seu Nome *                  │
│  [____________]                 │
│                                 │
│  📧 Email *                     │
│  [____________]                 │
│                                 │
│  📄 CNPJ (Opcional)             │
│  [____________]                 │
│                                 │
│  🔒 Senha *                     │
│  [____________]                 │
│                                 │
│  🔒 Confirmar Senha *           │
│  [____________]                 │
│                                 │
│  [    🚀 Cadastrar  ]           │
│                                 │
│  Já tem conta? Fazer Login      │
│  [← Voltar]                     │
└─────────────────────────────────┘
```

---

## 🛠️ Código

### Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password: senha,
});

if (error) throw error;

// Salvar dados
localStorage.setItem('estabelecimento_user', JSON.stringify({
  id: data.user.id,
  email: data.user.email,
  token: data.session?.access_token,
}));
```

### Cadastro
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password: senha,
  options: {
    data: {
      nome: nome,
      nome_estabelecimento: nomeEstabelecimento,
      cnpj: cnpj,
    },
  },
});

if (error) throw error;

// Redirecionar para login
router.push('/login-estabelecimento');
```

### Logout
```typescript
const handleLogout = () => {
  localStorage.removeItem('estabelecimento_user');
  router.push('/login-estabelecimento');
};
```

---

## 📊 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/login-estabelecimento/index.tsx` | Tela de login |
| `src/pages/cadastro-estabelecimento/index.tsx` | Tela de cadastro |
| `src/pages/estabelecimento/index.tsx` | Painel (protegido) |
| `src/app/page.tsx` | Home (atualizada) |

---

## ✅ Testes

### Testar Cadastro
```bash
# 1. Rodar o servidor
npm run dev

# 2. Acessar
http://localhost:3000

# 3. Clicar em "Sou Estabelecimento"
# 4. Clicar em "Cadastre-se"
# 5. Preencher formulário
# 6. Verificar email (se habilitado)
# 7. Fazer login
```

### Testar Login
```bash
# 1. Acessar
http://localhost:3000/login-estabelecimento

# 2. Digitar email e senha
# 3. Clicar em "Entrar"
# 4. Verificar se redireciona para /estabelecimento
```

### Testar Logout
```bash
# 1. No painel do estabelecimento
# 2. Clicar em "🚪 Sair"
# 3. Verificar se redireciona para /login-estabelecimento
```

---

## 🚨 Tratamento de Erros

| Erro | Mensagem | Solução |
|------|----------|---------|
| `Invalid login credentials` | Email ou senha inválidos | Verificar credenciais |
| `Email not confirmed` | Email não confirmado | Verificar caixa de entrada |
| `User already registered` | Email já cadastrado | Fazer login ou recuperar senha |
| `Invalid email` | Email inválido | Corrigir formato do email |

---

## 🔐 Recuperação de Senha (Opcional)

Para implementar recuperação de senha:

```typescript
// Enviar email de recuperação
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'http://localhost:3000/reset-senha',
});
```

---

## 📝 Próximos Passos

- [ ] Implementar recuperação de senha
- [ ] Adicionar confirmação de email obrigatória
- [ ] Criar página de perfil do estabelecimento
- [ ] Adicionar upload de logo
- [ ] Implementar 2FA (autenticação de dois fatores)

---

**Feito com ❤️ usando Supabase Auth!**
