export async function onRequest(context) {

    const { cik } = context.params;

    /* =========================================
       VALIDATE CIK
    ========================================= */

    if (!cik) {
        return notFound("CIK was not provided.");
    }

    const cleanCik =
        String(cik)
            .replace(/\D/g, "")
            .padStart(10, "0");

    if (!/^\d{10}$/.test(cleanCik)) {
        return notFound("Invalid SEC CIK.");
    }


    /* =========================================
       SEC API
    ========================================= */

    const apiUrl =
        "https://data.sec.gov/submissions/CIK" +
        cleanCik +
        ".json";


    try {

        const response = await fetch(apiUrl, {

            headers: {

                "User-Agent":
                    "MyTecBooks mytecbooks.pages.dev contact@example.com",

                "Accept":
                    "application/json"

            }

        });


        if (!response.ok) {

            if (response.status === 404) {

                return notFound(
                    "SEC company/entity not found for CIK " +
                    cleanCik
                );

            }

            throw new Error(
                "SEC API returned HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!data || !data.name) {

            return notFound(
                "No SEC company information found."
            );

        }


        const html =
            createPage(
                data,
                cleanCik
            );


        return new Response(
            html,
            {

                status: 200,

                headers: {

                    "Content-Type":
                        "text/html; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=3600, s-maxage=86400"

                }

            }
        );

    }
    catch (error) {

        console.error(
            "SEC company error:",
            error
        );


        return new Response(

            `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>SEC Company Error</title>

<style>

body {

    font-family:
        Arial,
        sans-serif;

    background:
        #f4f8ff;

    margin: 0;

    padding: 30px 15px;

    color: #172033;

}

.box {

    max-width: 650px;

    margin: 50px auto;

    background: white;

    padding: 30px;

    border-radius: 14px;

    box-shadow:
        0 5px 25px
        rgba(0,0,0,.08);

    text-align: center;

}

h1 {

    color: #0d47a1;

}

a {

    display: inline-block;

    margin-top: 20px;

    padding: 12px 18px;

    background: #1976d2;

    color: white;

    text-decoration: none;

    border-radius: 8px;

    font-weight: 700;

}

</style>

</head>

<body>

<div class="box">

<h1>⚠️ Unable to Load SEC Data</h1>

<p>

The SEC company information could not
be loaded right now.

</p>

<p>

Please try again later.

</p>

<a href="/">

← Back to MyTecBooks

</a>

</div>

</body>

</html>`,

            {

                status: 500,

                headers: {

                    "Content-Type":
                        "text/html; charset=UTF-8"

                }

            }

        );

    }

}


/* =========================================
   CREATE COMPANY PAGE
========================================= */

function createPage(data, cik) {


    const companyName =
        escapeHtml(
            data.name ||
            "N/A"
        );


    const entityType =
        escapeHtml(
            data.entityType ||
            "N/A"
        );


    const sic =
        escapeHtml(
            data.sic ||
            "N/A"
        );


    const sicDescription =
        escapeHtml(
            data.sicDescription ||
            "N/A"
        );


    const ein =
        escapeHtml(
            data.ein ||
            "N/A"
        );


    const stateOfIncorporation =
        escapeHtml(
            data.stateOfIncorporation ||
            "N/A"
        );


    const fiscalYearEnd =
        escapeHtml(
            data.fiscalYearEnd ||
            "N/A"
        );


    const category =
        escapeHtml(
            data.category ||
            "N/A"
        );


    const formerNames =
        Array.isArray(data.formerNames)
            ? data.formerNames
            : [];


    const tickers =
        Array.isArray(data.tickers)
            ? data.tickers
            : [];


    const exchanges =
        Array.isArray(data.exchanges)
            ? data.exchanges
            : [];


    /* =========================================
       ADDRESS
    ========================================= */

    const addresses =
        data.addresses || {};


    const business =
        addresses.business || {};


    const mailing =
        addresses.mailing || {};


    const businessAddress =
        formatAddress(
            business
        );


    const mailingAddress =
        formatAddress(
            mailing
        );


    /* =========================================
       TICKERS
    ========================================= */

    let tickerHtml =
        "<span class=\"muted\">N/A</span>";


    if (tickers.length > 0) {

        tickerHtml =
            tickers
                .map(function(ticker, index) {

                    const exchange =
                        exchanges[index] ||
                        "";

                    return `
                        <span class="ticker">

                            ${escapeHtml(
                                ticker
                            )}

                            ${
                                exchange
                                    ? " - " +
                                      escapeHtml(
                                          exchange
                                      )
                                    : ""
                            }

                        </span>
                    `;

                })
                .join("");

    }


    /* =========================================
       FORMER NAMES
    ========================================= */

    let formerNamesHtml =
        "<span class=\"muted\">None listed</span>";


    if (formerNames.length > 0) {

        formerNamesHtml =
            "<ul>";

        formerNames.forEach(
            function(item) {

                formerNamesHtml +=
                    "<li>" +
                    escapeHtml(item.name) +
                    "</li>";

            }
        );

        formerNamesHtml +=
            "</ul>";

    }


    /* =========================================
       RECENT FILINGS
    ========================================= */

    const recent =
        data.filings &&
        data.filings.recent
            ? data.filings.recent
            : null;


    let filingsHtml =
        "<p class=\"muted\">No recent filings available.</p>";


    if (
        recent &&
        Array.isArray(recent.form) &&
        recent.form.length > 0
    ) {

        const count =
            Math.min(
                recent.form.length,
                10
            );


        filingsHtml =
            `<div class="filings">`;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const form =
                recent.form[i] ||
                "N/A";


            const filingDate =
                recent.filingDate &&
                recent.filingDate[i]
                    ? recent.filingDate[i]
                    : "N/A";


            const accession =
                recent.accessionNumber &&
                recent.accessionNumber[i]
                    ? recent.accessionNumber[i]
                    : "";


            const primaryDocument =
                recent.primaryDocument &&
                recent.primaryDocument[i]
                    ? recent.primaryDocument[i]
                    : "";


            let filingLink =
                "#";


            if (
                accession &&
                primaryDocument
            ) {

                const accessionClean =
                    accession.replace(
                        /-/g,
                        ""
                    );


                filingLink =
                    "https://www.sec.gov/Archives/edgar/data/" +
                    Number(cik) +
                    "/" +
                    accessionClean +
                    "/" +
                    primaryDocument;

            }


            filingsHtml += `

                <div class="filing">

                    <div>

                        <strong>
                            ${escapeHtml(form)}
                        </strong>

                        <br>

                        <span>
                            ${escapeHtml(filingDate)}
                        </span>

                    </div>

                    ${
                        filingLink !== "#"
                            ? `
                                <a
                                    href="${escapeHtml(
                                        filingLink
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer">

                                    View Filing →

                                </a>
                              `
                            : ""
                    }

                </div>

            `;

        }


        filingsHtml +=
            "</div>";

    }


    /* =========================================
       SEC EDGAR URL
    ========================================= */

    const secUrl =
        "https://www.sec.gov/edgar/browse/?CIK=" +
        encodeURIComponent(
            cik
        );


    /* =========================================
       TITLE
    ========================================= */

    const title =
        `${data.name || "SEC Company"} - SEC CIK ${cik} | MyTecBooks`;


    const description =
        `SEC EDGAR company information for ${data.name || "company"}, CIK ${cik}. View ticker, exchange, address, state of incorporation, SIC and recent SEC filings.`;


    /* =========================================
       HTML
    ========================================= */

    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="index, follow">

<meta name="description"
      content="${escapeHtml(
          description
      )}">

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

