export async function onRequest(context) {

    const url = new URL(context.request.url);

    const query =
        url.searchParams
        .get("q")
        ?.trim();


    if (!query || query.length < 2) {

        return jsonResponse({
            results: []
        });

    }


    try {

        /*
         * OSHA SIC search page
         */

        const searchUrl =
            "https://www.osha.gov/sic-manual/search?query=" +
            encodeURIComponent(query);


        const response =
            await fetch(
                searchUrl,
                {
                    headers: {
                        "User-Agent":
                            "MyTecBooks U.S. SIC Search"
                    }
                }
            );


        if (!response.ok) {

            return jsonResponse(
                {
                    results: []
                },
                502
            );

        }


        const html =
            await response.text();


        const results =
            parseSearchResults(
                html,
                query
            );


        return jsonResponse({
            results: results
        });

    }

    catch (error) {

        console.error(
            "SIC search error:",
            error
        );


        return jsonResponse(
            {
                results: []
            },
            500
        );

    }

}


/* =========================================
   PARSE SEARCH RESULTS
========================================= */

function parseSearchResults(
    html,
    query
) {

    const results = [];

    const seen = new Set();


    /*
     * Look for links pointing to
     * OSHA SIC pages.
     */

    const linkRegex =
        /<a[^>]+href=["']([^"']*\/sic-manual\/(\d{2,4})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match = linkRegex.exec(html)) !== null
    ) {

        const code =
            match[2];


        if (seen.has(code)) {
            continue;
        }


        let title =
            stripHtml(
                match[3]
            );


        title =
            cleanText(title);


        /*
         * Ignore empty or navigation links.
         */

        if (
            !title ||
            title.length < 2
        ) {

            continue;

        }


        /*
         * Ignore generic OSHA links.
         */

        if (
            /^(home|back|next|previous|search)$/i
            .test(title)
        ) {

            continue;

        }


        seen.add(code);


        results.push({

            code: code,

            title: title

        });


        /*
         * Maximum 20 results.
         */

        if (results.length >= 20) {
            break;
        }

    }


    /*
     * Fallback parser.
     *
     * If OSHA changes the search page
     * markup, look for SIC code + text.
     */

    if (results.length === 0) {

        const fallbackRegex =
            /\b(\d{2,4})\s+([A-Z][A-Za-z0-9 ,&'()\/.-]{2,120})/g;


        while (
            (match =
                fallbackRegex.exec(html)) !== null
        ) {

            const code =
                match[1];


            const title =
                cleanText(
                    stripHtml(
                        match[2]
                    )
                );


            if (seen.has(code)) {
                continue;
            }


            if (
                title.length < 3
            ) {
                continue;
            }


            seen.add(code);


            results.push({

                code: code,

                title: title

            });


            if (results.length >= 20) {
                break;
            }

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
            /<[^>]+>/g,
            " "
        )

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

function jsonResponse(
    data,
    status = 200
) {

    return new Response(
        JSON.stringify(data),
        {
            status: status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400"

            }

        }
    );

}
