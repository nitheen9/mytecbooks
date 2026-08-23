export async function onRequest(context) {

    const code =
        context.params.code;


    if (!code) {

        return notFound(
            "NAICS code was not provided."
        );

    }


    const naicsCode =
        String(code)
        .trim();


    /*
     * U.S. NAICS codes can be
     * 2 to 6 digits.
     */

    if (
        !/^\d{2,6}$/.test(
            naicsCode
        )
    ) {

        return notFound(
            "Invalid U.S. NAICS code. Please use a 2 to 6 digit NAICS code."
        );

    }


    try {


        /*
         * Official Census 2022 NAICS page.
         */

        const url =
            "https://www.census.gov/naics/?details=" +
            encodeURIComponent(
                naicsCode
            ) +
            "&input=" +
            encodeURIComponent(
                naicsCode
            ) +
            "&year=2022";


        const response =
            await fetch(
                url,
                {

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS)"

                    }

                }
            );


        if (!response.ok) {

            return notFound(
                "U.S. NAICS code " +
                naicsCode +
                " was not found in the 2022 NAICS classification."
            );

        }


        const html =
            await response.text();


        const data =
            parseNAICSPage(
                html,
                naicsCode
            );


        if (
            !data.title
        ) {

            return notFound(
                "U.S. NAICS code " +
                naicsCode +
                " was not found."
            );

        }


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
            "NAICS error:",
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
   PARSE CENSUS PAGE
========================================= */

