export async function onRequest(context) {

    const code =
        String(
            context.params.code || ""
        ).trim();


    /*
     * 2022 U.S. NAICS codes:
     * 2-6 digits for hierarchy requests.
     */

    if (
        !/^\d{2,6}$/.test(code)
    ) {

        return notFound(
            "Invalid U.S. NAICS code."
        );

    }


    try {

        /*
         * Get the official 2022
         * code/title from BLS.
         */

        const blsUrl =
            "https://www.bls.gov/cew/classifications/industry/qcew-naics-hierarchy-crosswalk.htm";


        const blsResponse =
            await fetch(
                blsUrl,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS)",
                        "Accept":
                            "text/html"
                    }
                }
            );


        if (!blsResponse.ok) {

            return notFound(
                "Unable to load the 2022 U.S. NAICS classification."
            );

        }


        const blsHtml =
            await blsResponse.text();


        const records =
            parseBLS2022(
                blsHtml
            );


        /*
         * Exact six-digit code.
         */

        let record =
            records.find(
                function(item) {

                    return item.code === code;

                }
            );


        /*
         * For 2-5 digit parent codes,
         * use the closest 2022 hierarchy
         * available in the BLS data.
         */

        if (
            !record &&
            code.length < 6
        ) {

            record =
                findParentRecord(
                    records,
                    code
                );

        }


        /*
         * If no matching 2022 code exists,
         * return 404.
         */

        if (!record) {

            return notFound(
                "U.S. NAICS code " +
                code +
                " was not found in the 2022 classification."
            );

        }


        let description =
            record.title;


        let industryDetails =
            "";


        /*
         * For six-digit codes, try the
         * Census 2022 detail page.
         *
         * If Census is temporarily unavailable,
         * we still display the valid BLS
         * 2022 title.
         */

        if (
            code.length === 6
        ) {

            const censusData =
                await getCensusDetails(
                    code
                );


            if (
                censusData
            ) {

                if (
                    censusData.description
                ) {

                    description =
                        censusData.description;

                }


                if (
                    censusData.details
                ) {

                    industryDetails =
                        censusData.details;

                }

            }

        }


        const data = {

            code:
                code,

            description:
                description,

            sector:
                "Not available",

            industryGroup:
                record.parentTitle ||
                "Not available",

            details:
                industryDetails ||
                "Official 2022 U.S. NAICS classification. See the U.S. Census Bureau source for the full industry definition."

        };


        return new Response(

            createPage(
                data
            ),

            {

                status: 200,

                headers: {

                    "Content-Type":
                        "text/html; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=86400, s-maxage=604800"

                }

            }

        );

    }
    catch (error) {

        console.error(
            "NAICS detail error:",
            error
        );


        return new Response(

            "Unable to load U.S. NAICS information.",

            {

                status: 500,

                headers: {

                    "Content-Type":
                        "text/plain; charset=UTF-8"

                }

            }

        );

    }

}


/* =========================================
   GET CENSUS DETAILS
========================================= */

async function getCensusDetails(
    code
) {

    const url =
        "https://www.census.gov/naics/" +
        "?details=" +
        encodeURIComponent(code) +
        "&input=" +
        encodeURIComponent(code) +
        "&year=2022";


    try {

        const response =
            await fetch(
                url,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS)",

                        "Accept":
                            "text/html,application/xhtml+xml,text/html"

                    }
                }
            );


        if (
            !response.ok
        ) {

            return null;

        }


        const html =
            await response.text();


        const text =
            htmlToText(
                html
            );


        /*
         * Census 2022 current format:
         *
         * [Button: 513210]
         * Software Publishers:
         * This industry comprises ...
         */


        let description =
            "";


        const descriptionRegex =
            new RegExp(
                "\\[Button:\\s*" +
                escapeRegex(code) +
                "\\]\\s*" +
                "([^:]{2,200}):\\s*" +
                "This industry comprises",
                "i"
            );


        const descriptionMatch =
            text.match(
                descriptionRegex
            );


        if (
            descriptionMatch
        ) {

            description =
                cleanText(
                    descriptionMatch[1]
                );

        }


        /*
         * Alternative:
         *
         * 513210 Software Publishers
         * This industry comprises
         */

        if (
            !description
        ) {

            const alternateRegex =
                new RegExp(
                    "\\b" +
                    escapeRegex(code) +
                    "\\s+" +
                    "([A-Z][A-Za-z0-9 ,&'()\\/.-]{2,200})" +
                    "\\s+This industry comprises",
                    "i"
                );


            const alternateMatch =
                text.match(
                    alternateRegex
                );


            if (
                alternateMatch
            ) {

                description =
                    cleanText(
                        alternateMatch[1]
                    );

            }

        }


        /*
         * Complete industry definition.
         */

        let details =
            "";


        const detailsRegex =
            /This industry comprises\s+(.+?)(?=\s+Cross-References|\s+Illustrative Examples|\s+Table displays|\s+2022 NAICS Manual|$)/i;


        const detailsMatch =
            text.match(
                detailsRegex
            );


        if (
            detailsMatch
        ) {

            details =
                cleanText(
                    "This industry comprises " +
                    detailsMatch[1]
                );

        }


        return {

            description:
                description,

            details:
                details

        };

    }
    catch (error) {

        console.error(
            "Census detail fetch failed:",
            error
        );

        return null;

    }

}


