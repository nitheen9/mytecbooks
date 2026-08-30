export async function onRequest(context) {

    const zipcode =
        String(
            context.params.zipcode || ""
        ).trim();


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
                            "application/json"
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

    const places =
        data.places || [];


    const first =
        places[0] || {};


    const city =
        String(
            first["place name"] ||
            ""
        ).trim();


    const state =
        String(
            first.state ||
            ""
        ).trim();


    const stateCode =
        String(
            first[
                "state abbreviation"
            ] ||
            ""
        )
        .trim()
        .toUpperCase();


    const country =
        String(
            data.country ||
            "United States"
        ).trim();


    const title =
        zipcode +
        " ZIP Code - " +
        city +
        ", " +
        stateCode;


    const metaDescription =
        "U.S. ZIP Code " +
        zipcode +
        " for " +
        city +
        ", " +
        state +
        ". View ZIP Code, city, state, country, latitude and longitude information.";


    let placesHtml =
        "";


    places.forEach(
        function(place) {

            const placeName =
                String(
                    place[
                        "place name"
                    ] ||
                    ""
                ).trim();


            const placeState =
                String(
                    place.state ||
                    ""
                ).trim();


            const placeStateCode =
                String(
                    place[
                        "state abbreviation"
                    ] ||
                    ""
                )
                .trim()
                .toUpperCase();


            const latitude =
                String(
                    place.latitude ??
                    ""
                );


            const longitude =
                String(
                    place.longitude ??
                    ""
                );


            placesHtml +=

                '<div class="place">' +

                    '<div class="place-title">' +

                        escapeHtml(
                            placeName
                        ) +

                        (
                            placeState
                                ? ', ' +
                                  escapeHtml(
                                      placeState
                                  )
                                : ""
                        ) +

                        (
                            placeStateCode
                                ? ' (' +
                                  escapeHtml(
                                      placeStateCode
                                  ) +
                                  ')'
                                : ""
                        ) +

                    '</div>' +

                    '<div class="place-detail">' +

                        '<strong>Latitude:</strong> ' +

                        escapeHtml(
                            latitude ||
                            "Not available"
                        ) +

                    '</div>' +

                    '<div class="place-detail">' +

                        '<strong>Longitude:</strong> ' +

                        escapeHtml(
                            longitude ||
                            "Not available"
                        ) +

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
        5px solid var(--primary);

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

    margin-top:22px;

}

.place {

    margin-top:10px;

    padding:15px;

    background:#f5f5f8;

    border:
        1px solid var(--border);

    border-radius:8px;

}

.place-title {

    font-weight:700;

    color:#333;

    margin-bottom:8px;

    line-height:1.5;

}

.place-detail {

    margin-top:5px;

    line-height:1.6;

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
🇺🇸 U.S. ZIP Code ${escapeHtml(zipcode)}
</h1>

<p class="subtitle">

${escapeHtml(city)}

${stateCode
    ? ", " + escapeHtml(stateCode)
    : ""}

</p>

<div class="card">

<h2>
📍 ZIP Code ${escapeHtml(zipcode)}
</h2>


<div class="data-row">

<span class="label">
ZIP Code
</span>

<span class="code">
${escapeHtml(zipcode)}
</span>

</div>


<div class="data-row">

<span class="label">
City / Area
</span>

${escapeHtml(
    city ||
    "Not available"
)}

</div>


<div class="data-row">

<span class="label">
State
</span>

${escapeHtml(
    state ||
    "Not available"
)}

${stateCode
    ? " (" +
      escapeHtml(stateCode) +
      ")"
    : ""}

</div>


<div class="data-row">

<span class="label">
Country
</span>

${escapeHtml(
    country
)}

</div>


<div class="place-list">

<span class="label">
Location Details
</span>

${placesHtml}

</div>


<a
class="back"
href="/usa-zip-search.html">

← U.S. ZIP Code Search

</a>

</div>


<footer>

U.S. ZIP Code Finder

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
