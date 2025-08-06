# 🎨 Ajuda - Integração com Figma

## ❌ Problema Encontrado
O arquivo Figma não foi encontrado. Precisamos das informações corretas.

## 📝 O que você precisa fornecer:

### 1. **Token de Acesso Pessoal** (Personal Access Token)
- Acesse: https://www.figma.com/settings
- Vá em "Personal access tokens"
- Clique em "Create new token"
- O token terá este formato: `figd_XXXXXXXXXXXXXXXXXXXXXXXXXX`

### 2. **ID ou URL do Arquivo Figma**
O ID do arquivo está na URL quando você abre o arquivo no Figma:

```
https://www.figma.com/file/[FILE_ID]/Nome-do-Arquivo
                           ^^^^^^^^
                           Este é o ID que precisamos
```

**Exemplo:**
- URL: `https://www.figma.com/file/abc123XYZ/TreinosApp-Design`
- ID: `abc123XYZ`

## 🔍 Como encontrar o ID correto:

1. Abra seu arquivo no Figma
2. Copie a URL completa da barra de endereços
3. O ID está entre `/file/` e o próximo `/`

## 📋 Formato correto no .env:

```bash
# Token de acesso (começa com figd_)
FIGMA_ACCESS_TOKEN=your_figma_token_here

# ID do arquivo (da URL do Figma)
FIGMA_FILE_ID=abc123XYZ
```

## 🤔 O que você forneceu:

Você forneceu: `[EXEMPLO_TOKEN_AQUI]`

Isso parece ser um token, não um ID de arquivo.

## ✅ Próximos passos:

1. **Se você tem a URL do arquivo Figma**, me envie ela completa
2. **Se você só tem o token**, precisamos também do link do arquivo
3. **Se este é o ID do arquivo**, pode ser que:
   - O arquivo seja privado e precise de permissões
   - O token não tenha acesso a este arquivo
   - O ID esteja incorreto

## 💡 Exemplo de como deve ficar:

```bash
# .env
FIGMA_ACCESS_TOKEN=your_figma_token_here  # Seu token pessoal
FIGMA_FILE_ID=XYZ789abc            # ID do arquivo (da URL)
```

Por favor, forneça:
1. A URL completa do seu arquivo Figma
2. Confirme se o token tem acesso ao arquivo