export async function onRequest(context) {

    const zipcode =
        String(
            context.params.zipcode || ""
        ).trim();


    /*
     * U.S. ZIP Code
     * exactly 5 digits.
     */

    if (
        !/^\d{5}$/.test(zipcode)
    ) {

        return notFound(
            "Please enter a valid 5-digit U.S. ZIP Code."
        );

    }


    const apiUrl =
        "https://dashboard.waterdata.usgs.gov/" +
        "service/geocoder/get/location/1.0" +
        "?term=" +
        encodeURIComponent(zipcode) +
        "&include=postal";


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

            console.error(
                "USGS HTTP status:",
                response.status
            );


            return notFound(
                "U.S. ZIP Code " +
                zipcode +
                " was not found."
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            return notFound(
                "U.S. ZIP Code " +
                zipcode +
                " was not found."
            );

        }


        /*
         * Find a postal result.
         */

        const result =
            data.find(
                function(item) {

                    return (
                        item &&
                        item.Source === "postal"
                    );

                }
            ) ||
            data[0];


        if (
            !result
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
                result
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
            "USGS ZIP error:",
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

    /*
     * USGS returns:
     *
     * Name:
     * 93669 Wishon
     *
     * We remove the ZIP prefix
     * so the visitor sees:
     *
     * Wishon
     */

    let rawName =
        String(
            data.Name || ""
        ).trim();


    let city =
        rawName;


    const zipPrefix =
        zipcode + " ";


    if (
        city.startsWith(
            zipPrefix
        )
    ) {

        city =
            city.substring(
                zipPrefix.length
            ).trim();

    }


    /*
     * Some records could have a
     * different formatting.
     */

    city =
        city
        .replace(
            new RegExp(
                "^" +
                escapeRegex(zipcode) +
                "\\s*",
                "i"
            ),
            ""
        )
        .trim();


    /*
     * State name.
     *
     * USGS returns the state
     * abbreviation, e.g. CA.
     *
     * Convert common abbreviations
     * to full state names.
     */

    const stateCode =
        String(
            data.State || ""
        )
        .trim()
        .toUpperCase();


    const stateName =
        getStateName(
            stateCode
        );


    const safeZip =
        escapeHtml(
            zipcode
        );


    const safeCity =
        escapeHtml(
            city ||
            "Not available"
        );


    const safeCounty =
        escapeHtml(
            data.County ||
            "Not available"
        );


    const safeState =
        escapeHtml(
            stateName ||
            stateCode ||
            "Not available"
        );


    const safeStateCode =
        escapeHtml(
            stateCode
        );


    const safeLatitude =
        escapeHtml(
            data.Latitude ??
            ""
        );


    const safeLongitude =
        escapeHtml(
            data.Longitude ??
            ""
        );


    const title =
        "U.S. ZIP Code " +
        zipcode +
        " - " +
        city +
        ", " +
        stateCode;


    const metaDescription =
        "U.S. ZIP Code " +
        zipcode +
        " for " +
        city +
        ", " +
        stateName +
        ". View county, state, latitude and longitude.";


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

    color:#333;

    margin-top:0;

    line-height:1.4;

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

${safeCity}

${safeStateCode
    ? ", " + safeStateCode
    : ""}

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
City / Area
</span>

${safeCity}

</div>


<div class="data-row">

<span class="label">
County
</span>

${safeCounty}

</div>


<div class="data-row">

<span class="label">
State
</span>

${safeState}

${safeStateCode
    ? " (" + safeStateCode + ")"
    : ""}

</div>


<div class="data-row">

<span class="label">
Latitude
</span>

${safeLatitude || "Not available"}

</div>


<div class="data-row">

<span class="label">
Longitude
</span>

${safeLongitude || "Not available"}

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
   STATE NAME
========================================= */

function getStateName(
    code
) {

    const states = {

        AL:"Alabama",
        AK:"Alaska",
        AZ:"Arizona",
        AR:"Arkansas",
        CA:"California",
        CO:"Colorado",
        CT:"Connecticut",
        DE:"Delaware",
        FL:"Florida",
        GA:"Georgia",
        HI:"Hawaii",
        ID:"Idaho",
        IL:"Illinois",
        IN:"Indiana",
        IA:"Iowa",
        KS:"Kansas",
        KY:"Kentucky",
        LA:"Louisiana",
        ME:"Maine",
        MD:"Maryland",
        MA:"Massachusetts",
        MI:"Michigan",
        MN:"Minnesota",
        MS:"Mississippi",
        MO:"Missouri",
        MT:"Montana",
        NE:"Nebraska",
        NV:"Nevada",
        NH:"New Hampshire",
        NJ:"New Jersey",
        NM:"New Mexico",
        NY:"New York",
        NC:"North Carolina",
        ND:"North Dakota",
        OH:"Ohio",
        OK:"Oklahoma",
        OR:"Oregon",
        PA:"Pennsylvania",
        RI:"Rhode Island",
        SC:"South Carolina",
        SD:"South Dakota",
        TN:"Tennessee",
        TX:"Texas",
        UT:"Utah",
        VT:"Vermont",
        VA:"Virginia",
        WA:"Washington",
        WV:"West Virginia",
        WI:"Wisconsin",
        WY:"Wyoming",
        DC:"District of Columbia"

    };

    return (
        states[code] ||
        code
    );

}


/* =========================================
   ESCAPE REGEX
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