function parseNAICSPage(
    html,
    requestedCode
) {


    let text =
        html;


    /*
     * Remove scripts.
     */

    text =
        text.replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        );


    /*
     * Remove styles.
     */

    text =
        text.replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        );


    /*
     * Convert common HTML elements
     * into spaces.
     */

    text =
        text.replace(
            /<br\s*\/?>/gi,
            " "
        );


    text =
        text.replace(
            /<\/p>/gi,
            " "
        );


    text =
        text.replace(
            /<\/div>/gi,
            " "
        );


    /*
     * Remove remaining HTML.
     */

    text =
        text.replace(
            /<[^>]+>/g,
            " "
        );


    /*
     * Decode entities.
     */

    text =
        decodeHtml(
            text
        );


    /*
     * Normalize spaces.
     */

    text =
        text.replace(
            /\s+/g,
            " "
        )
        .trim();


    let title =
        "";


    let description =
        "";


    /*
     * Main title pattern:
     *
     * 541511 Custom Computer Programming Services
     */

    const titleRegex =
        new RegExp(
            "(?:^|\\s)" +
            escapeRegex(
                requestedCode
            ) +
            "\\s*[:\\-]?\\s+" +
            "([A-Z][A-Za-z0-9&'(),.\\-\\/ ]{2,150}?)" +
            "(?=\\s+This U\\.S\\. industry|\\s+This industry|\\s+Cross-References|\\s+Illustrative Examples|\\s+2022 NAICS Definition|\\s+\\d{2,6}\\s|$)",
            "i"
        );


    const titleMatch =
        text.match(
            titleRegex
        );


    if (
        titleMatch
    ) {

        title =
            cleanText(
                titleMatch[1]
            );

    }


    /*
     * Alternative pattern:
     *
     * 541511: Custom Computer Programming Services
     */

    if (
        !title
    ) {


        const altRegex =
            new RegExp(
                escapeRegex(
                    requestedCode
                ) +
                "\\s*:\\s*" +
                "([^|]{2,150})",
                "i"
            );


        const altMatch =
            text.match(
                altRegex
            );


        if (
            altMatch
        ) {

            title =
                cleanText(
                    altMatch[1]
                );

        }

    }


    /*
     * Alternative Census wording:
     *
     * Button: 541511 Custom Computer
     * Programming Services
     */

    if (
        !title
    ) {


        const fallbackRegex =
            new RegExp(
                escapeRegex(
                    requestedCode
                ) +
                "\\s+" +
                "([A-Z][A-Za-z0-9&'(),.\\-\\/ ]{2,150})",
                "i"
            );


        const fallbackMatch =
            text.match(
                fallbackRegex
            );


        if (
            fallbackMatch
        ) {

            title =
                cleanText(
                    fallbackMatch[1]
                );

        }

    }


    /*
     * Remove unwanted suffixes.
     */

    title =
        title
        .replace(
            /\s*\^(?:T|US)\s*$/i,
            ""
        )
        .trim();


    /*
     * Find the description.
     */

    const descriptionPatterns = [

        new RegExp(
            escapeRegex(
                requestedCode
            ) +
            "[\\s\\S]{0,250}?" +
            "This U\\.S\\. industry comprises\\s+(.+?)(?=\\s+Cross-References|\\s+Illustrative Examples|\\s+Index Entries|\\s+2022 NAICS Definition|$)",
            "i"
        ),

        new RegExp(
            escapeRegex(
                requestedCode
            ) +
            "[\\s\\S]{0,250}?" +
            "This industry comprises\\s+(.+?)(?=\\s+Cross-References|\\s+Illustrative Examples|\\s+Index Entries|\\s+2022 NAICS Definition|$)",
            "i"
        )

    ];


    for (
        const pattern of descriptionPatterns
    ) {


        const match =
            text.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            description =
                cleanText(
                    match[1]
                );


            break;

        }

    }


    /*
     * Fallback description.
     */

    if (
        !description
    ) {


        const generic =
            text.match(
                /This U\.S\. industry comprises\s+(.+?)(?=\s+Cross-References|\s+Illustrative Examples|\s+2022 NAICS Definition|$)/i
            );


        if (
            generic &&
            generic[1]
        ) {

            description =
                cleanText(
                    generic[1]
                );

        }

    }


    /*
     * Try to find sector information.
     */

    let sector =
        "";


    const sectorMatch =
        text.match(
            /Sector\s+(\d{2})\s*[—\-]\s*([^]+?)(?=\s+\d{2,6}\s|\s+This industry|\s+This U\.S\. industry)/i
        );


    if (
        sectorMatch
    ) {

        sector =
            cleanText(
                sectorMatch[1] +
                " - " +
                sectorMatch[2]
            );

    }


    /*
     * Try to find the NAICS hierarchy
     * around the requested code.
     */

    let hierarchy =
        "";


    const hierarchyMatch =
        text.match(
            /(\d{2,5})\s+([A-Z][A-Za-z0-9&'(),.\/\- ]{2,100})\s+This industry comprises/i
        );


    if (
        hierarchyMatch
    ) {

        hierarchy =
            cleanText(
                hierarchyMatch[1] +
                " - " +
                hierarchyMatch[2]
            );

    }


    return {

        code:
            requestedCode,

        title:
            title,

        description:
            description,

        sector:
            sector,

        hierarchy:
            hierarchy

    };

}


/* =========================================
   CREATE PAGE
========================================= */

function createPage(
    data
) {


    const code =
        escapeHtml(
            data.code
        );


    const title =
        escapeHtml(
            data.title
        );


    const description =
        escapeHtml(
            data.description
        );


    const sector =
        escapeHtml(
            data.sector ||
            "Not available"
        );


    const hierarchy =
        escapeHtml(
            data.hierarchy ||
            "Not available"
        );


    const pageTitle =
        data.code +
        " - " +
        data.title +
        " | U.S. NAICS Code";


    const metaDescription =
        "U.S. NAICS Code " +
        data.code +
        ": " +
        data.title +
        ". View 2022 NAICS industry classification and description.";


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
${escapeHtml(pageTitle)}
</title>


<!-- Google Analytics -->

<script async
src="https://www.googletagmanager.com/gtag/js?id=G-BP9YJW8LB9">
</script>

<script>

window.dataLayer =
window.dataLayer || [];

function gtag() {

    dataLayer.push(arguments);

}

gtag('js', new Date());

gtag('config', 'G-BP9YJW8LB9');

</script>


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

    background:
        var(--light);

    color:
        var(--dark);

}

.container {

    max-width:
        850px;

    margin:
        0 auto;

}

h1 {

    text-align:
        center;

    margin:
        10px 0 12px;

    font-size:
        30px;

}

.subtitle {

    text-align:
        center;

    color:
        #666;

    line-height:
        1.6;

    margin-bottom:
        25px;

}

.card {

    background:
        white;

    padding:
        28px;

    border-radius:
        12px;

    box-shadow:
        0 4px 18px rgba(0,0,0,.06);

    border-top:
        5px solid var(--primary);

}

.card h2 {

    color:
        #333;

    margin-top:
        0;

}

.data-row {

    padding:
        15px 0;

    border-bottom:
        1px solid var(--border);

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
        white;

    padding:
        7px 12px;

    border-radius:
        6px;

    font-weight:
        700;

    letter-spacing:
        1px;

}

.description {

    line-height:
        1.8;

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
        white;

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

        padding:
            12px;

    }

    h1 {

        font-size:
            24px;

    }

    .card {

        padding:
            18px;

    }

}

</style>

</head>


<body>


<div class="container">


<h1>

🇺🇸 U.S. NAICS Code
${code}

</h1>


<p class="subtitle">

North American Industry Classification System:
<strong>
${title}
</strong>

</p>


<div class="card">


<h2>

🏭 NAICS ${code}
—
${title}

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

<div class="description">

${description || "See the official U.S. Census Bureau NAICS classification for the complete industry description."}

</div>

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

${hierarchy}

</div>


<div class="source">

<strong>

Official Source:

</strong>

<br>

U.S. Census Bureau
—
2022 North American Industry Classification System.

<br><br>

<a
href="https://www.census.gov/naics/?details=${encodeURIComponent(data.code)}&input=${encodeURIComponent(data.code)}&year=2022"
target="_blank"
rel="noopener noreferrer">

View NAICS ${code} on U.S. Census Bureau →

</a>

</div>


<a
class="back"
href="/usa-naics-search">

← U.S. NAICS Code Search

</a>


</div>


<footer>

U.S. NAICS Code Search<br>

Classification information is based on
the 2022 U.S. NAICS classification.

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

<a href="/usa-naics-search">

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


/* =========================================
   REGEX ESCAPE
========================================= */

function escapeRegex(
    value
) {


    return String(
        value
    )

        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


/* =========================================
   DECODE HTML
========================================= */

function decodeHtml(
    value
) {


    return String(
        value || ""
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
        );

}
