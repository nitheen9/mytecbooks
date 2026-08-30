export async function onRequest(context) {

    const zipcode =
        String(
            context.params.zipcode || ""
        ).trim();


    /*
     * U.S. ZIP Codes:
     * exactly 5 digits
     */

    if (
        !/^\d{5}$/.test(zipcode)
    ) {

        return notFound(
            "Please enter a valid 5-digit U.S. ZIP Code."
        );

    }


    const apiUrl =
        "https://api.zippopotam.us/us/" +
        encodeURIComponent(zipcode);


    try {

        const response =
            await fetch(
                apiUrl,
                {
                    headers: {
                        "Accept":
                            "application/json",

                        "User-Agent":
                            "MyTecBooks U.S. ZIP Code Finder"
                    }
                }
            );


        if (
            !response.ok
        ) {

            return notFound(
                "U.S. ZIP Code " +
                zipcode +
                " was not found."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !Array.isArray(
                data.places
            ) ||
            data.places.length === 0
        ) {

            return notFound(
                "U.S. ZIP Code " +
                zipcode +
                " was not found."
            );

        }


        return new Response(

            createPage(
                zipcode,
                data
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
            "ZIP Code error:",
            error
        );


        return new Response(

            "Unable to load U.S. ZIP Code information.",

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
    zipcode,
    data
) {

    const safeZip =
        escapeHtml(
            zipcode
        );


    const country =
        escapeHtml(
            data.country ||
            "United States"
        );


    const places =
        data.places ||
        [];


    const first =
        places[0] ||
        {};


    const firstCity =
        escapeHtml(
            first["place name"] ||
            ""
        );


    const firstState =
        escapeHtml(
            first.state ||
            ""
        );


    const firstStateCode =
        escapeHtml(
            first["state abbreviation"] ||
            ""
        );


    const pageTitle =
        zipcode +
        " ZIP Code - " +
        (first["place name"] || "") +
        ", " +
        (first["state abbreviation"] || "") +
        " | U.S. ZIP Code";


    const metaDescription =
        "U.S. ZIP Code " +
        zipcode +
        " location information including " +
        (first["place name"] || "city") +
        ", " +
        (first.state || "state") +
        ", latitude and longitude.";


    let placeHtml =
        "";


    places.forEach(
        function(place) {

            const city =
                escapeHtml(
                    place["place name"] ||
                    ""
                );


            const state =
                escapeHtml(
                    place.state ||
                    ""
                );


            const abbreviation =
                escapeHtml(
                    place["state abbreviation"] ||
                    ""
                );


            const latitude =
                escapeHtml(
                    place.latitude ||
                    ""
                );


            const longitude =
                escapeHtml(
                    place.longitude ||
                    ""
                );


            placeHtml +=

                '<div class="place">' +

                    '<h3>' +

                        city +

                        ', ' +

                        state +

                        ' (' +

                        abbreviation +

                        ')' +

                    '</h3>' +

                    '<div class="detail">' +

                        '<strong>Latitude:</strong> ' +

                        latitude +

                    '</div>' +

                    '<div class="detail">' +

                        '<strong>Longitude:</strong> ' +

                        longitude +

                    '</div>' +

                '</div>';

        }
    );


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

    background:var(--light);

    color:var(--dark);

}

.container {

    max-width:850px;

    margin:0 auto;

}

h1 {

    text-align:center;

    margin:10px 0 12px;

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

    line-height:1.4;

}

.data-row {

    padding:15px 0;

    border-bottom:
        1px solid var(--border);

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

    background:var(--dark);

    color:#fff;

    padding:7px 12px;

    border-radius:6px;

    font-weight:700;

    letter-spacing:1px;

}

.place-list {

    margin-top:20px;

}

.place {

    padding:15px;

    background:#f5f5f8;

    border-radius:8px;

    margin-bottom:12px;

    border:
        1px solid var(--border);

}

.place:last-child {

    margin-bottom:0;

}

.place h3 {

    margin-top:0;

    color:#333;

}

.detail {

    margin-top:6px;

    line-height:1.6;

}

.source {

    margin-top:25px;

    padding:15px;

    background:#fff8ef;

    border-radius:8px;

    line-height:1.6;

    font-size:14px;

}

.source a {

    color:#b85c00;

    font-weight:700;

}

.back {

    display:inline-block;

    margin-top:25px;

    padding:12px 18px;

    background:var(--dark);

    color:#fff;

    text-decoration:none;

    border-radius:7px;

    font-weight:700;

}

footer {

    text-align:center;

    color:#777;

    font-size:13px;

    margin:30px 0 10px;

    line-height:1.6;

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
🇺🇸 U.S. ZIP Code ${safeZip}
</h1>

<p class="subtitle">

United States ZIP Code:
<strong>
${firstCity}${firstStateCode ? ", " + firstStateCode : ""}
</strong>

</p>

<div class="card">

<h2>
📍 ZIP Code ${safeZip}
</h2>

<div class="data-row">

<span class="label">
ZIP Code
</span>

<span class="code">
${safeZip}
</span>

</div>

<div class="data-row">

<span class="label">
Country
</span>

${country}

</div>

<div class="data-row">

<span class="label">
Primary Place
</span>

${firstCity}

</div>

<div class="data-row">

<span class="label">
State
</span>

${firstState}

${firstStateCode
    ? " (" + firstStateCode + ")"
    : ""}

</div>


<div class="place-list">

<span class="label">
Places associated with this ZIP Code
</span>

${placeHtml}

</div>


<div class="source">

<strong>
Data Source:
</strong>

<br>

Zippopotam.us / GeoNames

<br><br>

<a
href="https://api.zippopotam.us/us/${encodeURIComponent(zipcode)}"
target="_blank"
rel="noopener noreferrer">

View API Response →

</a>

</div>


<a
class="back"
href="/usa-zip-search.html">

← U.S. ZIP Code Search

</a>

</div>


<footer>

U.S. ZIP Code Search<br>

Data provided through Zippopotam.us / GeoNames

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
U.S. ZIP Code Not Found
</title>

<style>

body {

    font-family:Arial,sans-serif;

    background:#f9f9fb;

    padding:40px 20px;

    text-align:center;

}

.box {

    max-width:650px;

    margin:auto;

    background:white;

    padding:30px;

    border-radius:12px;

    box-shadow:
        0 4px 18px rgba(0,0,0,.08);

}

h1 {

    color:#1e1e24;

}

a {

    display:inline-block;

    margin-top:20px;

    padding:12px 18px;

    background:#f48120;

    color:white;

    text-decoration:none;

    border-radius:7px;

    font-weight:bold;

}

</style>

</head>

<body>

<div class="box">

<h1>
🇺🇸 U.S. ZIP Code Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/usa-zip-search.html">

← U.S. ZIP Code Search

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