/* =========================================
   PARSE BLS 2022 DATA
========================================= */

function parseBLS2022(
    html
) {

    const records = [];

    const seen =
        new Set();


    const rowRegex =
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;


    let rowMatch;


    while (
        (rowMatch =
            rowRegex.exec(html)) !== null
    ) {

        const cells = [];

        const cellRegex =
            /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;


        let cellMatch;


        while (
            (cellMatch =
                cellRegex.exec(
                    rowMatch[1]
                )) !== null
        ) {

            cells.push(
                cleanCell(
                    cellMatch[1]
                )
            );

        }


        if (
            cells.length < 6
        ) {

            continue;

        }


        const naics6 =
            cells[0];

        const title =
            cells[1];

        const naics5 =
            cells[2];

        const title5 =
            cells[3];

        const naics4 =
            cells[4];

        const title4 =
            cells[5];


        if (
            !/^\d{6}$/.test(naics6)
        ) {

            continue;

        }


        if (
            !title
        ) {

            continue;

        }


        if (
            seen.has(naics6)
        ) {

            continue;

        }


        seen.add(naics6);


        records.push({

            code:
                naics6,

            title:
                title,

            parentCode:
                naics5,

            parentTitle:
                title5,

            parent4Code:
                naics4,

            parent4Title:
                title4

        });

    }


    return records;
}


/* =========================================
   FIND PARENT
========================================= */

function findParentRecord(
    records,
    requestedCode
) {

    /*
     * Example:
     *
     * Request:
     * 51321
     *
     * Find six-digit code:
     * 513210
     */

    const exactPrefix =
        records.find(
            function(item) {

                return item.code.startsWith(
                    requestedCode
                );

            }
        );


    if (
        !exactPrefix
    ) {

        return null;

    }


    let title =
        exactPrefix.title;


    if (
        requestedCode.length === 5 &&
        exactPrefix.parentCode === requestedCode
    ) {

        title =
            exactPrefix.parentTitle ||
            title;

    }


    if (
        requestedCode.length === 4 &&
        exactPrefix.parent4Code === requestedCode
    ) {

        title =
            exactPrefix.parent4Title ||
            title;

    }


    return {

        code:
            requestedCode,

        title:
            title,

        parentTitle:
            exactPrefix.parent4Title ||
            "Not available"

    };

}


/* =========================================
   CREATE HTML PAGE
========================================= */

function createPage(
    data
) {

    const code =
        escapeHtml(
            data.code
        );


    const description =
        escapeHtml(
            data.description
        );


    const sector =
        escapeHtml(
            data.sector
        );


    const industryGroup =
        escapeHtml(
            data.industryGroup
        );


    const details =
        escapeHtml(
            data.details
        );


    const title =
        data.code +
        " - " +
        data.description +
        " | U.S. NAICS Code";


    const metaDescription =
        "2022 U.S. NAICS Code " +
        data.code +
        ": " +
        data.description +
        ". View U.S. NAICS classification and industry details.";


    const censusUrl =
        "https://www.census.gov/naics/?details=" +
        encodeURIComponent(
            data.code
        ) +
        "&input=" +
        encodeURIComponent(
            data.code
        ) +
        "&year=2022";


    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="index, follow">

<meta name="description"
      content="${escapeHtml(metaDescription)}">

<link rel="icon"
      type="image/png"
      href="/favicon.png">

<title>
${escapeHtml(title)}
</title>


<style>

:root {

    --primary: #f48120;
    --dark: #1e1e24;
    --light: #f9f9fb;
    --border: #e0e0e6;

}

* {
    box-sizing: border-box;
}

body {

    margin: 0;

    padding: 20px;

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;

    background: var(--light);

    color: var(--dark);

}

.container {

    max-width: 850px;

    margin: 0 auto;

}

h1 {

    text-align: center;

    margin: 10px 0 12px;

    font-size: 30px;

}

.subtitle {

    text-align: center;

    color: #666;

    line-height: 1.6;

    margin-bottom: 25px;

}

.card {

    background: #fff;

    padding: 28px;

    border-radius: 12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.06);

    border-top:
        5px solid
        var(--primary);

}

