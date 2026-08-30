export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const query =
        (
            requestUrl.searchParams.get("q") ||
            ""
        )
        .trim();

    if (query.length < 2) {

        return jsonResponse({
            query: query,
            results: []
        });

    }

    /*
     * Census 2022 NAICS public search.
     *
     * IMPORTANT:
     *
     * "input" is the search value.
     *
     * We do NOT put a keyword into
     * "details".
     */

    const searchUrl =
        "https://www.census.gov/naics/" +
        "?input=" +
        encodeURIComponent(query) +
        "&year=2022";

    try {

        const response =
            await fetch(
                searchUrl,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",

                        "Accept":
                            "text/html,application/xhtml+xml,text/html"
                    }
                }
            );

        if (!response.ok) {

            console.error(
                "Census HTTP status:",
                response.status
            );

            return jsonResponse({
                query: query,
                results: []
            });
        }

        const html =
            await response.text();

        const results =
            parseCensusResults(
                html,
                query
            );

        return jsonResponse({

            query: query,

            results:
                results.slice(0, 50)

        });

    }
    catch (error) {

        console.error(
            "NAICS search error:",
            error
        );

        return jsonResponse({

            query: query,

            results: []

        });

    }
}


/* =========================================
   PARSE CENSUS RESULTS
========================================= */

function parseCensusResults(
    html,
    query
) {

    const results = [];

    const seen =
        new Set();

    /*
     * Find Census links containing
     *
     * details=123456
     *
     */

    const linkRegex =
        /<a\b[^>]*href=["']([^"']*details=(\d{2,6})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while (
        (match = linkRegex.exec(html)) !== null
    ) {

        const url =
            match[1];

        const code =
            match[2];

        let title =
            match[3];

        title =
            stripHtml(title);

        title =
            decodeHtml(title);

        title =
            cleanText(title);

        if (
            !code ||
            !title
        ) {
            continue;
        }

        /*
         * Remove common footnote symbols.
         */

        title =
            title
            .replace(
                /[†‡*]+$/g,
                ""
            )
            .trim();

        /*
         * Ignore navigation links.
         */

        if (
            /^(go|search|home|menu|main|next|previous|back)$/i
            .test(title)
        ) {
            continue;
        }

        /*
         * Ignore extremely long
         * navigation/content links.
         */

        if (
            title.length > 300
        ) {
            continue;
        }

        const key =
            code +
            "|" +
            title;

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        results.push({

            code: code,

            title: title,

            url:
                "/usa-naics/" +
                encodeURIComponent(code) +
                "/"

        });
    }

    /*
     * Some Census page versions
     * expose the code/title as text
     * rather than an anchor.
     *
     * Try a second parser.
     */

    if (
        results.length === 0
    ) {

        parseTextResults(
            html,
            query,
            results,
            seen
        );

    }

    return results;
}


/* =========================================
   TEXT FALLBACK
========================================= */

function parseTextResults(
    html,
    query,
    results,
    seen
) {

    let text =
        html
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(
            /<[^>]+>/g,
            " "
        );

    text =
        decodeHtml(text);

    text =
        cleanText(text);

    /*
     * Look for a code followed
     * by an industry title.
     */

    const regex =
        /\b(\d{2,6})\s+([A-Z][A-Za-z0-9 ,&()'\/.\-]{2,180}?)(?=\s+\d{2,6}\s+|\s+This industry comprises|\s+Cross-References|$)/g;

    let match;

    while (
        (match = regex.exec(text)) !== null
    ) {

        const code =
            match[1];

        let title =
            cleanText(match[2]);

        if (
            !code ||
            !title
        ) {
            continue;
        }

        /*
         * Only accept titles that
         * contain the search text.
         */

        if (
            !title
                .toLowerCase()
                .includes(
                    query.toLowerCase()
                )
        ) {
            continue;
        }

        const key =
            code +
            "|" +
            title;

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        results.push({

            code: code,

            title: title,

            url:
                "/usa-naics/" +
                encodeURIComponent(code) +
                "/"

        });

        if (
            results.length >= 50
        ) {
            break;
        }
    }
}


/* =========================================
   STRIP HTML
========================================= */

function stripHtml(value) {

    return String(value || "")

        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )

        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )

        .replace(
            /<[^>]+>/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();
}


/* =========================================
   DECODE HTML
========================================= */

function decodeHtml(value) {

    return String(value || "")

        .replace(
            /&nbsp;/gi,
            " "
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#039;/gi,
            "'"
        )

        .replace(
            /&#39;/gi,
            "'"
        )

        .replace(
            /&lt;/gi,
            "<"
        )

        .replace(
            /&gt;/gi,
            ">"
        );
}


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(value) {

    return String(value || "")

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /\s+([,.])/g,
            "$1"
        )

        .trim();
}


/* =========================================
   JSON RESPONSE
========================================= */

function jsonResponse(data) {

    return new Response(

        JSON.stringify(data),

        {
            status: 200,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );
}
