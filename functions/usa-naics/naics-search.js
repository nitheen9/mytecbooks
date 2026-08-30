export async function onRequest(context) {

```
const requestUrl =
    new URL(context.request.url);

const query =
    (
        requestUrl.searchParams.get("q") ||
        ""
    ).trim();

if (query.length < 2) {

    return jsonResponse({
        query: query,
        results: []
    });
}


/*
 * IMPORTANT:
 *
 * For a keyword search Census uses:
 *
 * input=software
 *
 * NOT:
 *
 * details=software
 *
 * Current published U.S. classification:
 * 2022 NAICS
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
```

}

/* =========================================
PARSE CENSUS RESULTS
========================================= */

function parseCensusResults(html) {

```
const results = [];

const seen = new Set();


/*
 * Census currently renders entries
 * similar to:
 *
 * Button: 513210
 * Software Publishers
 *
 * We capture the code and the text
 * following the Button.
 */

const buttonRegex =
    /Button:\s*(\d{2,6})\s*([\s\S]*?)(?=Button:\s*\d{2,6}|2022 NAICS Definition|2022 NAICS Manual|Reference Files|Announcements|$)/gi;


let match;


while (
    (match = buttonRegex.exec(html)) !== null
) {

    const code =
        match[1];

    let block =
        match[2];


    /*
     * Convert HTML into readable text.
     */

    block =
        stripHtml(block);


    block =
        decodeHtml(block);


    block =
        cleanText(block);


    if (!block) {
        continue;
    }


    /*
     * The first meaningful text after
     * Button: CODE is normally the title.
     *
     * Example:
     *
     * 513210
     * Software Publishers:
     * This industry comprises...
     *
     */

    let title = "";


    const titleMatch =
        block.match(
            /^([^:]+?)(?=\s+This (?:U\.S\. )?industry comprises|\s+See industry description|\s+Cross-References|$)/i
        );


    if (titleMatch) {

        title =
            cleanText(
                titleMatch[1]
            );
    }


    /*
     * If the first pattern did not work,
     * take text before the first colon.
     */

    if (!title) {

        const colonIndex =
            block.indexOf(":");

        if (colonIndex > 0) {

            title =
                cleanText(
                    block.substring(
                        0,
                        colonIndex
                    )
                );
        }
    }


    /*
     * Final fallback: first reasonable
     * sentence.
     */

    if (!title) {

        title =
            cleanText(
                block
                .split(".")[0]
            );
    }


    /*
     * Remove trailing symbols.
     */

    title =
        title
        .replace(
            /[†‡*]+$/g,
            ""
        )
        .trim();


    /*
     * Ignore navigation garbage.
     */

    if (
        !title ||
        title.length < 2 ||
        title.length > 200
    ) {
        continue;
    }


    if (
        /^(go|search|home|menu|main|next|previous|naics)$/i
        .test(title)
    ) {
        continue;
    }


    /*
     * Don't include codes that are
     * obviously years.
     */

    if (
        /^(1997|2002|2007|2012|2017|2022)$/.test(code)
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

        title: title,

        url:
            "/usa-naics/" +
            code +
            "/"

    });
}


/*
 * Sort numeric NAICS codes.
 */

results.sort(
    function(a, b) {

        return Number(a.code) -
               Number(b.code);

    }
);


return results;
```

}

/* =========================================
STRIP HTML
========================================= */

function stripHtml(value) {

```
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
```

}

/* =========================================
DECODE HTML
========================================= */

function decodeHtml(value) {

```
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
```

}

/* =========================================
CLEAN TEXT
========================================= */

function cleanText(value) {

```
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
```

}

/* =========================================
JSON RESPONSE
========================================= */

function jsonResponse(data) {

```
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
```

}
