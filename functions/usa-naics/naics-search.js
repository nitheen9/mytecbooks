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
     * CURRENT U.S. NAICS
     *
     * 2022 remains the current
     * official classification.
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
            parseCensusResults(html);

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

function parseCensusResults(html) {

    const results = [];

    const seen = new Set();

    /*
     * The Census page currently renders
     * search results in links similar to:
     *
     * Button: 513140
     * Directory and Mailing List Publishers
     *
     * The actual HTML can vary, so use
     * several extraction methods.
     */

    /*
     * METHOD 1
     *
     * Look for href links containing
     * details=NAICS_CODE.
     */

    const linkRegex =
        /<a\b[^>]*href=["']([^"']*(?:details|input)=\d{2,6}[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while (
        (match = linkRegex.exec(html)) !== null
    ) {

        const url =
            match[1];

        const linkText =
            cleanText(
                decodeHtml(
                    stripHtml(
                        match[2]
                    )
                )
            );

        const codeMatch =
            url.match(
                /(?:details|input)=(\d{2,6})/i
            );

        if (!codeMatch) {
            continue;
        }

        const code =
            codeMatch[1];

        addResult(
            results,
            seen,
            code,
            linkText
        );

    }


    /*
     * METHOD 2
     *
     * Search rendered text for:
     *
     * Button: 513140
     * Directory and Mailing List Publishers
     */

    const text =
        htmlToText(html);

    const buttonRegex =
        /Button:\s*(\d{2,6})\s+([^\n]+?)(?=\s+This industry comprises|\s+See industry description|\s+Button:|\s*$)/gi;

    while (
        (match = buttonRegex.exec(text)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];

        title =
            cleanText(title);

        title =
            cleanTitle(title);

        addResult(
            results,
            seen,
            code,
            title
        );

    }


    /*
     * METHOD 3
     *
     * Current Census pages can expose
     * search result text as:
     *
     * 513140 Directory and Mailing List
     * Publishers
     */

    const directRegex =
        /\b(\d{2,6})\s+([A-Z][A-Za-z0-9 ,&'()\-./]+?)(?=\s+This industry comprises|\s+See industry description|\s+Cross-References|\s*$)/g;

    while (
        (match = directRegex.exec(text)) !== null
    ) {

        const code =
            match[1];

        let title =
            cleanText(match[2]);

        title =
            cleanTitle(title);

        /*
         * Only accept plausible NAICS
         * result titles.
         */

        if (
            title.length >= 2 &&
            title.length <= 200
        ) {

            addResult(
                results,
                seen,
                code,
                title
            );

        }

    }


    /*
     * Remove obviously incorrect
     * navigation/year results.
     */

    return results.filter(
        function(item) {

            if (
                !/^\d{2,6}$/.test(item.code)
            ) {
                return false;
            }

            if (
                /^(NAICS|Search|Go|Main|History)$/i
                .test(item.title)
            ) {
                return false;
            }

            /*
             * Do not allow a result that is
             * simply a year.
             */

            if (
                /^(1997|2002|2007|2012|2017|2022)$/
                .test(item.code)
            ) {
                return false;
            }

            return true;

        }
    );

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

    if (!code || !title) {
        return;
    }

    title =
        cleanTitle(title);

    if (!title) {
        return;
    }

    /*
     * Remove Census navigation.
     */

    if (
        /^(go|search|home|menu|main|next|previous|naics)$/i
        .test(title)
    ) {
        return;
    }

    /*
     * Remove very long page text.
     */

    if (title.length > 250) {
        return;
    }

    const key =
        code + "|" + title.toLowerCase();

    if (seen.has(key)) {
        return;
    }

    seen.add(key);

    results.push({

        code: code,

        title: title

    });

}


/* =========================================
   CLEAN TITLE
========================================= */

function cleanTitle(value) {

    let title =
        cleanText(value);

    title =
        title.replace(
            /\^?\{.*?\}/g,
            ""
        );

    title =
        title.replace(
            /[†‡*]+$/g,
            ""
        );

    title =
        title.replace(
            /\s+T$/g,
            ""
        );

    title =
        title.replace(
            /\s+See industry description\.?$/i,
            ""
        );

    title =
        title.replace(
            /\s+2022 NAICS Definition.*$/i,
            ""
        );

    return title.trim();

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
            /<noscript[\s\S]*?<\/noscript>/gi,
            " "
        )

        .replace(
            /<br\s*\/?>/gi,
            "\n"
        )

        .replace(
            /<\/p>/gi,
            "\n"
        )

        .replace(
            /<\/div>/gi,
            "\n"
        )

        .replace(
            /<\/li>/gi,
            "\n"
        )

        .replace(
            /<[^>]+>/g,
            " "
        )

        .replace(
            /[ \t]+/g,
            " "
        )

        .trim();

}


/* =========================================
   HTML TO TEXT
========================================= */

function htmlToText(html) {

    return decodeHtml(
        stripHtml(html)
    )

    .replace(
        /\r/g,
        ""
    )

    .replace(
        /\n\s*\n+/g,
        "\n"
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
