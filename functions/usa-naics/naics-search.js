export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

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


    try {

        /*
         * Census NAICS search.
         *
         * The Census site accepts a keyword
         * through the input parameter.
         */

        const searchUrl =
            "https://www.census.gov/naics/?" +
            "input=" +
            encodeURIComponent(originalQuery) +
            "&year=2022";


        const response =
            await fetch(
                searchUrl,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)"
                    }
                }
            );


        if (!response.ok) {

            console.error(
                "Census HTTP status:",
                response.status
            );

            return jsonResponse({

                query: originalQuery,

                results: []

            });

        }


        const html =
            await response.text();


        const results =
            parseNAICSResults(html);


        return jsonResponse({

            query:
                originalQuery,

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

            query:
                originalQuery,

            results: []

        });

    }

}


/* =========================================
   PARSE CENSUS NAICS RESULTS
========================================= */

function parseNAICSResults(html) {

    const results = [];

    const seen = new Set();


    /*
     * Census NAICS detail URLs commonly contain:
     *
     * ?details=541511&input=541511&year=2022
     *
     * Find the details code and title around it.
     */

    const regex =
        /(?:details=)(\d{2,6})(?:&|["']|[^<]{0,100})([\s\S]{0,1000})/gi;


    let match;


    while (
        (match = regex.exec(html)) !== null
    ) {

        const code =
            match[1];


        if (!code) {
            continue;
        }


        const nearby =
            stripHtml(
                match[2] || ""
            );


        /*
         * Try to find a useful industry title.
         */

        let title =
            extractTitle(
                nearby,
                code
            );


        /*
         * If the first method does not find
         * a title, look around the complete HTML.
         */

        if (!title) {

            title =
                findTitleNearCode(
                    html,
                    code,
                    match.index
                );

        }


        if (!title) {
            continue;
        }


        title =
            cleanText(title);


        if (
            title.length < 2 ||
            title.length > 300
        ) {

            continue;

        }


        /*
         * Ignore obvious non-industry text.
         */

        if (
            /^(search|go|submit|definition|results|home)$/i.test(
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


    return results;

}


/* =========================================
   EXTRACT TITLE
========================================= */

function extractTitle(
    text,
    code
) {

    let value =
        String(text || "");


    value =
        decodeHtml(value);


    value =
        stripHtml(value);


    value =
        cleanText(value);


    /*
     * Look for:
     *
     * 541511 Custom Computer Programming Services
     */

    const direct =
        value.match(
            new RegExp(
                "\\b" +
                code +
                "\\b\\s*[|:-]?\\s*([^|\\n]{2,250})",
                "i"
            )
        );


    if (direct) {

        return cleanTitle(
            direct[1]
        );

    }


    return "";

}


/* =========================================
   FIND TITLE NEAR CODE
========================================= */

function findTitleNearCode(
    html,
    code,
    position
) {

    const start =
        Math.max(
            0,
            position - 300
        );


    const end =
        Math.min(
            html.length,
            position + 1500
        );


    const section =
        html.substring(
            start,
            end
        );


    const text =
        cleanText(
            decodeHtml(
                stripHtml(section)
            )
        );


    const regex =
        new RegExp(
            "\\b" +
            code +
            "\\b\\s*(?:\\||-|:)?\\s*([^|]{2,250})",
            "i"
        );


    const match =
        text.match(regex);


    if (!match) {

        return "";

    }


    return cleanTitle(
        match[1]
    );

}


/* =========================================
   CLEAN TITLE
========================================= */

function cleanTitle(
    value
) {

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
     * Remove common Census navigation
     * text accidentally captured.
     */

    title =
        title.replace(
            /\s+(View|Search|Definition|NAICS Manual|Reference Files).*$/i,
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

            status:
                200,

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
