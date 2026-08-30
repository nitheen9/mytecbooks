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

    try {

        const censusUrl =
            "https://www.census.gov/naics/" +
            "?input=" +
            encodeURIComponent(query) +
            "&year=2022";

        const response =
            await fetch(
                censusUrl,
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
                "Census HTTP:",
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
            parseResults(
                html
            );

        return jsonResponse({

            query: query,

            results:
                results.slice(
                    0,
                    50
                )

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

function parseResults(html) {

    const results = [];

    const seen =
        new Set();

    /*
     * Census search result format:
     *
     * Button: 513140
     * Directory and Mailing List Publishers
     */

    const buttonRegex =
        /Button:\s*(\d{2,6})\s+([^<\n]+?)(?=\s+This industry comprises|\s+See industry description|\s+Button:|\s+2022 NAICS Definition|$)/gi;

    let match;

    while (
        (match =
            buttonRegex.exec(html)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];

        title =
            decodeHtml(
                stripHtml(title)
            );

        title =
            cleanTitle(title);

        if (
            !isValidResult(
                code,
                title
            )
        ) {
            continue;
        }

        addResult(
            results,
            seen,
            code,
            title
        );

    }


    /*
     * Parse HTML anchors as a second method.
     */

    const anchorRegex =
        /<a\b[^>]*>([\s\S]*?)<\/a>/gi;

    while (
        (match =
            anchorRegex.exec(html)) !== null
    ) {

        const content =
            decodeHtml(
                stripHtml(
                    match[1]
                )
            );

        const resultRegex =
            /^\s*(\d{2,6})\s+(.+)$/;

        const resultMatch =
            content.match(
                resultRegex
            );

        if (!resultMatch) {
            continue;
        }

        const code =
            resultMatch[1];

        const title =
            cleanTitle(
                resultMatch[2]
            );

        if (
            !isValidResult(
                code,
                title
            )
        ) {
            continue;
        }

        addResult(
            results,
            seen,
            code,
            title
        );

    }


    /*
     * If Census gives no structured
     * links, use rendered text.
     */

    if (
        results.length === 0
    ) {

        parseText(
            html,
            results,
            seen
        );

    }


    return results;

}


/* =========================================
   TEXT FALLBACK
========================================= */

function parseText(
    html,
    results,
    seen
) {

    const text =
        cleanText(
            decodeHtml(
                stripHtml(html)
            )
        );

    /*
     * Census search results generally
     * have "Button: CODE Title".
     */

    const regex =
        /Button:\s*(\d{2,6})\s+(.+?)(?=\s+This industry comprises|\s+See industry description|\s+Button:|\s+2022 NAICS Definition|$)/gi;

    let match;

    while (
        (match =
            regex.exec(text)) !== null
    ) {

        const code =
            match[1];

        const title =
            cleanTitle(
                match[2]
            );

        if (
            !isValidResult(
                code,
                title
            )
        ) {
            continue;
        }

        addResult(
            results,
            seen,
            code,
            title
        );

    }

}


/* =========================================
   VALID RESULT
========================================= */

function isValidResult(
    code,
    title
) {

    if (
        !/^\d{2,6}$/.test(code)
    ) {
        return false;
    }

    if (
        !title ||
        title.length < 2
    ) {
        return false;
    }

    if (
        title.length > 250
    ) {
        return false;
    }

    if (
        /^(home|menu|search|go|next|previous|back)$/i
        .test(title)
    ) {
        return false;
    }

    return true;

}


/* =========================================
   ADD RESULT
========================================= */

function addResult(
    results,
    seen,
    code,
    title
) {

    const key =
        code +
        "|" +
        title;

    if (
        seen.has(key)
    ) {
        return;
    }

    seen.add(key);

    results.push({

        code:
            code,

        title:
            title,

        url:
            "/usa-naics/" +
            encodeURIComponent(code) +
            "/"

    });

}


/* =========================================
   CLEAN TITLE
========================================= */

function cleanTitle(value) {

    return String(value || "")

        .replace(
            /[†‡*]+$/g,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

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
