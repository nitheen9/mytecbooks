export async function onRequest(context) {

    const code =
        String(
            context.params.code || ""
        ).trim();


    if (
        code.length < 2
    ) {

        return notFound(
            "Invalid village identifier."
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


    /*
     * First try to find the record using
     * MDDS PLCN / location code.
     */

    const codeUrl =
        "https://api.data.gov.in" +
        "/catalog/fd5ac8e1-32cd-4f74-b95e-fd55b76d53e0" +
        "?api-key=" +
        encodeURIComponent(
            apiKey
        ) +
        "&format=json" +
        "&limit=10" +
        "&offset=0" +
        "&filters[mdds_plcn]=" +
        encodeURIComponent(
            code
        );


    try {

        let data =
            await fetchJson(
                codeUrl
            );


        let records =
            getRecords(
                data
            );


        /*
         * Some records may use a different
         * code field, so check them.
         */

        let record =
            findRecordByCode(
                records,
                code
            );


        /*
         * If code lookup did not find the
         * record, try document_id.
         */

        if (
            !record
        ) {

            const documentUrl =
                "https://api.data.gov.in" +
                "/catalog/fd5ac8e1-32cd-4f74-b95e-fd55b76d53e0" +
                "?api-key=" +
                encodeURIComponent(
                    apiKey
                ) +
                "&format=json" +
                "&limit=10" +
                "&offset=0" +
                "&filters[document_id]=" +
                encodeURIComponent(
                    code
                );


            data =
                await fetchJson(
                    documentUrl
                );


            records =
                getRecords(
                    data
                );


            record =
                findRecordByCode(
                    records,
                    code
                );

        }


        if (
            !record
        ) {

            return notFound(
                "Village information was not found."
            );

        }


        const village =
            getField(
                record,
                [
                    "area_name",
                    "AREA NAME",
                    "Village Name",
                    "VILLAGE NAME",
                    "village_name",
                    "village",
                    "VILLAGE",
                    "Town/Village Name"
                ]
            );


        const state =
            getField(
                record,
                [
                    "state_name",
                    "STATE NAME",
                    "State Name",
                    "state"
                ]
            );


        const district =
            getField(
                record,
                [
                    "district_name",
                    "DISTRICT NAME",
                    "District Name",
                    "district"
                ]
            );


        const subDistrict =
            getField(
                record,
                [
                    "sub_district_name",
                    "SUB-DISTRICT NAME",
                    "Sub-District Name",
                    "sub_district"
                ]
            );


        const villageCode =
            getField(
                record,
                [
                    "mdds_plcn",
                    "MDDS PLCN",
                    "village_code",
                    "VILLAGE CODE",
                    "Village Code",
                    "town_village_code",
                    "Town Village Code"
                ]
            ) ||
            code;


        if (
            !village
        ) {

            return notFound(
                "Village information was not found."
            );

        }


        return new Response(

            createPage(
                village,
                state,
                district,
                subDistrict,
                villageCode
            ),

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
            "India village detail error:",
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
   CREATE PAGE
========================================= */

function createPage(
    village,
    state,
    district,
    subDistrict,
    villageCode
) {

    const title =
        village +
        " Village, " +
        state;


    const description =
        "Information for " +
        village +
        " village including State, District, Sub-District and village code.";


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
        #fff;

    padding:
        28px;

    border-radius:
        12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.06);

    border-top:
        5px solid
        var(--primary);

}

.card h2 {

    margin-top:
        0;

    color:
        #333;

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

    display:
        block;

    font-weight:
        700;

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
🇮🇳 ${escapeHtml(village)} Village
</h1>


<p class="subtitle">

${escapeHtml(
    state ||
    "India"
)}

</p>


<div class="card">


<h2>
📍 ${escapeHtml(village)}
</h2>


<div class="data-row">

<span class="label">
Village Name
</span>

${escapeHtml(village)}

</div>


<div class="data-row">

<span class="label">
State
</span>

${escapeHtml(
    state ||
    "Not available"
)}

</div>


<div class="data-row">

<span class="label">
District
</span>

${escapeHtml(
    district ||
    "Not available"
)}

</div>


<div class="data-row">

<span class="label">
Sub-District
</span>

${escapeHtml(
    subDistrict ||
    "Not available"
)}

</div>


<div class="data-row">

<span class="label">
Village Code
</span>

<span class="code">

${escapeHtml(
    villageCode
)}

</span>

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
   FIND RECORD BY CODE
========================================= */

function findRecordByCode(
    records,
    code
) {

    for (
        const record of records
    ) {

        const possibleCodes = [

            getField(
                record,
                [
                    "mdds_plcn",
                    "MDDS PLCN",
                    "village_code",
                    "VILLAGE CODE",
                    "Village Code",
                    "town_village_code",
                    "Town Village Code"
                ]
            ),

            getField(
                record,
                [
                    "document_id",
                    "DOCUMENT ID",
                    "Document ID"
                ]
            )

        ];


        if (
            possibleCodes.some(
                function(value) {

                    return (
                        String(
                            value
                        ).trim() ===
                        String(
                            code
                        ).trim()
                    );

                }
            )
        ) {

            return record;

        }

    }


    return null;

}


/* =========================================
   FETCH JSON
========================================= */

async function fetchJson(
    url
) {

    const response =
        await fetch(
            url,
            {
                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    if (
        !response.ok
    ) {

        const text =
            await response.text();


        throw new Error(
            "data.gov.in HTTP " +
            response.status +
            ": " +
            text
        );

    }


    return await response.json();

}


/* =========================================
   GET RECORDS
========================================= */

function getRecords(
    data
) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    if (
        data &&
        Array.isArray(
            data.records
        )
    ) {

        return data.records;

    }


    if (
        data &&
        Array.isArray(
            data.data
        )
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(
            data.results
        )
    ) {

        return data.results;

    }


    return [];

}


/* =========================================
   GET FIELD
========================================= */

function getField(
    record,
    names
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        return "";

    }


    for (
        const name of names
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                record,
                name
            )
        ) {

            const value =
                record[name];


            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    const keys =
        Object.keys(record);


    for (
        const wanted of names
    ) {

        const found =
            keys.find(
                function(key) {

                    return (
                        key.toLowerCase() ===
                        wanted.toLowerCase()
                    );

                }
            );


        if (
            found
        ) {

            const value =
                record[found];


            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    return "";

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
        #fff;

    padding:
        30px;

    border-radius:
        12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);

}

h1 {
    color:#1e1e24;
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
        #fff;

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
