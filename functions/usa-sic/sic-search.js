export async function onRequest(context) {

    const url = new URL(context.request.url);

    const query =
        (url.searchParams.get("q") || "")
        .trim()
        .toLowerCase();


    if (query.length < 2) {

        return jsonResponse({
            results: []
        });

    }


    /*
        U.S. SIC search data.

        This searches the OSHA SIC Manual
        through the public OSHA SIC pages.

        We first try to find matching SIC
        codes from the OSHA SIC index.
    */

    try {

        const searchUrl =
            "https://www.osha.gov/sic-manual/search?search_api_fulltext=" +
            encodeURIComponent(query);


        const response =
            await fetch(searchUrl, {

                headers: {

                    "User-Agent":
                        "Mozilla/5.0 MyTecBooks U.S. SIC Search"

                }

            });


        if (!response.ok) {

            return jsonResponse({
                results: []
            });

        }


        const html =
            await response.text();


        const results =
            parseSearchResults(html, query);


        return jsonResponse({
            results: results.slice(0, 50)
        });


    }
    catch (error) {

        console.error(
            "SIC search error:",
            error
        );


        return jsonResponse({
            results: []
        });

    }

}


/* =========================================
   PARSE OSHA SEARCH PAGE
========================================= */

function parseSearchResults(
    html,
    query
) {

    const results = [];

    const seen = new Set();


    /*
        Look for OSHA SIC links.

        Example link:

        /sic-manual/7372
    */

    const linkRegex =
        /href=["']\/sic-manual\/(\d{2,4})["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match = linkRegex.exec(html)) !== null
    ) {

        const code =
            match[1];


        let title =
            stripHtml(match[2]);


        title =
            cleanText(title);


        if (
            !title ||
            title.length < 2
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


        /*
            Keep results relevant to
            the user's search text.
        */

        const combined =
            (
                code +
                " " +
                title
            ).toLowerCase();


        if (
            combined.includes(query)
        ) {

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

function stripHtml(
    value
) {

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
        )

        .replace(
            /&#39;/gi,
            "'"
        );

}


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(
    value
) {

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
