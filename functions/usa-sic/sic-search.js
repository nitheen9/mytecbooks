export async function onRequest(context) {

    const requestUrl = new URL(context.request.url);

    const originalQuery =
        (requestUrl.searchParams.get("q") || "")
        .trim()
        .replace(/\s+/g, " ");

    if (originalQuery.length < 2) {

        return jsonResponse({
            query: originalQuery,
            results: []
        });

    }

    /*
     * Normalize the search term.
     *
     * Example:
     *
     * software -> Software
     * SOFTWARE -> Software
     * SoFtWaRe -> Software
     *
     * This prevents capitalization differences
     * from affecting the OSHA search.
     */

    const searchTerm =
        originalQuery
            .toLowerCase()
            .replace(/\b\w/g, function(letter) {
                return letter.toUpperCase();
            });


    try {

        /*
         * First search using the normalized term.
         */

        let results =
            await searchOSHA(searchTerm);


        /*
         * If OSHA returns no results, try the
         * original spelling as a fallback.
         *
         * This makes the search more tolerant.
         */

        if (
            results.length === 0 &&
            searchTerm !== originalQuery
        ) {

            results =
                await searchOSHA(originalQuery);

        }


        return jsonResponse({

            query: originalQuery,

            results:
                results.slice(0, 50)

        });

    }
    catch (error) {

        console.error(
            "SIC search error:",
            error
        );

        return jsonResponse({

            query: originalQuery,

            results: []

        });

    }

}


/* =========================================
   SEARCH OSHA
========================================= */

async function searchOSHA(searchTerm) {

    const searchUrl =
        "https://www.osha.gov/data/sic-search?title_and_body=" +
        encodeURIComponent(searchTerm);


    const response =
        await fetch(
            searchUrl,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (compatible; MyTecBooks SIC Search)"
                }
            }
        );


    if (!response.ok) {

        console.error(
            "OSHA HTTP status:",
            response.status
        );

        return [];

    }


    const html =
        await response.text();


    return parseOSHAResults(html);

}


/* =========================================
   PARSE OSHA SEARCH RESULTS
========================================= */

function parseOSHAResults(html) {

    const results = [];

    const seen = new Set();


    /*
     * OSHA SIC result links.
     *
     * We look for links containing a
     * 2-4 digit SIC code.
     */

    const patterns = [

        /href=["']([^"']*sic[^"']*\/(\d{2,4})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,

        /href=["']([^"']*\/(\d{2,4})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi

    ];


    for (
        const regex of patterns
    ) {

        let match;


        while (
            (match = regex.exec(html)) !== null
        ) {

            const url =
                match[1];

            const code =
                match[2];

            let linkText =
                match[3];


            /*
             * Clean HTML from link text.
             */

            linkText =
                stripHtml(linkText);


            linkText =
                decodeHtml(linkText);


            linkText =
                cleanText(linkText);


            if (
                !code ||
                !linkText
            ) {

                continue;

            }


            /*
             * OSHA may return text such as:
             *
             * Description for 7372: Prepackaged Software
             */

            let title =
                linkText;


            const descriptionMatch =
                linkText.match(
                    /Description\s+for\s+\d{2,4}\s*:\s*(.+)/i
                );


            if (descriptionMatch) {

                title =
                    descriptionMatch[1];

            }


            /*
             * Remove possible SIC number
             * from the beginning of title.
             */

            title =
                title.replace(
                    /^\d{2,4}\s*[-:]\s*/,
                    ""
                );


            title =
                cleanText(title);


            if (
                !title ||
                title.length < 2
            ) {

                continue;

            }


            /*
             * Ignore navigation links.
             */

            if (
                /^(search|submit|clear|next|previous|back)$/i.test(
                    title
                )
            ) {

                continue;

            }


            const key =
                code + "|" + title;


            if (
                seen.has(key)
            ) {

                continue;

            }


            seen.add(key);


            results.push({

                code:
                    code,

                title:
                    title

            });

        }

    }


    return results;

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
   DECODE HTML ENTITIES
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
