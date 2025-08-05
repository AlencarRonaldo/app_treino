# Guia de Integração Figma → TreinosApp

## 1. Configuração Inicial

### Obter Token de Acesso do Figma
1. Acesse: https://www.figma.com/settings
2. Vá em "Personal Access Tokens"
3. Crie um novo token
4. Salve em `.env`: `FIGMA_ACCESS_TOKEN=seu_token_aqui`

### Instalar Dependências
```bash
# Para conversão automática
npm install --save-dev figma-api

# Para ícones SVG
npm install react-native-svg
npm install --save-dev react-native-svg-transformer
```

## 2. Exportar do Figma

### Design Tokens (Manual)
1. No Figma, selecione o frame com cores/estilos
2. Use o plugin "Design Tokens" ou "Figma Tokens"
3. Exporte como JSON
4. Coloque em `/constants/figmaTokens.json`

### Componentes
1. Selecione o componente no Figma
2. Copie os valores:
   - Colors: #FF6B35
   - Spacing: 8, 16, 24, 32
   - Border Radius: 8px
   - Font Size: 16px
   - Line Height: 24px

### Assets
- **Ícones**: Export como SVG
- **Imagens**: Export em 1x, 2x, 3x
- **Logos**: Export como PNG com fundo transparente

## 3. Converter para React Native

### Exemplo: Card do Figma
```javascript
// Valores do Figma
const figmaCard = {
  width: 343,
  height: 120,
  borderRadius: 12,
  padding: 16,
  backgroundColor: '#FFFFFF',
  shadow: {
    x: 0,
    y: 2,
    blur: 8,
    color: '#000000',
    opacity: 0.1
  }
};

// Converter para React Native
import { figmaToRN } from '../utils/figmaImport';

const styles = StyleSheet.create({
  card: {
    width: figmaCard.width,
    height: figmaCard.height,
    borderRadius: figmaToRN.borderRadius(figmaCard.borderRadius),
    padding: figmaCard.padding,
    backgroundColor: figmaCard.backgroundColor,
    ...figmaToRN.shadow(figmaCard.shadow),
  }
});
```

## 4. Workflow Recomendado

### Para Novos Componentes
1. Designer cria no Figma
2. Exporta especificações
3. Dev implementa usando `figmaImport.ts`
4. Valida com `validateFigmaTokens()`

### Para Atualizações
1. Designer atualiza Figma
2. Exporta apenas valores alterados
3. Dev atualiza `designTokens.ts`
4. Testa em diferentes dispositivos

## 5. Ferramentas Úteis

### Plugins Figma Recomendados
- **Figma to React Native**: Gera código básico
- **Design Tokens**: Exporta tokens
- **Figma Icons**: Organiza ícones para export

### VS Code Extensions
- **Figma for VS Code**: Preview designs no editor
- **SVG to React Native**: Converte SVGs

## 6. Exemplo Prático

### Importar Botão do Figma
```javascript
// 1. Copiar specs do Figma
const figmaButton = {
  height: 48,
  borderRadius: 24,
  paddingHorizontal: 24,
  backgroundColor: '#FF6B35',
  fontSize: 16,
  fontWeight: '600',
  textColor: '#FFFFFF'
};

// 2. Criar componente
import { figmaToRN } from '../utils/figmaImport';

const FigmaButton = ({ title, onPress }) => {
  const styles = StyleSheet.create({
    button: {
      height: figmaButton.height,
      borderRadius: figmaToRN.borderRadius(figmaButton.borderRadius),
      paddingHorizontal: figmaButton.paddingHorizontal,
      backgroundColor: figmaButton.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: figmaButton.fontSize,
      fontWeight: figmaButton.fontWeight,
      color: figmaButton.textColor,
    }
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};
```

## 7. Manter Sincronia

### Checklist Semanal
- [ ] Verificar atualizações no Figma
- [ ] Exportar novos assets
- [ ] Atualizar design tokens
- [ ] Testar em iOS e Android
- [ ] Documentar mudanças

### Boas Práticas
1. Sempre use design tokens ao invés de valores hardcoded
2. Mantenha nomenclatura consistente Figma ↔ Código
3. Documente decisões de adaptação (ex: sombras Android)
4. Teste em dispositivos reais, não só simuladores

## 8. Troubleshooting

### Sombras não aparecem no Android
```javascript
// Adicione elevation
shadow: {
  ...figmaToRN.shadow(figmaShadow),
  elevation: 5, // Para Android
}
```

### Cores diferentes do Figma
```javascript
// Verifique o formato
color: Platform.select({
  ios: 'rgba(0,0,0,0.1)',
  android: '#00000019', // Hex com alpha
})
```

### Fontes não carregam
1. Exporte do Figma as fontes usadas
2. Adicione em `/assets/fonts/`
3. Configure no `app.json`:
```json
{
  "expo": {
    "fonts": {
      "Inter-Regular": "./assets/fonts/Inter-Regular.ttf",
      "Inter-Bold": "./assets/fonts/Inter-Bold.ttf"
    }
  }
}
```