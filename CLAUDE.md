# CLAUDE.md

## Projeto

Este projeto se chama ProduzFácil CMV.

É um app web para controlar o custo real das produções de cozinha, considerando peso cru, perdas, rendimento, ingredientes usados, fornecedores e custo final por porção.

## Tecnologias

- React
- Vite
- JavaScript
- Supabase
- Supabase Auth
- Supabase Postgres
- Recharts para gráficos

## Perfil do usuário

O usuário é iniciante em programação. Explique tudo de forma simples, passo a passo, sem presumir conhecimento técnico avançado.

## Regra principal

Este app não é uma calculadora solta. Ele deve funcionar como um sistema operacional de cozinha e dashboard administrativo.

## Área da cozinha

A área da cozinha deve ser simples, visual, responsiva e gamificada.

O operador deve:
- fazer login
- escolher o produto produzido
- escolher fornecedor ou marca
- informar peso cru usado
- informar peso após limpeza/aparas
- informar peso final pronto
- informar quantidades dos ingredientes usados
- salvar a produção

O operador não deve alterar custos, cadastros administrativos ou configurações do sistema.

## Área administrativa

O administrativo deve:
- cadastrar produtos produzidos
- cadastrar insumos
- cadastrar fornecedores
- definir preços dos insumos
- definir ingredientes padrão por produto
- definir porção padrão em gramas
- definir meta de rendimento
- visualizar dashboard
- acompanhar histórico de produções
- comparar fornecedores e marcas

## Cálculos principais

O sistema deve calcular:

- perda na limpeza = peso cru - peso após limpeza
- perda no preparo = peso após limpeza - peso final pronto
- perda total = peso cru - peso final pronto
- percentual de perda = perda total / peso cru * 100
- rendimento final = peso final pronto / peso cru * 100
- custo total da produção = custo matéria-prima + custo ingredientes usados
- custo por kg pronto = custo total / peso final pronto
- custo por grama = custo por kg pronto / 1000
- custo da porção = custo por grama * porção padrão em gramas

## Micro SaaS

O projeto deve nascer preparado para virar micro SaaS.

Sempre considerar:
- múltiplas empresas
- empresa_id nas tabelas principais
- perfis de usuário
- separação de dados por empresa
- Supabase Auth
- RLS no Supabase

## Regras de trabalho

- Não apagar funcionalidades existentes sem avisar.
- Antes de mudanças grandes, explicar o plano.
- Ao final, informar quais arquivos foram criados ou alterados.
- Não colocar chaves reais do Supabase no código.
- Usar .env.example para variáveis de ambiente.
- Manter o código organizado e comentado quando necessário.
- Priorizar versão funcional antes de sofisticação visual.
