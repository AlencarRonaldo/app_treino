# 🎨 Guia - Arquivo Figma da Comunidade

## 📁 Seu arquivo
URL: https://www.figma.com/community/file/1367105158760267911

Este é um arquivo da **Comunidade Figma**, que funciona diferente de arquivos privados.

## 🔄 Como usar arquivos da comunidade:

### 1. **Duplicar para sua conta**
1. Abra o link: https://www.figma.com/community/file/1367105158760267911
2. Clique no botão **"Duplicate"** ou **"Duplicar"**
3. O arquivo será copiado para sua conta Figma
4. A nova URL será algo como: `https://www.figma.com/file/NOVO_ID/Nome-do-Arquivo`

### 2. **Pegar o novo ID**
Após duplicar, copie o novo ID da URL:
```
https://www.figma.com/file/[NOVO_ID]/Nome
                           ^^^^^^^^^
                           Este é o novo ID
```

### 3. **Atualizar o .env**
```bash
FIGMA_ACCESS_TOKEN=your_figma_token_here
FIGMA_FILE_ID=NOVO_ID_AQUI
```

## 🚀 Alternativa Rápida

Se você não quiser duplicar, posso:
1. Criar um design system baseado em apps de fitness populares
2. Usar os design tokens que já temos configurados
3. Adaptar componentes de UI comuns para fitness

## 📱 Design Tokens Prontos

Já temos um sistema de design configurado em `constants/designTokens.ts`:
- **Cores**: Laranja vibrante (energia) + Azul (confiança)
- **Tipografia**: Sistema completo de tamanhos
- **Espaçamento**: Grid consistente
- **Componentes**: Cards, botões, inputs fitness-focused

## 💡 Recomendação

1. **Se quiser usar o arquivo da comunidade**: Duplique e me envie o novo ID
2. **Se quiser começar rápido**: Use os design tokens que já configurei
3. **Se tiver outro arquivo Figma**: Me envie o link

O que prefere fazer?