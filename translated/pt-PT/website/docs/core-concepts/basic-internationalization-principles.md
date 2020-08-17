---
id: basic-internationalization-principles
title: Princípios Básicos de Internacionalização
---

## O que é a internacionalização e por que é que isso importa?

Um programa internacionalizado suporta os idiomas e os costumes culturais das pessoas em todo o mundo. A Web chega a todas as partes do mundo. Aplicações web internacionalizadas fornecem uma ótima experiência de utilizador para as pessoas em qualquer lugar.

Um programa localizado adapta-se a um idioma e uma cultura específicos traduzindo o texto para o idioma do utilizador e formatando os dados de acordo com as expetativas do utilizador. Uma aplicação normalmente é localizada para um pequeno conjunto de idiomas.

A [especificação de internacionalização do ECMA-402 JavaScript](https://github.com/tc39/ecma402) possui uma excelente visão geral.

## Locais: Idioma e Região

Um "local" refere-se às expetativas linguísticas e culturais de uma região. É representado usando um "código local" definido em [ UTS LDML](https://www.unicode.org/reports/tr35/tr35.html#Identifiers).

Este código é composto por várias partes separadas por hífens (-). A primeira parte é uma cadeia curta que representa o idioma. A segunda parte, opcional, é uma cadeia curta que representa a região. Além disso, várias extensões e variantes podem ser especificadas.

Normalmente, aplicações web são localizadas para apenas o idioma ou uma combinação de idioma e região. Exemplos de tais códigos de locais são:

- `en` para Inglês
- `en-US` para o Inglês falado nos Estados Unidos
- `en-GB` para o Inglês falado no Reino Unido
- `es-AR` para o Espanhol falado na Argentina
- `ar-001` para o Árabe falado pelo mundo
- `ar-AE` para o Árabe falado nos Emirados Árabes

A maior parte das aplicações internacionalizadas suportam apenas uma pequena lista de locais.

## Traduzindo Cadeias

Você provavelmente tem algum texto na sua aplicação que está no idioma nativo como o Inglês ou Japonês. A fim de oferecer suporte para outros locais, você precisa de traduzir essas cadeias.

FormatJS fornece um mecanismo que permite-lhe que escreva o programa da sua aplicação sem nenhum código especial para diferentes traduções. As considerações para cada local são encapsuladas nas suas cadeias e nas nossas bibliotecas.

```tsx
const messages = {
  en: {
    GREETING: 'Hello {name}',
  },
  fr: {
    GREETING: 'Bonjour {name}',
  },
}
```

Nós usamos a [ICU Message syntax](http://userguide.icu-project.org/formatparse/messages) no qual também é usada em [Java](http://docs.oracle.com/javase/7/docs/api/java/text/MessageFormat.html), C, PHP e várias outras linguagens.

## Agrupar Cadeias Traduzidas

È comum organizar as suas traduções principalmente por local, porque só precisa das traduções para o local atual do utilizador. As nossas integrações de modelos e bibliotecas de componentes são projetadas para trabalhar as traduções para um único local. Se a sua aplicação é complexa, pode dividir as traduções, por exemplo por página ou por secção do sítio.

## Estrutura do Código

A formatação real e apresentação dos dados e das cadeias traduzidas normalmente levam estes passos:

1. Determinar o local do utilizador, conforme descrito no guia de Runtime Environments.
2. Configurar uma das integrações FormatJS com os seguintes dados:
   - o local atual do utilizador
   - cadeias traduzidas para esse local
   - opcionalmente, quaisquer formatos personalizados
3. Chamar o motor de modelo, passando os dados que precisam de formatação.
