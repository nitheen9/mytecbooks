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
     * Only search the CURRENT 2022
     * U.S. NAICS classification.
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
                            "text/html,application/xhtml+xml"

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
     * Census result links are normally:
     *
     * ?details=513210&input=software&year=2022
     *
     * or similar links containing
     * the NAICS code.
     */

    const regex =
        /href=["']([^"']*details=(\d{2,6})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match = regex.exec(html)) !== null
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
         * Remove unnecessary superscript
         * / footnote characters.
         */

        title =
            title
            .replace(
                /[†‡*]+$/g,
                ""
            )
            .trim();


        /*
         * Ignore links that aren't
         * actual NAICS industry results.
         */

        if (
            title.length < 2
        ) {

            continue;

        }


        if (
            /^(go|search|home|menu|main|next|previous)$/i
            .test(title)
        ) {

            continue;

        }


        /*
         * Census can return both a
         * 5-digit parent and 6-digit
         * industry.
         *
         * Keep both because they are
         * valid NAICS hierarchy levels.
         */

        const key =
            code + "|" + title;


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
