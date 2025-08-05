# 🎨 Guia Rápido - Integração Figma

## Seu arquivo Figma
ID: `m11UGB7QwoBENPkQyJQMsPX2sKxb6zmd6QkxfQCm`

## 1️⃣ Configurar Token de Acesso

1. Acesse: https://www.figma.com/settings
2. Vá em "Personal Access Tokens"
3. Clique em "Create new token"
4. Dê um nome (ex: "TreinosApp")
5. Copie o token gerado

## 2️⃣ Adicionar Token ao Projeto

Crie um arquivo `.env` na raiz do projeto:
```bash
FIGMA_ACCESS_TOKEN=seu_token_aqui
```

## 3️⃣ Buscar Design do Figma

Execute o comando:
```bash
npm run figma:fetch
```

Isso vai:
- Conectar ao seu arquivo Figma
- Extrair cores, tipografia e componentes
- Salvar em `constants/figmaTokens.json`

## 4️⃣ Usar os Tokens no App

```javascript
// Importar tokens do Figma
import figmaTokens from '../constants/figmaTokens.json';

// Usar cores
const styles = {
  container: {
    backgroundColor: figmaTokens.colors.primary || '#FF6B35',
  }
};

// Usar tipografia
const textStyles = {
  title: {
    ...figmaTokens.typography['heading-large'],
    color: figmaTokens.colors.textPrimary,
  }
};
```

## 5️⃣ Sincronizar Mudanças

Quando o design mudar no Figma:
```bash
npm run figma:sync
```

## 📱 Visualizar seu Design

Para ver o design no navegador:
https://www.figma.com/file/m11UGB7QwoBENPkQyJQMsPX2sKxb6zmd6QkxfQCm/

## 🛠️ Comandos Disponíveis

- `npm run figma:fetch` - Busca dados do Figma
- `npm run figma:sync` - Busca e atualiza tokens

## ⚠️ Importante

- Nunca commite o arquivo `.env` (já está no .gitignore)
- O token do Figma é pessoal, não compartilhe
- Execute `figma:sync` regularmente para manter sincronizado

## 🎯 Próximos Passos

1. Configure o token
2. Execute `npm run figma:fetch`
3. Verifique `constants/figmaTokens.json`
4. Comece a usar os tokens nos componentes

---

Precisa de ajuda? Verifique o guia completo em `docs/FIGMA_INTEGRATION_GUIDE.md`