gtag(
    'config',
    'G-BP9YJW8LB9'
);

</script>


<style>

:root {

    --primary:
        #1976d2;

    --primary-dark:
        #0d47a1;

    --secondary:
        #00a6ff;

    --dark:
        #172033;

    --light:
        #f3f8ff;

    --border:
        #d8e3f0;

    --white:
        #ffffff;

}

* {

    box-sizing:
        border-box;

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
        linear-gradient(
            135deg,
            #eef7ff,
            #f8fbff
        );

    color:
        var(--dark);

}

.container {

    max-width:
        900px;

    margin:
        0 auto;

}

h1 {

    text-align:
        center;

    font-size:
        30px;

    margin:
        10px 0 8px;

}

.intro {

    text-align:
        center;

    color:
        #667085;

    line-height:
        1.6;

    margin-bottom:
        25px;

}

.card {

    background:
        var(--white);

    padding:
        28px;

    border-radius:
        14px;

    border-top:
        5px solid var(--primary);

    box-shadow:
        0 5px 22px
        rgba(25,118,210,.10);

}

.card h2 {

    color:
        var(--primary-dark);

    margin-top:
        0;

}

.row {

    padding:
        14px 0;

    border-bottom:
        1px solid var(--border);

    line-height:
        1.6;

    word-break:
        break-word;

}

.row:last-child {

    border-bottom:
        none;

}

.label {

    font-weight:
        700;

    color:
        #24324a;

}

.cik {

    display:
        inline-block;

    padding:
        6px 10px;

    border-radius:
        6px;

    background:
        var(--primary);

    color:
        white;

    font-weight:
        700;

}

.ticker {

    display:
        inline-block;

    margin:
        4px 5px 4px 0;

    padding:
        6px 10px;

    border-radius:
        6px;

    background:
        #e8f3ff;

    color:
        var(--primary-dark);

    font-weight:
        700;

}

.muted {

    color:
        #7b8794;

}

ul {

    margin:
        8px 0;

    padding-left:
        20px;

}

.filings {

    margin-top:
        10px;

}

.filing {

    display:
        flex;

    justify-content:
        space-between;

    gap:
        15px;

    align-items:
        center;

    padding:
        13px 0;

    border-bottom:
        1px solid var(--border);

}

.filing span {

    color:
        #667085;

    font-size:
        14px;

}

