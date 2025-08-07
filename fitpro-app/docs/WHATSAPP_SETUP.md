# Configuração do WhatsApp Business API

Este documento explica como configurar o envio de mensagens via WhatsApp para novos alunos.

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Configurações do WhatsApp Business API
WHATSAPP_API_KEY=your_whatsapp_api_key_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Opções de Integração

### 1. WhatsApp Business API (Meta/Facebook)

**Vantagens:**
- Oficial da Meta
- Templates pré-aprovados
- Alta confiabilidade

**Configuração:**
1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um app
3. Configure o WhatsApp Business API
4. Obtenha as credenciais necessárias

### 2. Twilio WhatsApp

**Vantagens:**
- Fácil integração
- Documentação excelente
- Suporte em português

**Configuração:**
1. Crie uma conta no [Twilio](https://www.twilio.com/)
2. Ative o WhatsApp Sandbox
3. Obtenha as credenciais

### 3. 360dialog

**Vantagens:**
- Especializado em WhatsApp
- Suporte dedicado
- Templates avançados

### 4. MessageBird

**Vantagens:**
- API simples
- Boa documentação
- Preços competitivos

## Implementação Atual

O sistema está configurado para usar a **WhatsApp Business API** da Meta/Facebook.

### Estrutura do Serviço

```typescript
// src/lib/whatsapp-service.ts
export class WhatsAppService {
  // Envia mensagem de texto
  async sendTextMessage(phone: string, message: string)
  
  // Envia template
  async sendTemplateMessage(phone: string, templateName: string)
  
  // Envia credenciais de login
  async sendLoginCredentials(name: string, email: string, password: string, phone: string)
}
```

### Mensagem de Login

A mensagem enviada para novos alunos inclui:

- Saudação personalizada
- Credenciais de acesso (email e senha)
- Link para login
- Instruções de segurança
- Informações de contato

### Formato da Mensagem

```
Olá [Nome]! 

Seu acesso ao sistema da academia foi criado com sucesso!

📱 **Credenciais de Login:**
• Email: [email]
• Senha: [senha_gerada]

🔗 **Link de acesso:** [url_da_aplicacao]/login

⚠️ **Importante:** 
- Altere sua senha no primeiro acesso
- Mantenha suas credenciais seguras
- Em caso de dúvidas, entre em contato conosco

Bem-vindo(a) à nossa academia! 💪
```

## Teste da Integração

### 1. Teste de Conexão

```typescript
import { whatsAppService } from '@/lib/whatsapp-service';

// Testa se a configuração está correta
const isConfigured = whatsAppService.isConfigured();
console.log('WhatsApp configurado:', isConfigured);

// Testa a conexão com a API
const isConnected = await whatsAppService.testConnection();
console.log('Conexão OK:', isConnected);
```

### 2. Teste de Envio

```typescript
import { sendLoginCredentials } from '@/lib/whatsapp-service';

// Envia credenciais de teste
await sendLoginCredentials(
  'João Silva',
  'joao@email.com',
  'senha123',
  '(11) 99999-9999'
);
```

## Fallback para Desenvolvimento

Se as variáveis de ambiente não estiverem configuradas, o sistema usa um **mock** que apenas loga as mensagens no console:

```typescript
// Mock para desenvolvimento
console.log(`[MOCK] Enviando WhatsApp para ${phone}: ${message}`);
```

## Segurança

### Boas Práticas

1. **Nunca** commite as credenciais no repositório
2. Use variáveis de ambiente para todas as credenciais
3. Implemente rate limiting para evitar spam
4. Valide números de telefone antes do envio
5. Implemente logs para auditoria

### Validação de Telefone

O sistema valida o formato brasileiro: `(11) 99999-9999`

```typescript
const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
```

## Troubleshooting

### Erro: "WhatsApp API error: 401"

- Verifique se o `WHATSAPP_ACCESS_TOKEN` está correto
- Confirme se o token não expirou

### Erro: "WhatsApp API error: 400"

- Verifique o formato do número de telefone
- Confirme se o `WHATSAPP_PHONE_NUMBER_ID` está correto

### Erro: "WhatsApp API error: 403"

- Verifique as permissões do app no Facebook Developer
- Confirme se o WhatsApp Business API está ativo

### Mensagens não chegam

1. Verifique se o número está no formato correto
2. Confirme se o número tem WhatsApp
3. Verifique os logs do console
4. Teste com um número conhecido

## Próximos Passos

1. **Configurar credenciais reais** do WhatsApp Business API
2. **Implementar templates** para mensagens mais profissionais
3. **Adicionar webhooks** para receber confirmações de entrega
4. **Implementar retry logic** para mensagens que falham
5. **Adicionar analytics** para acompanhar taxa de entrega 