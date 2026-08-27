import { onRequest as usBanksRequest } from "../functions/api/us-banks.js";
import { onRequest as usBankBranchRequest } from "../functions/us-bank/[uninum].js";

export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // =========================================
        // U.S. BANK API ROUTES
        // /api/us-banks?type=search&q=Ally
        // /api/us-banks?type=states&cert=57803
        // /api/us-banks?type=cities&cert=57803&state=UT
        // /api/us-banks?type=branches&cert=57803&state=UT&city=Sandy
        // =========================================

        if (url.pathname === "/api/us-banks") {

            return await usBanksRequest({
                request,
                env,
                params: {},
                next: async () => env.ASSETS.fetch(request)
            });
        }

        // =========================================
        // U.S. BANK BRANCH ROUTE
        // /us-bank/425730/
        // =========================================

        const bankBranchMatch = url.pathname.match(
            /^\/us-bank\/(\d+)\/?$/
        );

        if (bankBranchMatch) {

            const uninum = bankBranchMatch[1];

            return await usBankBranchRequest({
                request,
                env,
                params: {
                    uninum: uninum
                },
                next: async () => env.ASSETS.fetch(request)
            });
        }

        // =========================================
        // PINCODE ROUTE
        // /pincode/521161/
        // =========================================

        const match = url.pathname.match(
            /^\/pincode\/(\d{6})\/?$/
        );

        if (match) {

            const pincode = match[1];

            return await getPincodePage(pincode);
        }

        // =========================================
        // HOME PAGE / STATIC FILES
        // =========================================

        try {

            return await env.ASSETS.fetch(request);

        } catch (error) {

            return new Response(
                "MyTecBooks Worker is running.",
                {
                    status: 200,
                    headers: {
                        "content-type": "text/plain;charset=UTF-8"
                    }
                }
            );
        }
    }
};


// =================================================
// GET PINCODE DATA
// =================================================

async function getPincodePage(pincode) {

    try {

        const apiUrl =
            "https://api.postalpincode.in/pincode/" + pincode;


        const response = await fetch(apiUrl, {

            method: "GET",

            headers: {
                "Accept": "application/json"
            }

        });


        if (!response.ok) {

            return htmlResponse(

                errorPage(

                    "Pincode API Error",

                    `Postal API returned HTTP ${response.status}.`

                ),

                502

            );
        }


        const text = await response.text();


        let data;


        try {

            data = JSON.parse(text);

        } catch (error) {

            return htmlResponse(

                errorPage(

                    "Pincode API Error",

                    "The postal API returned an invalid response."

                ),

                502

            );
        }


        // =========================================
        // CHECK API RESPONSE
        // =========================================

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            return htmlResponse(

                errorPage(

                    "Pincode Not Found",

                    `No data was returned for pincode ${pincode}.`

                ),

                404

            );
        }


        const result = data[0];


        if (
            !result ||
            result.Status !== "Success" ||
            !Array.isArray(result.PostOffice) ||
            result.PostOffice.length === 0
        ) {

            return htmlResponse(

                errorPage(

                    "Pincode Not Found",

                    `No post office information was found for pincode ${pincode}.`

                ),

                404

            );
        }


        const offices = result.PostOffice;


        const firstOffice = offices[0];


        // =========================================
        // BASIC INFORMATION
        // =========================================

        const district =
            firstOffice.District || "N/A";

        const state =
            firstOffice.State || "N/A";

        const circle =
            firstOffice.Circle || "N/A";

        const region =
            firstOffice.Region || "N/A";

        const division =
            firstOffice.Division || "N/A";


        // =========================================
        // POST OFFICE LIST
        // =========================================

        let officesHtml = "";


        for (const office of offices) {

            officesHtml += `

                <div class="office">

                    <h2>
                        🏤
                        ${escapeHtml(
                            office.Name || "Post Office"
                        )}
                    </h2>


                    <div class="row">

                        <strong>
                            Branch Type:
                        </strong>

                        ${escapeHtml(
                            office.BranchType || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            Delivery Status:
                        </strong>

                        ${escapeHtml(
                            office.DeliveryStatus || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            District:
                        </strong>

                        ${escapeHtml(
                            office.District || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            State:
                        </strong>

                        ${escapeHtml(
                            office.State || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            Circle:
                        </strong>

                        ${escapeHtml(
                            office.Circle || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            Region:
                        </strong>

                        ${escapeHtml(
                            office.Region || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            Division:
                        </strong>

                        ${escapeHtml(
                            office.Division || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            Block:
                        </strong>

                        ${escapeHtml(
                            office.Block || "N/A"
                        )}

                    </div>


                    <div class="row">

                        <strong>
                            Pincode:
                        </strong>

                        ${escapeHtml(
                            office.Pincode || pincode
                        )}

                    </div>

                </div>

            `;
        }


        // =========================================
        // RELATED PINCODE LINKS
        // =========================================

        const pinNumber =
            Number(pincode);


        const relatedPins = [

            pinNumber - 2,

            pinNumber - 1,

            pinNumber + 1,

            pinNumber + 2

        ];


        let relatedHtml = "";


        for (const pin of relatedPins) {

            if (
                pin >= 100000 &&
                pin <= 999999
            ) {

                relatedHtml += `

                    <a
                        href="/pincode/${pin}/"
                    >
                        ${pin}
                    </a>

                `;

            }
        }


        // =========================================
        // MAIN CONTENT
        // =========================================

        const content = `

            <h1>
                🇮🇳 ${escapeHtml(pincode)} Pincode
            </h1>


            <p class="intro">

                Find Indian post office information
                for pincode
                <strong>${escapeHtml(pincode)}</strong>.

                View post office names, branch types,
                delivery status, district, state,
                circle, region and division.

            </p>


            <div class="summary">


                <div>

                    <span>
                        Pincode
                    </span>

                    <strong>
                        ${escapeHtml(pincode)}
                    </strong>

                </div>


                <div>

                    <span>
                        District
                    </span>

                    <strong>
                        ${escapeHtml(district)}
                    </strong>

                </div>


                <div>

                    <span>
                        State
                    </span>

                    <strong>
                        ${escapeHtml(state)}
                    </strong>

                </div>


                <div>

                    <span>
                        Circle
                    </span>

                    <strong>
                        ${escapeHtml(circle)}
                    </strong>

                </div>


                <div>

                    <span>
                        Region
                    </span>

                    <strong>
                        ${escapeHtml(region)}
                    </strong>

                </div>


                <div>

                    <span>
                        Division
                    </span>

                    <strong>
                        ${escapeHtml(division)}
                    </strong>

                </div>


                <div>

                    <span>
                        Post Offices
                    </span>

                    <strong>
                        ${offices.length}
                    </strong>

                </div>


            </div>


            <h2>
                Post Offices for ${escapeHtml(pincode)}
            </h2>


            ${officesHtml}


            <div class="related">

                <h2>
                    Related Pincode Searches
                </h2>


                <p>
                    Explore nearby pincode numbers:
                </p>


                ${relatedHtml}

            </div>

        `;


        // =========================================
        // RETURN PAGE
        // =========================================

        return htmlResponse(

            createPage(

                `${pincode} Pincode - Post Office Information`,

                content,

                pincode

            ),

            200

        );


    } catch (error) {

        console.error(
            "PINCODE ERROR:",
            error
        );


        return htmlResponse(

            errorPage(

                "Connection Error",

                "Unable to retrieve pincode information right now. Please try again later."

            ),

            500

        );

    }

}


