export async function onRequest(context) {

    const {
        cik
    } = context.params;


    if (!cik) {

        return notFound(
            "Company CIK is missing."
        );

    }


    const cleanCIK =
        String(cik)
            .replace(/\D/g, "")
            .padStart(
                10,
                "0"
            );


    if (!/^\d{10}$/.test(cleanCIK)) {

        return notFound(
            "Invalid SEC CIK."
        );

    }


    const apiUrl =
        "https://data.sec.gov/submissions/CIK" +
        cleanCIK +
        ".json";


    try {

        const response =
            await fetch(
                apiUrl,
                {
                    headers: {

                        "User-Agent":
                            "MyTecBooks mytecbooks.pages.dev contact@example.com",

                        "Accept":
                            "application/json",

                        "Accept-Encoding":
                            "gzip, deflate"

                    }
                }
            );


        if (!response.ok) {

            console.error(
                "SEC API status:",
                response.status
            );


            return notFound(
                "SEC company information is unavailable."
            );

        }


        const data =
            await response.json();


        const html =
            createPage(
                data,
                cleanCIK
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
    catch(error) {

        console.error(
            "SEC company error:",
            error
        );


        return new Response(
            "Unable to load company information.",
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
   CREATE COMPANY PAGE
========================================= */

function createPage(
    data,
    cik
) {

    const name =
        data.name ||
        "N/A";


    const tickers =
        Array.isArray(
            data.tickers
        )
        ? data.tickers
        : [];


    const exchanges =
        Array.isArray(
            data.exchanges
        )
        ? data.exchanges
        : [];


    const ticker =
        tickers.length
        ? tickers.join(", ")
        : "N/A";


    const exchange =
        exchanges.length
        ? exchanges.join(", ")
        : "N/A";


    const sic =
        data.sic ||
        "N/A";


    const sicDescription =
        data.sicDescription ||
        "N/A";


    const category =
        data.category ||
        "N/A";


    const fiscalYearEnd =
        data.fiscalYearEnd ||
        "N/A";


    const ein =
        data.ein ||
        "N/A";


    const stateOfIncorporation =
        data.stateOfIncorporation ||
        "N/A";


    const addresses =
        data.addresses ||
        {};


    const business =
        addresses.business ||
        {};


    const mailing =
        addresses.mailing ||
        {};


    const businessAddress =
        formatAddress(
            business
        );


    const mailingAddress =
        formatAddress(
            mailing
        );


    const phone =
        business.phone ||
        mailing.phone ||
        "N/A";


    const formerNames =
        Array.isArray(
            data.formerNames
        )
        ? data.formerNames
        : [];


    const formerNameText =
        formerNames.length
        ? formerNames
            .map(
                function(item) {

                    return item.name +
                        " (" +
                        item.from +
                        " to " +
                        item.to +
                        ")";

                }
            )
            .join("<br>")
        : "N/A";


    const title =
        name +
        " - SEC Company Information";


    const description =
        "SEC EDGAR company information for " +
        name +
        ", including CIK, ticker, exchange, " +
        "business address, state of incorporation, " +
        "SIC and filing information.";


    const secLink =
        "https://www.sec.gov/edgar/browse/?CIK=" +
        encodeURIComponent(cik);


    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="index, follow">

<meta name="description"
      content="${escapeHtml(description)}">

<link rel="icon"
      type="image/png"
      href="/favicon.png">

<title>
${escapeHtml(title)}
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

    --primary: #1976d2;
    --primary-dark: #0d47a1;
    --dark: #172033;
    --border: #d8e3f0;

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
        linear-gradient(
            135deg,
            #eef7ff,
            #f8fbff
        );

    color: var(--dark);

}

.container {

    max-width: 900px;

    margin: 0 auto;

}

h1 {

    text-align: center;

    font-size: 30px;

    margin: 10px 0;

}

.intro {

    text-align: center;

    color: #667085;

    line-height: 1.6;

    margin-bottom: 25px;

}

.card {

    background: white;

    padding: 28px;

    border-radius: 14px;

    border-top: 5px solid var(--primary);

    box-shadow:
        0 5px 22px
        rgba(25,118,210,.10);

}

.card h2 {

    color: var(--primary-dark);

    margin-top: 0;

}

.row {

    padding: 14px 0;

    border-bottom:
        1px solid var(--border);

    line-height: 1.6;

    word-break: break-word;

}

.row:last-child {

    border-bottom: none;

}

.label {

    font-weight: 700;

}

.badge {

    display: inline-block;

    padding: 5px 10px;

    background: var(--primary-dark);

    color: white;

    border-radius: 5px;

    font-weight: 700;

}

.cik {

    display: inline-block;

    padding: 5px 10px;

    background: var(--primary);

    color: white;

    border-radius: 6px;

    font-weight: 700;

}

.button {

    display: inline-block;

    margin-top: 20px;

    margin-right: 8px;

    padding: 12px 18px;

    background: var(--primary);

    color: white;

    text-decoration: none;

    border-radius: 8px;

    font-weight: 700;

}

.button:hover {

    background: var(--primary-dark);

}

.back {

    background: #172033;

}

footer {

    text-align: center;

    color: #6b7280;

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

    .button {

        display: block;

        text-align: center;

        margin-right: 0;

    }

}

</style>

</head>


<body>

<div class="container">


<h1>
🇺🇸 ${escapeHtml(name)}
</h1>


<p class="intro">

SEC EDGAR company information

</p>


<div class="card">


<h2>
🏢 Company Information
</h2>


<div class="row">

<span class="label">
Company Name:
</span>

<br>

${escapeHtml(name)}

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
Ticker:
</span>

<br>

<span class="badge">
${escapeHtml(ticker)}
</span>

</div>


<div class="row">

<span class="label">
Exchange:
</span>

<br>

${escapeHtml(exchange)}

</div>


<div class="row">

<span class="label">
SIC:
</span>

<br>

${escapeHtml(sic)}

</div>


<div class="row">

<span class="label">
Industry / SIC Description:
</span>

<br>

${escapeHtml(sicDescription)}

</div>


<div class="row">

<span class="label">
Company Category:
</span>

<br>

${escapeHtml(category)}

</div>


<div class="row">

<span class="label">
State of Incorporation:
</span>

<br>

${escapeHtml(stateOfIncorporation)}

</div>


<div class="row">

<span class="label">
Fiscal Year End:
</span>

<br>

${escapeHtml(fiscalYearEnd)}

</div>


<div class="row">

<span class="label">
EIN:
</span>

<br>

${escapeHtml(ein)}

</div>


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


<div class="row">

<span class="label">
Phone:
</span>

<br>

${escapeHtml(phone)}

</div>


<div class="row">

<span class="label">
Former Company Names:
</span>

<br>

${formerNameText}

</div>


<a
    class="button"
    href="${secLink}"
    target="_blank"
    rel="noopener">

View Company on SEC EDGAR →

</a>


<a
    class="button back"
    href="/usa-company-finder.html">

← USA Company Finder

</a>


</div>


<footer>

USA Company Finder<br>

Company information retrieved from
SEC EDGAR public data.

</footer>


</div>

</body>

</html>`;

}


/* =========================================
   ADDRESS
========================================= */

function formatAddress(
    address
) {

    if (
        !address ||
        typeof address !== "object"
    ) {

        return "N/A";

    }


    const parts = [];


    if (address.street1) {

        parts.push(
            escapeHtml(
                address.street1
            )
        );

    }


    if (address.street2) {

        parts.push(
            escapeHtml(
                address.street2
            )
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


    if (cityStateZip.length) {

        parts.push(
            escapeHtml(
                cityStateZip.join(", ")
            )
        );

    }


    if (address.stateOrCountryDescription) {

        parts.push(
            escapeHtml(
                address.stateOrCountryDescription
            )
        );

    }


    if (!parts.length) {

        return "N/A";

    }


    return parts.join("<br>");

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

<title>
USA Company Not Found
</title>

<style>

body {

    font-family: Arial, sans-serif;

    background: #f5f9ff;

    padding: 40px 20px;

    text-align: center;

}

.box {

    max-width: 600px;

    margin: auto;

    background: white;

    padding: 30px;

    border-radius: 12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);

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

    border-radius: 7px;

}

</style>

</head>


<body>

<div class="box">

<h1>
🏢 Company Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/usa-company-finder.html">
← USA Company Finder
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