.filing a {

    color:
        var(--primary);

    font-weight:
        700;

    text-decoration:
        none;

    white-space:
        nowrap;

}

.filing a:hover {

    text-decoration:
        underline;

}

.buttons {

    margin-top:
        24px;

    display:
        flex;

    gap:
        10px;

    flex-wrap:
        wrap;

}

.button {

    display:
        inline-block;

    padding:
        12px 18px;

    border-radius:
        8px;

    text-decoration:
        none;

    font-weight:
        700;

    background:
        var(--primary);

    color:
        white;

}

.button.secondary {

    background:
        var(--dark);

}

.button:hover {

    opacity:
        .9;

}

footer {

    text-align:
        center;

    color:
        #6b7280;

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

    .filing {

        display:
            block;

    }

    .filing a {

        display:
            inline-block;

        margin-top:
            7px;

    }

}

</style>

</head>


<body>

<div class="container">


<h1>

🏢 ${companyName}

</h1>


<p class="intro">

SEC EDGAR company/entity information

for CIK

<strong>
${escapeHtml(cik)}
</strong>

</p>


<div class="card">


<h2>
🏢 Company Information
</h2>


<div class="row">

<span class="label">
Company / Entity Name:
</span>

<br>

${companyName}

</div>


<div class="row">

<span class="label">
SEC CIK:
</span>

<br>

<span class="cik">
${escapeHtml(cik)}
</span>

</div>


<div class="row">

<span class="label">
Ticker / Exchange:
</span>

<br>

${tickerHtml}

</div>


<div class="row">

<span class="label">
Entity Type:
</span>

<br>

${entityType}

</div>


<div class="row">

<span class="label">
SIC:
</span>

<br>

${sic}

</div>


<div class="row">

<span class="label">
SIC Description:
</span>

<br>

${sicDescription}

</div>


<div class="row">

<span class="label">
EIN:
</span>

<br>

${ein}

</div>


<div class="row">

<span class="label">
State of Incorporation:
</span>

<br>

${stateOfIncorporation}

</div>


<div class="row">

<span class="label">
Fiscal Year End:
</span>

<br>

${fiscalYearEnd}

</div>


<div class="row">

<span class="label">
SEC Category:
</span>

<br>

${category}

</div>


<h2>
📍 Address Information
</h2>


<div class="row">

<span class="label">
Business Address:
</span>

<br>

${businessAddress}

</div>


<div class="row">

<span class="label">
Mailing Address:
</span>

<br>

${mailingAddress}

</div>


<h2>
🔄 Former Names
</h2>

<div class="row">

${formerNamesHtml}

</div>


<h2>
📄 Recent SEC Filings
</h2>

${filingsHtml}


<div class="buttons">

<a
    class="button"
    href="${escapeHtml(secUrl)}"
    target="_blank"
    rel="noopener noreferrer">

    View Company on SEC EDGAR →

</a>
</div>
</div>
<footer>

SEC EDGAR information is retrieved
from the U.S. Securities and Exchange Commission.

<br>

This page is an independent presentation
of publicly available SEC data.

</footer>


</div>

</body>

</html>`;
}


/* =========================================
   ADDRESS FORMAT
========================================= */

function formatAddress(address) {

    if (!address) {

        return `
            <span class="muted">
                Not available
            </span>
        `;

    }


    const parts = [];


    if (address.street1) {

        parts.push(
            address.street1
        );

    }


    if (address.street2) {

        parts.push(
            address.street2
        );

    }


    const cityStateZip = [];


    if (address.city) {

        cityStateZip.push(
            address.city
        );

    }


    if (address.stateOrCountry) {

        cityStateZip.push(
            address.stateOrCountry
        );

    }


    if (address.zipCode) {

        cityStateZip.push(
            address.zipCode
        );

    }


    if (cityStateZip.length > 0) {

        parts.push(
            cityStateZip.join(", ")
        );

    }


    if (address.country) {

        parts.push(
            address.country
        );

    }


    if (parts.length === 0) {

        return `
            <span class="muted">
                Not available
            </span>
        `;

    }


    return escapeHtml(
        parts.join(", ")
    );

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

<title>SEC Company Not Found</title>

<style>

body {

    margin: 0;

    padding: 30px 15px;

    font-family:
        Arial,
        sans-serif;

    background:
        #f4f8ff;

    text-align:
        center;

}

.box {

    max-width:
        650px;

    margin:
        50px auto;

    background:
        white;

    padding:
        30px;

    border-radius:
        14px;

    box-shadow:
        0 5px 20px
        rgba(0,0,0,.08);

}

h1 {

    color:
        #0d47a1;

}

a {

    display:
        inline-block;

    margin-top:
        20px;

    padding:
        12px 18px;

    background:
        #1976d2;

    color:
        white;

    text-decoration:
        none;

    border-radius:
        8px;

    font-weight:
        700;

}

</style>

</head>

<body>

<div class="box">

<h1>
🏢 SEC Company Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/">
← Back to MyTecBooks
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
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

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
