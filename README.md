# Contador de Tokens para Claude Code

Mostra, logo acima do campo de mensagem do Claude Code, quanto ainda resta da
memória da conversa e dos seus limites de uso, em baterias no estilo do iPhone.

| Bateria | O que mostra |
| --- | --- |
| **Tokens** | Quanto resta da janela de contexto da conversa |
| **Limites: 5h** | Quanto resta do limite de 5 horas |
| **Limites: 7d** | Quanto resta do limite semanal |

O número dentro da bateria é a porcentagem **restante**. A bateria fica vermelha
quando resta 20% ou menos. Os limites só aparecem em contas com assinatura e
depois da primeira resposta da sessão.

## Instalação

### Pelo GitHub (recomendado)

**No app para desktop, aba Code:** clique no **+** ao lado do campo de mensagem,
depois em **Plugins** e **Add marketplace**, informe
`gabrielj2424/contador-tokens` e clique em **Add plugin**.

**Em uma sessão no terminal:**

```
/plugin install contador-tokens --marketplace gabrielj2424/contador-tokens
```

Responda `y` para adicionar o marketplace e escolha o escopo de usuário.

**Direto no shell:**

```bash
claude plugin install contador-tokens --marketplace gabrielj2424/contador-tokens
```

### Pelo arquivo .zip

Você precisa do Claude Code com o comando `claude` disponível no terminal.

1. Descompacte o arquivo e coloque a pasta `contador-tokens` em um lugar
   definitivo. **Não apague nem mova a pasta depois de instalar**, porque o
   Claude Code lê o mod direto dela.
2. No terminal, troque o caminho abaixo pelo da pasta e rode os dois comandos:

   ```bash
   claude plugin marketplace add "/caminho/para/contador-tokens"
   ```

   ```bash
   claude plugin install contador-tokens@contador-tokens-marketplace
   ```

3. Abra uma nova sessão do Claude Code. A faixa aparece depois da primeira
   resposta, no terminal e na aba Code do app para desktop.

## Desinstalação

```bash
claude plugin uninstall contador-tokens@contador-tokens-marketplace
```

## Privacidade

O mod usa somente os números que o próprio Claude Code já tem. Não faz nenhuma
requisição de rede e não envia dados para lugar nenhum.

## Créditos

Inspirado na extensão de navegador
Claude Counter (MIT). Este projeto não é afiliado à
Anthropic. Licença MIT.
