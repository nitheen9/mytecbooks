const RESOURCE_ID =
    "c967fe8f-69c4-42df-8afc-8a2c98057437";


export async function onRequest(
    context
) {

    const villageCode =
        String(
            context.params.code || ""
        ).trim();


    if (
        !/^\d+$/.test(
            villageCode
        )
    ) {

        return notFound(
            "Invalid village code."
        );

    }


    const apiKey =
        context.env.DATA_GOV_IN_API_KEY;


    if (
        !apiKey
    ) {

        return new Response(
            "API configuration error.",
            {
                status:
                    500,

                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                }
            }
        );

    }


    try {

        /*
         * The resource exposes villageCode
         * in the actual records.
         *
         * We request records using the
         * state filter only when necessary.
         *
         * First try the field filter.
         */

        const apiUrl =
            "https://api.data.gov.in/resource/" +
            RESOURCE_ID +
            "?api-key=" +
            encodeURIComponent(
                apiKey
            ) +
            "&format=json" +
            "&limit=10" +
            "&offset=0" +
            "&filters[villageCode]=" +
            encodeURIComponent(
                villageCode
            );


        let response =
            await fetch(
                apiUrl,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        let data =
            null;


        if (
            response.ok
        ) {

            data =
                await response.json();

        }


        let records =
            data &&
            Array.isArray(
                data.records
            )
                ? data.records
                : [];


        let record =
            findVillage(
                records,
                villageCode
            );


        /*
         * If villageCode is not accepted as
         * a public filter, return a clear
         * not-found result rather than showing
         * the wrong village.
         */

        if (
            !record
        ) {

            return notFound(
                "Village " +
                villageCode +
                " was not found."
            );

        }


        const village =
            String(
                record[
                    "villageNameEnglish"
                ] ||
                ""
            ).trim();


        const state =
            String(
                record[
                    "stateNameEnglish"
                ] ||
                ""
            ).trim();


        const district =
            String(
                record[
                    "districtNameEnglish"
                ] ||
                ""
            ).trim();


        const subDistrict =
            String(
                record[
                    "subDistrictNameEnglish"
                ] ||
                ""
            ).trim();


        const villageCensusCode =
            String(
                record[
                    "villageCensus2011Code"
                ] ??
                ""
            ).trim();


        const lgdVillageCode =
            String(
                record[
                    "villageCode"
                ] ??
                villageCode
            ).trim();


        return new Response(

            createPage({

                village:
                    village,

                state:
                    state,

                district:
                    district,

                subDistrict:
                    subDistrict,

                villageCode:
                    lgdVillageCode,

                villageCensusCode:
                    villageCensusCode

            }),

            {

                status:
                    200,

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
            "LGD village detail error:",
            error
        );


        return new Response(
            "Unable to load village information.",
            {
                status:
                    500,

                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                }
            }
        );

    }

}


/* =========================================
   FIND VILLAGE
========================================= */

function findVillage(
    records,
    villageCode
) {

    for (
        const record of records
    ) {

        const code =
            String(
                record[
                    "villageCode"
                ] ??
                ""
            ).trim();


        if (
            code ===
            villageCode
        ) {

            return record;

        }

    }


    return null;

}


/* =========================================
   CREATE PAGE
========================================= */

function createPage(
    data
) {

    const village =
        escapeHtml(
            data.village
        );


    const state =
        escapeHtml(
            data.state ||
            "India"
        );


    const district =
        escapeHtml(
            data.district ||
            "Not available"
        );


    const subDistrict =
        escapeHtml(
            data.subDistrict ||
            "Not available"
        );


    const villageCode =
        escapeHtml(
            data.villageCode
        );


    const censusCode =
        escapeHtml(
            data.villageCensusCode ||
            "Not available"
        );


    const title =
        data.village +
        " Village, " +
        data.state;


    const description =
        data.village +
        " village information including State, District, Sub-District, LGD Village Code and Census 2011 village code.";


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

<style>

:root {

    --primary:#f48120;
    --dark:#1e1e24;
    --light:#f9f9fb;
    --border:#e0e0e6;

}

* {
    box-sizing:border-box;
}

body {

    margin:0;
    padding:20px;

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

    max-width:850px;

    margin:0 auto;

}

h1 {

    text-align:center;

    margin:
        10px 0 12px;

    font-size:30px;

}

.subtitle {

    text-align:center;

    color:#666;

    line-height:1.6;

    margin-bottom:25px;

}

.card {

    background:#fff;

    padding:28px;

    border-radius:12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.06);

    border-top:
        5px solid
        var(--primary);

}

.card h2 {

    margin-top:0;

    color:#333;

}

.data-row {

    padding:15px 0;

    border-bottom:
        1px solid
        var(--border);

    line-height:1.7;

}

.data-row:last-child {

    border-bottom:none;

}

.label {

    display:block;

    font-weight:700;

    margin-bottom:4px;

}

.code {

    display:inline-block;

    background:
        var(--dark);

    color:#fff;

    padding:7px 12px;

    border-radius:6px;

    font-weight:700;

    letter-spacing:1px;

}

.back {

    display:inline-block;

    margin-top:25px;

    padding:12px 18px;

    background:
        var(--dark);

    color:#fff;

    text-decoration:none;

    border-radius:7px;

    font-weight:700;

}

footer {

    text-align:center;

    color:#777;

    font-size:13px;

    margin:
        30px 0 10px;

}

@media(max-width:600px) {

    body {
        padding:12px;
    }

    h1 {
        font-size:24px;
    }

    .card {
        padding:18px;
    }

}

</style>

</head>

<body>

<div class="container">


<h1>
🇮🇳 ${village} Village
</h1>


<p class="subtitle">
${state}
</p>


<div class="card">


<h2>
📍 ${village}
</h2>


<div class="data-row">

<span class="label">
Village Name
</span>

${village}

</div>


<div class="data-row">

<span class="label">
State
</span>

${state}

</div>


<div class="data-row">

<span class="label">
District
</span>

${district}

</div>


<div class="data-row">

<span class="label">
Sub-District
</span>

${subDistrict}

</div>


<div class="data-row">

<span class="label">
LGD Village Code
</span>

<span class="code">
${villageCode}
</span>

</div>


<div class="data-row">

<span class="label">
Census 2011 Village Code
</span>

${censusCode}

</div>


<a
class="back"
href="/india-village-search.html">

← India Village Search

</a>


</div>


<footer>

India Village Finder

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
India Village Not Found
</title>

<style>

body {

    font-family:
        Arial,
        sans-serif;

    background:
        #f9f9fb;

    text-align:center;

    padding:
        40px 20px;

}

.box {

    max-width:650px;

    margin:auto;

    background:#fff;

    padding:30px;

    border-radius:12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);

}

a {

    display:inline-block;

    margin-top:20px;

    padding:12px 18px;

    background:#f48120;

    color:#fff;

    text-decoration:none;

    border-radius:7px;

    font-weight:bold;

}

</style>

</head>

<body>

<div class="box">

<h1>
🇮🇳 Village Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/india-village-search.html">
← India Village Search
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
