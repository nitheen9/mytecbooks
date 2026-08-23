export async function onRequest(context) {

    const code =
        context.params.code;


    if (!code) {

        return notFound(
            "NAICS code was not provided."
        );
    }


    const naicsCode =
        String(code).trim();


    /*
     * 2022 U.S. NAICS codes can be
     * 2 to 6 digits.
     */

    if (
        !/^\d{2,6}$/.test(naicsCode)
    ) {

        return notFound(
            "Invalid U.S. NAICS code. Please use a 2 to 6 digit NAICS code."
        );
    }


    try {

        /*
         * Official U.S. Census Bureau
         * 2022 NAICS search page.
         */

        const url =
            "https://www.census.gov/naics/?details=" +
            encodeURIComponent(naicsCode) +
            "&input=" +
            encodeURIComponent(naicsCode) +
            "&year=2022";


        const response =
            await fetch(url, {

                headers: {

                    "User-Agent":
                        "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",

                    "Accept":
                        "text/html,application/xhtml+xml"

                }

            });


        if (!response.ok) {

            return notFound(
                "U.S. NAICS code " +
                naicsCode +
                " was not found."
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
                " was not found in the 2022 NAICS classification."
            );
        }


        return new Response(

            createPage(data),

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
   PARSE CENSUS NAICS PAGE
========================================= */

function parseNAICSPage(
    html,
    requestedCode
) {

    let text =
        html;


    /*
     * Remove scripts/styles.
     */

    text =
        text.replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        );


    text =
        text.replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        );


    text =
        text.replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
            " "
        );


    /*
     * Convert common HTML elements
     * into readable text.
     */

    text =
        text.replace(
            /<\/(p|div|li|h1|h2|h3|h4|h5|tr|td|br)>/gi,
            " "
        );


    text =
        text.replace(
            /<[^>]+>/g,
            " "
        );


    text =
        decodeHtml(text);


    text =
        cleanText(text);


    let title =
        "";


    let description =
        "";


    /*
     * Look for:
     *
     * 541511 Custom Computer Programming Services
     *
     * or:
     *
     * 513210 Software Publishers
     */


    const titleRegex =
        new RegExp(
            "(?:^|\\s)" +
            escapeRegex(requestedCode) +
            "\\s+([^:]+?)(?=\\s+(?:This industry|This U\\.S\\. industry|See industry description|Cross-References|Illustrative Examples|$))",
            "i"
        );


    const titleMatch =
        text.match(titleRegex);


    if (titleMatch) {

        title =
            cleanText(
                titleMatch[1]
            );
    }


    /*
     * Alternative:
     *
     * Search the visible Census
     * result around the requested code.
     */

    if (!title) {

        const simpleRegex =
            new RegExp(
                "(?:^|\\s)" +
                escapeRegex(requestedCode) +
                "\\s+([A-Za-z][A-Za-z0-9,&'()\\-\\.\\/ ]{2,150})",
                "i"
            );


        const simpleMatch =
            text.match(simpleRegex);


        if (simpleMatch) {

            title =
                cleanText(
                    simpleMatch[1]
                );


            /*
             * Remove trailing descriptive
             * sentences.
             */

            title =
                title.split(
                    /\s+(?:This industry|This U\.S\. industry|Cross-References|Illustrative Examples)\b/i
                )[0];


            title =
                cleanText(title);
        }
    }


    /*
     * Extract the actual definition.
     */

    const definitionRegex =
        /(?:This industry comprises|This U\.S\. industry comprises)\s+(.+?)(?=\s+Cross-References\.|\s+Illustrative Examples:|\s+Table displays|\s+2022 NAICS Definition|$)/i;


    const definitionMatch =
        text.match(
            definitionRegex
        );


    if (definitionMatch) {

        description =
            cleanText(
                definitionMatch[0]
            );
    }


    /*
     * Fallback description.
     */

    if (!description) {

        description =
            "Official 2022 U.S. NAICS classification information from the U.S. Census Bureau.";
    }


    return {

        code:
            requestedCode,

        title:
            title,

        description:
            description

    };
}


/* =========================================
   CREATE PAGE
========================================= */

function createPage(data) {

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


    const pageTitle =
        `${data.code} - ${data.title} | U.S. NAICS Code`;


    const metaDescription =
        `U.S. NAICS Code ${data.code}: ${data.title}. View official 2022 NAICS industry classification and description from the U.S. Census Bureau.`;


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
src="https://www.googletagmanager.com/gtag/js?id=G-BP9YJW8LB9"></script>

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

    background: white;

    padding: 28px;

    border-radius: 12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.06);

    border-top:
        5px solid var(--primary);
}

.card h2 {

    color: #333;

    margin-top: 0;
}

.data-row {

    padding: 15px 0;

    border-bottom:
        1px solid var(--border);

    line-height: 1.7;
}

.data-row:last-child {

    border-bottom: none;
}

.label {

    font-weight: 700;

    display: block;

    margin-bottom: 4px;
}

.code {

    display: inline-block;

    background: var(--dark);

    color: white;

    padding: 7px 12px;

    border-radius: 6px;

    font-weight: 700;

    letter-spacing: 1px;
}

.source {

    margin-top: 25px;

    padding: 15px;

    background: #fff8ef;

    border-radius: 8px;

    line-height: 1.6;

    font-size: 14px;
}

.source a {

    color: #b85c00;

    font-weight: 700;
}

.back {

    display: inline-block;

    margin-top: 25px;

    padding: 12px 18px;

    background: var(--dark);

    color: white;

    text-decoration: none;

    border-radius: 7px;

    font-weight: 700;
}

footer {

    text-align: center;

    color: #777;

    font-size: 13px;

    margin: 30px 0 10px;

    line-height: 1.6;
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

North American Industry Classification System:
<strong>${title}</strong>

</p>


<div class="card">


<h2>
🏭 NAICS ${code} — ${title}
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
Industry Title
</span>

${title}

</div>


<div class="data-row">

<span class="label">
2022 NAICS Industry Description
</span>

${description}

</div>


<div class="source">

<strong>
Official Source:
</strong>

<br>

U.S. Census Bureau
North American Industry Classification System.

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
href="/usa-naics-search.html">

← U.S. NAICS Code Search

</a>


</div>


<footer>

U.S. NAICS Code Search<br>

Classification information is based on
the 2022 North American Industry Classification
System published by the U.S. Census Bureau.

</footer>


</div>

</body>

</html>`;
}


/* =========================================
   NOT FOUND
========================================= */

function notFound(message) {

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

            status: 404,

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
   DECODE HTML
========================================= */

function decodeHtml(value) {

    return String(value || "")

        .replace(/&nbsp;/gi, " ")

        .replace(/&amp;/gi, "&")

        .replace(/&quot;/gi, '"')

        .replace(/&#039;/gi, "'")

        .replace(/&#39;/gi, "'")

        .replace(/&lt;/gi, "<")

        .replace(/&gt;/gi, ">")

        .replace(
            /&#(\d+);/g,
            function(match, dec) {

                return String.fromCharCode(
                    Number(dec)
                );
            }
        );
}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

    return String(value ?? "")

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

function escapeRegex(value) {

    return String(value)

        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
}