.card h2 {

    color: #333;

    margin-top: 0;

    line-height: 1.4;

}

.data-row {

    padding:
        15px 0;

    border-bottom:
        1px solid
        var(--border);

    line-height:
        1.7;

}

.data-row:last-child {

    border-bottom:
        none;

}

.label {

    font-weight:
        700;

    display:
        block;

    margin-bottom:
        4px;

}

.code {

    display:
        inline-block;

    background:
        var(--dark);

    color:
        #fff;

    padding:
        7px 12px;

    border-radius:
        6px;

    font-weight:
        700;

    letter-spacing:
        1px;

}

.source {

    margin-top:
        25px;

    padding:
        15px;

    background:
        #fff8ef;

    border-radius:
        8px;

    line-height:
        1.6;

    font-size:
        14px;

}

.source a {

    color:
        #b85c00;

    font-weight:
        700;

}

.back {

    display:
        inline-block;

    margin-top:
        25px;

    padding:
        12px 18px;

    background:
        var(--dark);

    color:
        #fff;

    text-decoration:
        none;

    border-radius:
        7px;

    font-weight:
        700;

}

footer {

    text-align:
        center;

    color:
        #777;

    font-size:
        13px;

    margin:
        30px 0 10px;

    line-height:
        1.6;

}

@media(max-width:600px) {

    body {
        padding: 12px;
    }

    h1 {
        font-size: 24px;
    }

    .card {
        padding: 18px;
    }

}

</style>

</head>

<body>

<div class="container">

<h1>
🇺🇸 U.S. NAICS Code ${code}
</h1>

<p class="subtitle">

2022 North American Industry Classification System:
<strong>${description}</strong>

</p>


<div class="card">

<h2>
🏭 NAICS ${code} — ${description}
</h2>


<div class="data-row">

<span class="label">
NAICS Code
</span>

<span class="code">
${code}
</span>

</div>


<div class="data-row">

<span class="label">
Industry Description
</span>

${description}

</div>


<div class="data-row">

<span class="label">
Sector
</span>

${sector}

</div>


<div class="data-row">

<span class="label">
Industry Group
</span>

${industryGroup}

</div>


<div class="data-row">

<span class="label">
Industry Details
</span>

${details}

</div>


<div class="source">

<strong>
Official Sources:
</strong>

<br>

U.S. Bureau of Labor Statistics —
2022 NAICS hierarchy/crosswalk.

<br><br>

U.S. Census Bureau —
2022 NAICS classification.

<br><br>

<a
href="${escapeHtml(censusUrl)}"
target="_blank"
rel="noopener noreferrer">

View NAICS ${code} on U.S. Census Bureau →

</a>

</div>


<a
class="back"
href="/usa-naics-search.html">

← U.S. NAICS Code Search

</a>

</div>


<footer>

U.S. NAICS Code Search<br>

2022 U.S. NAICS Classification<br>

Sources: U.S. Census Bureau and U.S. Bureau of Labor Statistics

</footer>

</div>

</body>

</html>`;

}


/* =========================================
   NOT FOUND
========================================= */

function notFound(
    message
) {

    return new Response(

        `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="noindex, follow">

<title>
U.S. NAICS Code Not Found
</title>

<style>

body {

    font-family:
        Arial,
        sans-serif;

    background:
        #f9f9fb;

    padding:
        40px 20px;

    text-align:
        center;

}

.box {

    max-width:
        650px;

    margin:
        auto;

    background:
        white;

    padding:
        30px;

    border-radius:
        12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);

}

h1 {

    color:
        #1e1e24;

}

a {

    display:
        inline-block;

    margin-top:
        20px;

    padding:
        12px 18px;

    background:
        #f48120;

    color:
        white;

    text-decoration:
        none;

    border-radius:
        7px;

    font-weight:
        bold;

}

</style>

</head>

<body>

<div class="box">

<h1>
🇺🇸 U.S. NAICS Code Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/usa-naics-search.html">

← U.S. NAICS Code Search

</a>

</div>

</body>

</html>`,

        {

            status:
                404,

            headers: {

                "Content-Type":
                    "text/html; charset=UTF-8"

            }

        }
    );
}


/* =========================================
   HTML -> TEXT
========================================= */

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
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


/* =========================================
   CLEAN CELL
========================================= */

function cleanCell(
    value
) {

    return htmlToText(
        value
    );

}


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(
    value
) {

    return String(
        value || ""
    )

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
   REGEX ESCAPE
========================================= */

function escapeRegex(
    value
) {

    return String(value)

        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
