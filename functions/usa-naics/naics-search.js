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


    try {

        /*
         * Official Census NAICS search.
         *
         * IMPORTANT:
         *
         * input = search text
         * year  = 2022
         */

        const searchUrl =
            "https://www.census.gov/naics/?input=" +
            encodeURIComponent(query) +
            "&year=2022";


        const response =
            await fetch(
                searchUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",

                        "Accept":
                            "text/html,application/xhtml+xml"

                    }
                }
            );


        if (!response.ok) {

            console.error(
                "Census NAICS HTTP:",
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
            parseCensusNAICS(
                html
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
   PARSE CENSUS NAICS
========================================= */

function parseCensusNAICS(html) {

    const results = [];

    const seen =
        new Set();


    /*
     * Census search result buttons contain
     * the NAICS code and title.
     *
     * Example:
     *
     * 541511
     * Custom Computer Programming Services
     *
     * The Census page can also contain
     * index-entry results where the same
     * code appears several times.
     */


    /*
     * First try buttons.
     */

    const buttonRegex =
        /<(?:button|a)[^>]*>\s*(?:<[^>]+>\s*)*(\d{2,6})(?:\s*<\/[^>]+>)*\s*([\s\S]*?)<\/(?:button|a)>/gi;


    let match;


    while (
        (match = buttonRegex.exec(html)) !== null
    ) {

        const code =
            match[1];

        let text =
            match[2];


        text =
            stripHtml(text);

        text =
            decodeHtml(text);

        text =
            cleanText(text);


        if (
            !isValidCode(code) ||
            !text
        ) {

            continue;

        }


        /*
         * Remove unnecessary search
         * result text.
         */

        text =
            cleanTitle(text);


        if (!text) {

            continue;

        }


        addResult(
            results,
            seen,
            code,
            text
        );

    }


    /*
     * Second parser.
     *
     * Census currently renders many
     * search-result records as text
     * surrounding a numeric code.
     */


    const text =
        cleanText(
            decodeHtml(
                stripHtml(html)
            )
        );


    /*
     * Look for:
     *
     * 541511 Custom Computer Programming Services
     *
     * but do not blindly treat years
     * such as 2022 as NAICS codes.
     */

    const textRegex =
        /(?:^|\s)(\d{2,6})\s+([A-Z][A-Za-z0-9,&'()\/.\- ]{2,120}?)(?=\s+(?:This industry|Search Results|Cross-References|Illustrative Examples|Number of records|NAICS Definition|$))/g;


    while (
        (match = textRegex.exec(text)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];


        if (
            !isValidCode(code)
        ) {

            continue;

        }


        title =
            cleanTitle(title);


        if (!title) {

            continue;

        }


        addResult(
            results,
            seen,
            code,
            title
        );

    }


    return results;

}


/* =========================================
   VALID NAICS CODE
========================================= */

function isValidCode(code) {

    if (!/^\d{2,6}$/.test(code)) {

        return false;

    }


    /*
     * Never treat NAICS years as codes.
     */

    const blocked =
        new Set([
            "1997",
            "2002",
            "2007",
            "2012",
            "2017",
            "2022"
        ]);


    if (
        blocked.has(code)
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

    title =
        cleanTitle(title);


    if (
        !isValidCode(code) ||
        !title
    ) {

        return;

    }


    /*
     * Ignore generic page/navigation
     * strings.
     */

    if (
        /^(NAICS|Search|Go|Menu|Main|History|Concordances|Downloadable Files)$/i
            .test(title)
    ) {

        return;

    }


    const key =
        code + "|" + title.toLowerCase();


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
            title

    });

}


/* =========================================
   CLEAN TITLE
========================================= */

function cleanTitle(value) {

    let title =
        String(value || "");


    title =
        title
        .replace(
            /\s+/g,
            " "
        )
        .trim();


    /*
     * Remove common Census labels.
     */

    title =
        title.replace(
            /^Search Results\s*/i,
            ""
        );


    title =
        title.replace(
            /^top of search results.*?:/i,
            ""
        );


    /*
     * Remove trailing NAICS markers.
     */

    title =
        title.replace(
            /\s*\^T\s*$/i,
            ""
        );


    /*
     * If Census gives:
     *
     * 541511: Custom Computer Programming Services
     *
     * keep only the title.
     */

    const colon =
        title.match(
            /^\d{2,6}\s*:\s*(.+)$/
        );


    if (colon) {

        title =
            colon[1];

    }


    /*
     * Remove long definition text.
     */

    const cutWords = [

        "This industry comprises",

        "This U.S. industry comprises",

        "Illustrative Examples:",

        "Cross-References.",

        "Cross-References",

        "See industry description"

    ];


    for (
        const word of cutWords
    ) {

        const index =
            title
            .toLowerCase()
            .indexOf(
                word.toLowerCase()
            );


        if (index >= 0) {

            title =
                title.substring(
                    0,
                    index
                );

        }

    }


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
