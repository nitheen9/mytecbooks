export async function onRequest(context) {

    const { code } = context.params;

    if (!code) {
        return notFound("SIC code was not provided.");
    }

    const sicCode = String(code).trim();

    /*
        U.S. SIC codes can be searched at
        2, 3 or 4 digit level.
    */

    if (!/^\d{2,4}$/.test(sicCode)) {
        return notFound(
            "Invalid U.S. SIC code. Please use a 2, 3 or 4 digit SIC code."
        );
    }

    try {

        /*
            Official OSHA SIC Manual URL
        */

        const url =
            "https://www.osha.gov/sic-manual/" +
            encodeURIComponent(sicCode);

        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "MyTecBooks U.S. SIC Search"
            }
        });

        if (!response.ok) {

            return notFound(
                "U.S. SIC code " +
                sicCode +
                " was not found in the OSHA SIC Manual."
            );
        }

        const html = await response.text();

        const data =
            parseSicPage(
                html,
                sicCode
            );

        if (!data.description) {

            return notFound(
                "U.S. SIC code " +
                sicCode +
                " was not found."
            );
        }

        const page =
            createPage(data);

        return new Response(
            page,
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
            "U.S. SIC error:",
            error
        );

        return new Response(
            "Unable to load U.S. SIC information.",
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
   PARSE OSHA PAGE
========================================= */

function parseSicPage(
    html,
    requestedCode
) {

    /*
        Convert HTML into reasonably
        searchable text.
    */

    let text =
        html
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
                /&#039;/gi,
                "'"
            )
            .replace(
                /&quot;/gi,
                '"'
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    /*
        OSHA pages normally contain:

        Division A: ...
        Major Group 01: ...
        Industry Group 011: ...
        0111 Wheat
        Establishments primarily...
    */


    let division =
        "";

    let majorGroup =
        "";

    let industryGroup =
        "";

    let description =
        "";


    /*
        Division
    */

    const divisionMatch =
        text.match(
            /Division\s+([A-J])\s*:\s*([^|]+?)(?=\s+Major Group|\s+\d{2,4}\s)/i
        );

    if (divisionMatch) {

        division =
            cleanText(
                divisionMatch[1] +
                ": " +
                divisionMatch[2]
            );

    }


    /*
        Major Group
    */

    const majorMatch =
        text.match(
            /Major Group\s+(\d{2})\s*:\s*(.+?)(?=\s+Industry Group|\s+\d{2,4}\s+[A-Z])/i
        );

    if (majorMatch) {

        majorGroup =
            cleanText(
                majorMatch[1] +
                ": " +
                majorMatch[2]
            );

    }


    /*
        Industry Group
    */

    const industryMatch =
        text.match(
            /Industry Group\s+(\d{3})\s*:\s*(.+?)(?=\s+\d{4}\s+[A-Z]|\s+\d{3,4}\s+[A-Z])/i
        );

    if (industryMatch) {

        industryGroup =
            cleanText(
                industryMatch[1] +
                ": " +
                industryMatch[2]
            );

    }


    /*
        Main SIC title.

        Example:

        0111 Wheat
    */

    const codeRegex =
        new RegExp(
            "(?:^|\\s)" +
            requestedCode +
            "\\s+([^\\.]+?)(?=\\s+Establishments|\\s+SIC|$)",
            "i"
        );

    const codeMatch =
        text.match(
            codeRegex
        );

    if (codeMatch) {

        description =
            cleanText(
                codeMatch[1]
            );

    }


    /*
        Fallback:
        Look for the first occurrence
        of the requested code.
    */

    if (!description) {

        const fallbackRegex =
            new RegExp(
                requestedCode +
                "\\s+([A-Za-z][A-Za-z0-9 ,;&'()\\-\\.]+)",
                "i"
            );

        const fallback =
            text.match(
                fallbackRegex
            );

        if (fallback) {

            description =
                cleanText(
                    fallback[1]
                );

        }

    }


    /*
        Establishment description
    */

    let details =
        "";

    const detailsMatch =
        text.match(
            /Establishments\s+primarily\s+engaged\s+in\s+(.+?)(?=\s+(?:Wheat farms|SIC|Related|Source|$))/i
        );

    if (detailsMatch) {

        details =
            cleanText(
                "Establishments primarily engaged in " +
                detailsMatch[1]
            );

    }


    /*
        Get examples / bullet-like
        text after the main description.
    */

    const examples =
        extractExamples(
            text,
            requestedCode
        );


    return {

        code:
            requestedCode,

        description:
            description ||
            "",

        division:
            division ||
            "Not available",

        majorGroup:
            majorGroup ||
            "Not available",

        industryGroup:
            industryGroup ||
            "Not available",

        details:
            details ||
            "See the official OSHA SIC Manual for the complete industry description.",

        examples:
            examples

    };

}


/* =========================================
   EXAMPLES
========================================= */

function extractExamples(
    text,
    code
) {

    const result = [];


    /*
        Find section after
        "Establishments..."
    */

    const index =
        text.search(
            /Establishments\s+primarily\s+engaged/i
        );


    if (index < 0) {
        return result;
    }


    let section =
        text.substring(
            index
        );


    /*
        Limit amount of text.
    */

    section =
        section.substring(
            0,
            1800
        );


    /*
        Remove the descriptive sentence.
    */

    section =
        section.replace(
            /Establishments\s+primarily\s+engaged\s+in\s+.+?\.\s*/i,
            ""
        );


    /*
        Split possible examples.
    */

    section
        .split(
            /\s{2,}|;\s*|\s+\|\s+/g
        )
        .map(
            item =>
                cleanText(item)
        )
        .filter(
            item =>
                item.length > 2 &&
                item.length < 150
        )
        .slice(
            0,
            20
        )
        .forEach(
            item => {

                if (
                    !result.includes(item)
                ) {

                    result.push(item);

                }

            }
        );


    return result;
}


/* =========================================
   PAGE
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

    const division =
        escapeHtml(
            data.division
        );

    const majorGroup =
        escapeHtml(
            data.majorGroup
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
        `${data.code} - ${data.description} | U.S. SIC Code`;

    const metaDescription =
        `U.S. SIC Code ${data.code}: ${data.description}. View industry classification, division, major group, industry group and detailed information.`;


    let examplesHtml =
        "";


    if (
        Array.isArray(data.examples) &&
        data.examples.length > 0
    ) {

        examplesHtml = `

            <div class="section">

                <h2>
                    Examples
                </h2>

                <ul>

                    ${data.examples
                        .map(
                            item =>
                                `<li>${escapeHtml(item)}</li>`
                        )
                        .join("")
                    }

                </ul>

            </div>

        `;

    }


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
    --white: #ffffff;

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

.section {

    margin-top: 25px;

    padding: 20px;

    background: #f5f5f8;

    border-left:
        5px solid var(--primary);

    border-radius: 8px;

}

.section h2 {

    margin-top: 0;

}

.section ul {

    margin-bottom: 0;

    padding-left: 22px;

}

.section li {

    margin-bottom: 8px;

    line-height: 1.6;

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
🇺🇸 U.S. SIC Code ${code}
</h1>


<p class="subtitle">

Standard Industrial Classification:
<strong>${description}</strong>

</p>


<div class="card">


<h2>
🏭 SIC ${code} — ${description}
</h2>


<div class="data-row">

<span class="label">
SIC Code
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
Division
</span>

${division}

</div>


<div class="data-row">

<span class="label">
Major Group
</span>

${majorGroup}

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


${examplesHtml}


<div class="source">

<strong>
Official Source:
</strong>

<br>

U.S. Occupational Safety and Health Administration
(OSHA) SIC Manual.

<br><br>

<a
href="https://www.osha.gov/sic-manual/${code}"
target="_blank"
rel="noopener noreferrer">

View SIC ${code} on OSHA →

</a>

</div>


<a
class="back"
href="/usa-sic-search.html">

← U.S. SIC Code Search

</a>


</div>


<footer>

U.S. SIC Code Search<br>

Classification information is based on
the OSHA Standard Industrial Classification
(SIC) Manual.

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
U.S. SIC Code Not Found
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
🇺🇸 U.S. SIC Code Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/usa-sic-search.html">

← U.S. SIC Code Search

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
