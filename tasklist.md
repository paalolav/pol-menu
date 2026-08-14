# Tasklist — tryggleik og opprydding

Status: kodearbeidet er ferdig og pusha. **Utrulling og testing i tenant står att** — sjå
sjekklista nedst; det er der arbeidet held fram.

Sesjon 2026-08-12, sist stadfesta 2026-08-14 (ingen endring: `main` = `origin/main` på `5d6d085`,
Dependabot 2 opne, begge moderate og dev-only, `npm audit --omit=dev` = 0).
Plan: `~/.claude/plans/fluffy-spinning-dolphin.md`.

## Gjort

| # | Oppgåve | Resultat |
|---|---------|----------|
| 1 | `requiresCustomScript: true` | Web parten er gated til site-samlingar der custom script er på |
| 2 | `components/htmlSource.ts` (ny) | Kjeldevalidering + DOMPurify-sanitering |
| 3 | `PolMenu.tsx` livssyklus | `componentDidUpdate`, `AbortController`, `response.ok`, feilmelding i UI |
| 4 | `allowedHosts`-property | Nytt felt med `onGetErrorMessage`-validering, `dataVersion` 1.1 |
| 5 | Daudkode fjerna | Ubrukte props, `onInit`, `_getEnvironmentMessage`, daude SCSS-klasser, `@fluentui/react` |
| 6 | SPFx 1.20.0 → 1.23.2 | TypeScript 5.8, Node 22 |
| 7 | Gulp → **Heft** | Heile den sårbare byggekjeda fjerna |

Utover planen: redirect-omgåing tetta (`assertAllowedResponseOrigin`) — ein same-origin URL som
redirecta ut av tenanten slapp forbi allow-lista, sidan valideringa berre såg adressa før redirect.

## Målt effekt

| Byggeveg | Totalt | Kritiske | Høge |
|---|---|---|---|
| Opphavleg repo (SPFx 1.20 + rush-stack-compiler-4.7) | 131 | 7 | 36 |
| Første forsøk (SPFx 1.23.2 + gulp) | 75 | 2 | 26 |
| **No (SPFx 1.23.2 + heft)** | **9** | **0** | **0** |

`npm audit --omit=dev`: **0**. Dei 9 som står att er alle moderate og kjem frå
`webpack-dev-server`-stacken til den lokale serve-kommandoen. Ingen av dei har runtime-scope.

Stadfesta mot Dependabot etter push (ikkje berre `npm audit` lokalt):

| Dependabot | Før | Etter gulp-commiten | No |
|---|---|---|---|
| Opne varsel | 32 | 32 (26 av dei nye) | **2** |
| Kritiske | 1 | 1 | **0** |
| Høge | 10 | 7 nye | **0** |
| Runtime-scope | 0 | 0 | **0** |

66 varsel vart automatisk lukka. Dei to som står att er moderate og dev-only (`qs`, `uuid`).

### Rettelse frå første runde

Første forsøk valde gulp-vegen fordi repoet allereie brukte gulp. Det var feil: SPFx 1.23.2 har to
offisielle byggevegar (`useHeft` og `useGulp` i generatorens `lib/common/dependencies.json`), og
**heft er standarden** — generatoren lagar ikkje lenger nokon `gulpfile.js`.

Gulp-vegen drog inn `rush-stack-compiler-5.3` (v0.1.0), som igjen drog inn `api-extractor` 7.15.2
frå 2021. Dependabot opna 26 nye varsel på den commiten, av dei 7 høge og 1 kritisk. At dei var
`scope=development` gjer dei ikkje harmlause: ein kompromittert byggeavhengigheit kan injisere kode
i bundlen. Heft fjernar heile kjeda (gulp, express, request, node-forge, form-data).

## Verifisert

- 46/46 automatiske sjekkar mot kompilert `lib/` (XSS-payloadar, `<style>`-bevaring, CSS-skrubbing,
  URL-avvising, allow-liste, redirect-blokkering).
- `heft build --production` og `heft package-solution --production`: reint, `.sppkg` bygd.
- `requiresCustomScript` når fram til pakka: A/B-bygg viser at `false` utelet attributtet heilt,
  `true` gir `ReturnIfCustomScriptDisabled="false"` i WebPart-XML-en.
- Bundle: 36.9 KB, DOMPurify inne, `@fluentui/react` ute.
- Byggeoppsettet er samanlikna mot eit ekte scaffold frå `@microsoft/generator-sharepoint@1.23.2`;
  `config/rig.json`, `config/sass.json`, `config/typescript.json` og `tsconfig.json` er identiske.

To fallgruver som vart fanga undervegs:

1. DOMPurify droppa `<style>` — men berre når fila *startar* med den, fordi HTML-parsaren løftar ein
   leiande `<style>` opp i `<head>`, som DOMPurify kastar. Menyfiler startar rutinemessig med
   stilarket, så dette ville brote reelle menyar og samtidig passert ein naiv test. Løyst ved å
   parse inne i ein wrapper som blir pakka ut igjen.
2. `FORBID_CONTENTS` trong **ikkje** overstyrast; måling viste at `<style>` etter innhald overlever
   med standardkonfigurasjonen.

## Ikkje verifisert — krev tenant

Testinga er køyrd i Node med jsdom mot den kompilerte modulen. **jsdom er ikkje ein nettlesar**, og
ingenting er rulla ut.

- [ ] `heft start` → workbench: at legitim meny (HTML + CSS) rendrar som før
- [ ] At XSS-payloadane er inerte i ein ekte nettlesar, ikkje berre i jsdom
- [ ] At endring av URL i property-panelet oppdaterer innhaldet utan sidelasting
- [ ] At property-panelet viser feilmeldingane som venta
- [ ] Rull `.sppkg` i app-katalogen og stadfest at web parten **ikkje** dukkar opp i verktøykassa
      på ei site-samling der custom script er avslått

## Merknader

- Krev Node 22.14+ (`.nvmrc`). Byggekommandoar: `npm run build:ship`, `npm run package`,
  `npm run serve`.
- ESLint er flytta til flat config (`eslint.config.js`) mot `@microsoft/eslint-config-spfx`
  sin `flat-profiles/react`. `.eslintrc.js` og `gulpfile.js` er sletta.
- `@microsoft/sp-*` er med i `package.json` sjølv om dei ikkje blir importerte direkte — dei blir
  lasta av SharePoint sin runtime-loader og kostar null bytes i bundlen.
- Gulp la att `src/**/*.module.scss.ts`. Filene er gitignorerte, så dei dukka ikkje opp i
  `git status`, men heft kompilerte dei og bygget brast. Slett dei om bygget klagar på
  `Can't resolve './*.module.css'`.
- Testsuiten ligg i scratchpad, ikkje i repoet.
