# 🎨 Guia de Implementação do Design Figma

Este guia explica como extrair e implementar elementos de design do Figma no TreinosApp.

## 📋 Como Extrair Informações do Figma

### 1. **Acessar o Design System**
- Abra o arquivo Figma do projeto
- Procure por páginas como "Design System", "Styles", "Components"
- Identifique elementos como: cores, tipografia, espaçamentos, componentes

### 2. **Extrair Cores**
```figma
1. Selecione um elemento colorido
2. No painel direito, clique na cor em "Fill"
3. Copie o código HEX (ex: #FF6B35)
4. Anote: nome da cor, hex code, uso (primária, secundária, etc.)
```

### 3. **Extrair Tipografia**
```figma
1. Selecione um texto
2. Veja propriedades: font-family, font-size, font-weight, line-height
3. Anote os diferentes estilos: heading, body, caption, etc.
```

### 4. **Extrair Espaçamentos**
```figma
1. Selecione um elemento
2. Veja padding/margin no painel direito
3. Use a tecla Alt/Option para ver distâncias entre elementos
4. Anote padrões: 4px, 8px, 16px, 24px, 32px
```

### 5. **Extrair Componentes**
```figma
1. Identifique componentes reutilizáveis (botões, cards, inputs)
2. Documente variações: primary/secondary, large/small
3. Anote estados: normal, hover, pressed, disabled
```

## 🛠️ Implementação no React Native

### **Estrutura de Arquivos Criada:**

```
/constants/
  ├── designTokens.ts    # Tokens de design (cores, espaçamentos, etc.)
  └── theme.ts          # Tema do React Native Paper

/components/
  ├── FitnessCard.tsx    # Cards reutilizáveis
  ├── FitnessButton.tsx  # Botões com variações
  └── StatsCard.tsx      # Cards de estatísticas
```

### **Design Tokens Implementados:**

```typescript
// Cores baseadas em fitness apps
colors: {
  primary: '#FF6B35',        // Laranja energético
  secondary: '#2E86AB',      // Azul confiável
  success: '#27AE60',        // Verde de sucesso
  warning: '#F39C12',        // Amarelo de alerta
  error: '#E74C3C',          // Vermelho de erro
}

// Espaçamentos consistentes
spacing: {
  xs: 4,   sm: 8,   md: 16,
  lg: 24,  xl: 32,  '2xl': 48
}

// Tipografia responsiva
typography: {
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20 }
}
```

## 📱 Componentes Implementados

### **1. FitnessCard**
Card reutilizável com variações:
- `default`: Card padrão
- `featured`: Card destacado com cor primária
- `stats`: Card para estatísticas

```tsx
<FitnessCard variant="featured" title="Treino do Dia">
  {/* Conteúdo */}
</FitnessCard>
```

### **2. FitnessButton**
Botão com múltiplas variações:
- `primary`, `secondary`, `outline`, `text`
- Tamanhos: `small`, `medium`, `large`
- Suporte a ícones e loading

```tsx
<FitnessButton 
  title="Começar Treino"
  variant="primary"
  size="large"
  icon="play"
  fullWidth
/>
```

### **3. StatsCard**
Card especializado para estatísticas:
- Ícone customizável
- Indicadores de tendência (up/down)
- Valores e labels

```tsx
<StatsCard
  icon="flame"
  value="5"
  label="Treinos"
  trend="up"
  trendValue="+2"
/>
```

## 🎯 Como Personalizar com seu Figma

### **Passo 1: Extrair Cores**
1. Abra seu arquivo Figma
2. Identifique a paleta de cores
3. Substitua em `designTokens.ts`:

```typescript
colors: {
  primary: '#SUA_COR_PRIMARIA',
  secondary: '#SUA_COR_SECUNDARIA',
  // ... outras cores
}
```

### **Passo 2: Atualizar Tipografia**
1. Identifique font-family, sizes, weights no Figma
2. Atualize em `designTokens.ts`:

```typescript
typography: {
  fontSize: {
    xs: 12,    // Caption/Small text
    sm: 14,    // Body small
    base: 16,  // Body regular
    lg: 18,    // Subtitle
    xl: 20,    // Title
    '2xl': 24, // Heading
  }
}
```

### **Passo 3: Ajustar Espaçamentos**
1. Meça distâncias no Figma
2. Crie sistema de espaçamento:

```typescript
spacing: {
  xs: 4,     // Pequenos gaps
  sm: 8,     // Espaçamento mínimo
  md: 16,    // Padrão
  lg: 24,    // Seções
  xl: 32,    // Grandes espaçamentos
}
```

### **Passo 4: Implementar Componentes**
1. Identifique padrões repetitivos no Figma
2. Crie componentes correspondentes
3. Use os design tokens para consistência

## 🚀 Exemplo Prático

**Do Figma:**
- Card com fundo laranja (#FF6B35)
- Texto branco
- Border radius 12px
- Shadow suave

**Para React Native:**
```tsx
// Em designTokens.ts
colors: { primary: '#FF6B35' }
borderRadius: { lg: 12 }

// No componente
<FitnessCard 
  variant="featured" 
  style={{ 
    backgroundColor: DesignTokens.colors.primary,
    borderRadius: DesignTokens.borderRadius.lg 
  }}
>
  <Text style={{ color: DesignTokens.colors.onPrimary }}>
    Conteúdo
  </Text>
</FitnessCard>
```

## 📐 Boas Práticas

### **Consistência**
- Use apenas valores dos design tokens
- Evite valores hardcoded no código
- Mantenha proporções do Figma

### **Responsividade**
- Teste em diferentes tamanhos de tela
- Ajuste espaçamentos proporcionalmente
- Use flexbox para layouts adaptativos

### **Performance**
- Otimize imagens e ícones
- Use StyleSheet.create() para estilos
- Evite inline styles quando possível

### **Manutenibilidade**
- Documente variações de componentes
- Use TypeScript para type safety
- Mantenha design tokens centralizados

## 🔄 Fluxo de Trabalho

1. **Designer** atualiza Figma → 
2. **Developer** extrai novos tokens → 
3. **Atualiza** `designTokens.ts` → 
4. **Componentes** herdam automaticamente → 
5. **App** reflete mudanças

Este sistema garante que o app mantenha consistência visual e facilita atualizações de design!