# Orquestrar Desenvolvimento TreinosApp

Execute o desenvolvimento orquestrado do TreinosApp com Context7 e Task Master.

## Parâmetros

- `$ARGUMENTS`: Tarefa específica ou 'all' para execução completa

## Fluxo de Execução

1. **Inicialização**
   - Ativar Context7 para consultas de documentação
   - Sincronizar status com Task Master
   - Carregar configuração Claude Flow

2. **Análise de Dependencies**
   - Verificar tasks desbloqueadas
   - Identificar próximas ações prioritárias  
   - Consultar Context7 para padrões técnicos

3. **Execução Coordenada**
   - Aplicar flags SuperClaude (`--c7 --seq --delegate`)
   - Executar com agente especializado apropriado
   - Atualizar progresso em tempo real

4. **Validação e Qualidade**
   - Executar quality gates automáticos
   - Validar implementação com Context7 patterns
   - Atualizar Task Master com resultados

## Exemplo de Uso

```bash
/orchestrate priority_1  # Executa sistema de autenticação
/orchestrate priority_2  # Executa integração ExerciseDB  
/orchestrate all        # Execução completa coordenada
```

## Flags Automáticos

- `--c7`: Context7 para documentação das libraries
- `--seq`: Análise sequencial para problemas complexos
- `--delegate`: Sub-agents para processamento paralelo
- `--loop`: Refinamento iterativo quando necessário