// =================================================
// CREATE HTML PAGE
// =================================================

function createPage(
    title,
    content,
    pincode
) {

    const canonical =
        pincode

            ? `https://mytecbooks.pages.dev/pincode/${pincode}/`

            : "https://mytecbooks.pages.dev/";


    const description =
        pincode

            ? `Pincode ${pincode} post office information including branch names, district, state, delivery status and postal details.`

            : "India Pincode and IFSC Finder.";


    return `<!DOCTYPE html>

<html lang="en">

<head>


    <meta charset="UTF-8">


    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >


    <title>
        ${escapeHtml(title)}
    </title>


    <meta
        name="description"
        content="${escapeHtml(description)}"
    >


    <link
        rel="canonical"
        href="${canonical}"
    >


    <style>


        * {
            box-sizing: border-box;
        }


        body {

            margin: 0;

            padding: 20px;

            background: #f7f7f9;

            color: #222;

            font-family:

                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Arial,
                sans-serif;

            line-height: 1.6;

        }


        .container {

            max-width: 900px;

            margin: auto;

        }


        .box {

            background: white;

            padding: 28px;

            border-radius: 14px;

            box-shadow:
                0 3px 15px
                rgba(0,0,0,0.06);

        }


        .back {

            display: inline-block;

            margin-bottom: 20px;

            color: #f48120;

            text-decoration: none;

            font-weight: 600;

        }


        h1 {

            margin-top: 0;

            font-size: 32px;

            color: #222;

        }


        h2 {

            margin-top: 28px;

        }


        .intro {

            font-size: 17px;

            color: #555;

        }


        .summary {

            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 12px;

            margin:

                25px 0;

        }


        .summary div {

            background: #f1f1f5;

            padding: 15px;

            border-radius: 8px;

        }


        .summary span {

            display: block;

            font-size: 13px;

            color: #666;

            margin-bottom: 3px;

        }


        .summary strong {

            font-size: 16px;

        }


        .office {

            background: white;

            padding: 20px;

            margin:

                16px 0;

            border-radius: 10px;

            border-left:

                5px solid #f48120;

            box-shadow:

                0 2px 10px
                rgba(0,0,0,0.05);

        }


        .office h2 {

            margin-top: 0;

            color: #f48120;

            font-size: 21px;

        }


        .row {

            padding:

                8px 0;

            border-bottom:

                1px solid #eee;

        }


        .row:last-child {

            border-bottom: none;

        }


        .related {

            margin-top: 30px;

            padding: 20px;

            background: #f1f1f5;

            border-radius: 10px;

        }


        .related a {

            display: inline-block;

            margin: 5px;

            padding:

                8px 14px;

            background: white;

            color: #222;

            text-decoration: none;

            border-radius: 6px;

        }


        .related a:hover {

            background: #f48120;

            color: white;

        }


        @media(max-width:600px) {


            body {

                padding: 10px;

            }


            .box {

                padding: 18px;

            }


            h1 {

                font-size: 26px;

            }


            .summary {

                grid-template-columns: 1fr;

            }


        }


    </style>


</head>


<body>


<div class="container">


    <div class="box">


        <a
            class="back"
            href="/"
        >

            ← Pincode & IFSC Finder

        </a>


        ${content}


    </div>


</div>


</body>


</html>`;
}


// =================================================
// ERROR PAGE
// =================================================

function errorPage(
    title,
    message
) {

    return createPage(

        title,

        `

            <h1>
                ${escapeHtml(title)}
            </h1>


            <p>
                ${escapeHtml(message)}
            </p>


            <p>

                <a href="/">
                    ← Go to Pincode Finder
                </a>

            </p>

        `,

        ""

    );

}


// =================================================
// RESPONSE
// =================================================

function htmlResponse(
    html,
    status
) {

    return new Response(

        html,

        {

            status: status,

            headers: {

                "Content-Type":
                    "text/html; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600"

            }

        }

    );

}


// =================================================
// HTML ESCAPE
// =================================================

function escapeHtml(value) {

    return String(value)

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
