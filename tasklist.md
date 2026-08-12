# Tasklist — tryggleik og opprydding

Status: kodearbeidet er ferdig. Utrulling og testing i tenant står att.
Sesjon 2026-08-12. Plan: `~/.claude/plans/fluffy-spinning-dolphin.md`.

## Gjort

| # | Oppgåve | Resultat |
|---|---------|----------|
| 1 | `requiresCustomScript: true` | Web parten er no gated til site-samlingar der custom script er på |
| 2 | `components/htmlSource.ts` (ny) | Kjeldevalidering + DOMPurify-sanitering |
| 3 | `PolMenu.tsx` livssyklus | `componentDidUpdate`, `AbortController`, `response.ok`, feilmelding i UI |
| 4 | `allowedHosts`-property | Nytt felt med `onGetErrorMessage`-validering, `dataVersion` 1.1 |
| 5 | Daudkode fjerna | Ubrukte props, `onInit`, `_getEnvironmentMessage`, daude SCSS-klasser, `@fluentui/react` |
| 6 | SPFx 1.20.0 → 1.23.2 | TypeScript 5.3.3, Node 22, rein lockfil |

Utover planen: redirect-omgåing tetta (`assertAllowedResponseOrigin`) — ein same-origin URL som
redirecta ut av tenanten slapp forbi allow-lista, sidan valideringa berre såg adressa før redirect.

## Målt effekt

| | Før | Etter |
|---|---|---|
| `npm audit --omit=dev` (det som blir sendt til nettlesaren) | 18 funn, 2 høge | **0** |
| `npm audit` totalt | 146 | 75 — alle `dev=true` |
| Bundle | `@fluentui/react` med, ubrukt | 36.9 KB, DOMPurify inne, fluentui ute |

## Verifisert

- 46/46 automatiske sjekkar mot kompilert `lib/` (XSS-payloadar, `<style>`-bevaring, CSS-skrubbing,
  URL-avvising, allow-liste, redirect-blokkering).
- `gulp bundle --ship` og `gulp package-solution --ship`: 0 åtvaringar, `.sppkg` bygd.
- `requiresCustomScript` når faktisk fram til pakka: A/B-bygg viser at `false` utelet attributtet
  heilt, `true` gir `ReturnIfCustomScriptDisabled="false"` i WebPart-XML-en.

To fallgruver som vart fanga undervegs:

1. DOMPurify droppa `<style>` — men berre når fila *startar* med den, fordi HTML-parsaren løftar
   ein leiande `<style>` opp i `<head>`, som DOMPurify kastar. Menyfiler startar rutinemessig med
   stilarket, så dette ville brote reelle menyar og samtidig passert ein naiv test. Løyst ved å
   parse inne i ein wrapper som blir pakka ut igjen.
2. `FORBID_CONTENTS` trong **ikkje** overstyrast. Den første diagnosen peika dit, men målinga viste
   at `<style>` etter innhald overlever med standardkonfigurasjonen. Konfigurasjonen vart difor
   ikkje svekka utan grunn.

## Ikkje verifisert — krev tenant

Testinga er køyrd i Node med jsdom mot den kompilerte modulen. **jsdom er ikkje ein nettlesar**, og
ingenting er rulla ut. Desse punkta frå planen står framleis att:

- [ ] `gulp serve` → workbench: at legitim meny (HTML + CSS) rendrar som før
- [ ] At XSS-payloadane er inerte i ein ekte nettlesar, ikkje berre i jsdom
- [ ] At endring av URL i property-panelet oppdaterer innhaldet utan sidelasting
- [ ] At property-panelet viser feilmeldingane som venta
- [ ] Rull `.sppkg` i app-katalogen og stadfest at web parten **ikkje** dukkar opp i verktøykassa
      på ei site-samling der custom script er avslått

## Merknader

- Krev Node 22.14+ (`.nvmrc` lagt til). SPFx 1.23.2 støttar ikkje nyare majors.
- Dei 75 resterande audit-funna er byggekjeda til SPFx sjølv (gulp 4, express, request). Microsoft
  leverer `sp-build-web@1.23.2` slik; dei når aldri nettlesaren.
- `@microsoft/sp-*` er med i `package.json` sjølv om dei ikkje blir importerte direkte — dei blir
  lasta av SharePoint sin runtime-loader og kostar null bytes i bundlen, så fjerning gir ingenting
  og kan bryte bygget.
- Testsuiten ligg i scratchpad, ikkje i repoet. Å leggje inn eit testrammeverk låg utanfor planen.
- Ingenting er commita.
