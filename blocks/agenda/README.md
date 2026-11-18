# agenda

Custom **custom** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

Key/value config block (title, endpoint, taxonomy, type, limit, order, view, load-more-label, seasons; optional origin). Events are fetched live from the source search endpoint and rendered as a list or grid with a view toggle, season filter chips and a load-more button.

| Row | Cells |
| --- | --- |
| 1 | title &#124; Discover what's happening in Barcelona now, and what's coming next |
| 2 | endpoint &#124; /bin/thisisbcn/pois/search |
| 3 | taxonomy &#124; thisisbarcelona:transversals/tipus-contingut/content-agenda (filter key tipus-contingut:content-agenda) |
| 4 | type &#124; main |
| 5 | limit &#124; 4 |
| 6 | order &#124; startDateAsc |
| 7 | view &#124; list |
| 8 | load-more-label &#124; See all |
| 9 | seasons &#124; spring 20/03-21/06, summer 21/06-23/09, autumn 23/09-21/12, winter 21/12-20/03 |

Key/value config block; events fetched live. Save/share buttons out of scope.

## When to use

Use wherever the source page shows the cmp-agenda listing; change taxonomy/limit/order per page. Events are not authored.

## Live data

The block calls `GET {origin}{endpoint}` with `tagsfilter`, `dateFrom` (today, or the season start), `dateTo` + `excludeUndatedAgenda=true` (season filter only), `poiTypeSelector=agendaType`, `language` (from `<html lang>`), `maxResults` (`limit`), `offset` (load more) and `orderBy` (`order`). It reads `items[]` (`title`, `titleUrl`, `description`, `imageUrl`, `imageAlt`, `infoTags`, `address`, `startDate`, `endDate`) and `total`.

The source endpoint sends no `Access-Control-Allow-Origin` header, so browsers block the request from any other origin (aem.page / aem.live). The block then shows "Events could not be loaded right now." To get live events, serve the endpoint through a same-origin proxy (for example a CDN route) and point `endpoint` at it, or set `origin` to a host that allows CORS.
