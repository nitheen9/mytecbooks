export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const query =
        (requestUrl.searchParams.get("q") || "")
        .trim();

    if (query.length < 2) {

        return jsonResponse({
            query: query,
            results: []
        });
    }

    /*
     * Latest released U.S. NAICS:
     * 2022
     *
     * Census is currently working toward
     * future revisions, but 2022 remains
     * the latest released classification.
     */

    const searchUrl =
        "https://www.census.gov/naics/" +
        "?details=" +
        encodeURIComponent(query) +
        "&input=" +
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


/*
 * =========================================
 * PARSE CENSUS RESULTS
 * =========================================
 *
 * Current Census pages contain entries
 * similar to:
 *
 * [Button: 513210] Software Publishers:
 *
 * and:
 *
 * [Button: 334610] Software, packaged...
 *
 */

function parseCensusResults(
    html,
    query
) {

    const results = [];

    const seen =
        new Set();

    /*
     * First convert the page to plain text.
     */

    let text =
        htmlToText(html);

    /*
     * Decode common HTML entities.
     */

    text =
        decodeHtml(text);

    /*
     * Normalize whitespace.
     */

    text =
        text.replace(
            /\s+/g,
            " "
        ).trim();


    /*
     * Current Census format:
     *
     * [Button: 513210] Software Publishers:
     *
     * Capture:
     *
     * 513210
     * Software Publishers
     *
     */

    const buttonRegex =
        /\[Button:\s*(\d{2,6})\]\s*([^[]+?)(?=\s*\[Button:|\s*2022 NAICS Definition|\s*NAICS Definition|$)/gi;

    let match;

    while (
        (match = buttonRegex.exec(text)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];

        title =
            cleanResultTitle(title);

        if (
            !code ||
            !title
        ) {
            continue;
        }

        /*
         * Do not add navigation buttons.
         */

        if (
            isBadResultTitle(title)
        ) {
            continue;
        }

        /*
         * Avoid duplicate code/title pairs.
         */

        const key =
            code + "|" + title.toLowerCase();

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        results.push({
            code: code,
            title: title
        });
    }


    /*
     * Fallback parser.
     *
     * Some Census responses may contain
     * HTML links instead of the text form.
     */

    if (
        results.length === 0
    ) {

        parseAnchorResults(
            html,
            results,
            seen
        );
    }


    /*
     * If the query itself is a numeric
     * NAICS code, make sure the exact
     * code can be returned.
     */

    if (
        /^\d{2,6}$/.test(query)
    ) {

        const exact =
            results.filter(
                item =>
                    item.code === query
            );

        if (
            exact.length > 0
        ) {

            return exact;
        }
    }


    return results;
}


/*
 * =========================================
 * HTML TO TEXT
 * =========================================
 */

function htmlToText(
    html
) {

    return String(html || "")

        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )

        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )

        .replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
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


/*
 * =========================================
 * ANCHOR FALLBACK
 * =========================================
 */

function parseAnchorResults(
    html,
    results,
    seen
) {

    const regex =
        /href=["'][^"']*details=(\d{2,6})[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while (
        (match = regex.exec(html)) !== null
    ) {

        const code =
            match[1];

        let title =
            htmlToText(
                match[2]
            );

        title =
            decodeHtml(title);

        title =
            cleanResultTitle(title);

        if (
            !code ||
            !title
        ) {
            continue;
        }

        if (
            isBadResultTitle(title)
        ) {
            continue;
        }

        const key =
            code + "|" + title.toLowerCase();

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        results.push({
            code: code,
            title: title
        });
    }
}


/*
 * =========================================
 * CLEAN RESULT TITLE
 * =========================================
 */

function cleanResultTitle(
    value
) {

    let title =
        decodeHtml(
            String(value || "")
        );

    title =
        title.replace(
            /\s+/g,
            " "
        ).trim();

    /*
     * Remove Census explanatory text.
     */

    title =
        title.replace(
            /\s+T\s*$/i,
            ""
        );

    title =
        title.replace(
            /\s+This industry comprises[\s\S]*$/i,
            ""
        );

    title =
        title.replace(
            /\s+See industry description[\s\S]*$/i,
            ""
        );

    /*
     * Remove footnote symbols.
     */

    title =
        title.replace(
            /[†‡*]+\s*$/g,
            ""
        );

    /*
     * Remove trailing colon.
     */

    title =
        title.replace(
            /:\s*$/g,
            ""
        );

    return title.trim();
}


/*
 * =========================================
 * BAD TITLES
 * =========================================
 */

function isBadResultTitle(
    title
) {

    if (!title) {
        return true;
    }

    if (
        title.length < 2
    ) {
        return true;
    }

    return /^(go|search|home|menu|main|next|previous|history|concordances|downloadable files|naics)$/i
        .test(title);
}


/*
 * =========================================
 * DECODE HTML
 * =========================================
 */

function decodeHtml(
    value
) {

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


/*
 * =========================================
 * JSON RESPONSE
 * =========================================
 */

function jsonResponse(
    data
) {

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
