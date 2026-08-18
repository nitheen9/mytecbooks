export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // =========================================
        // PINCODE URL
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
        // NORMAL WEBSITE FILES
        // =========================================

        return env.ASSETS.fetch(request);
    }
};


// =========================================
// PINCODE API
// =========================================

async function getPincodePage(pincode) {

    try {

        const apiUrl =
            `https://api.postalpincode.in/pincode/${pincode}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {

            return htmlResponse(
                errorPage(
                    "Pincode API Error",
                    "Unable to retrieve pincode information."
                ),
                502
            );
        }

        const data = await response.json();

        if (
            !Array.isArray(data) ||
            !data[0] ||
            data[0].Status !== "Success" ||
            !Array.isArray(data[0].PostOffice) ||
            data[0].PostOffice.length === 0
        ) {

            return htmlResponse(
                errorPage(
                    "Pincode Not Found",
                    `No post office information was found for pincode ${pincode}.`
                ),
                404
            );
        }


        const offices = data[0].PostOffice;

        const first = offices[0];


        // =========================================
        // POST OFFICE LIST
        // =========================================

        let officesHtml = "";

        offices.forEach(function (office) {

            officesHtml += `

                <div class="office">

                    <h2>
                        🏤 ${escapeHtml(office.Name || "Post Office")}
                    </h2>

                    <p>
                        <strong>Branch Type:</strong>
                        ${escapeHtml(office.BranchType || "N/A")}
                    </p>

                    <p>
                        <strong>Delivery Status:</strong>
                        ${escapeHtml(office.DeliveryStatus || "N/A")}
                    </p>

                    <p>
                        <strong>District:</strong>
                        ${escapeHtml(office.District || "N/A")}
                    </p>

                    <p>
                        <strong>State:</strong>
                        ${escapeHtml(office.State || "N/A")}
                    </p>

                    <p>
                        <strong>Circle:</strong>
                        ${escapeHtml(office.Circle || "N/A")}
                    </p>

                    <p>
                        <strong>Region:</strong>
                        ${escapeHtml(office.Region || "N/A")}
                    </p>

                    <p>
                        <strong>Division:</strong>
                        ${escapeHtml(office.Division || "N/A")}
                    </p>

                    <p>
                        <strong>Block:</strong>
                        ${escapeHtml(office.Block || "N/A")}
                    </p>

                </div>

            `;
        });


        // =========================================
        // RELATED PINCODES
        // =========================================

        const number = Number(pincode);

        const relatedNumbers = [
            number - 2,
            number - 1,
            number + 1,
            number + 2
        ].filter(function (pin) {

            return pin >= 100000 && pin <= 999999;

        });


        let relatedHtml = "";

        relatedNumbers.forEach(function (pin) {

            relatedHtml += `
                <a href="/pincode/${pin}/">
                    ${pin}
                </a>
            `;

        });


        // =========================================
        // PAGE CONTENT
        // =========================================

        const content = `

            <h1>
                🇮🇳 ${pincode} Pincode
            </h1>

            <p class="intro">

                Find post office information for
                <strong>${pincode}</strong>,
                including post office names,
                district, state, region and
                delivery status.

            </p>


            <div class="summary">

                <div>
                    <strong>Pincode</strong>
                    <br>
                    ${pincode}
                </div>

                <div>
                    <strong>District</strong>
                    <br>
                    ${escapeHtml(first.District || "N/A")}
                </div>

                <div>
                    <strong>State</strong>
                    <br>
                    ${escapeHtml(first.State || "N/A")}
                </div>

                <div>
                    <strong>Circle</strong>
                    <br>
                    ${escapeHtml(first.Circle || "N/A")}
                </div>

                <div>
                    <strong>Region</strong>
                    <br>
                    ${escapeHtml(first.Region || "N/A")}
                </div>

                <div>
                    <strong>Post Offices Found</strong>
                    <br>
                    ${offices.length}
                </div>

            </div>


            <h2>
                Post Offices for ${pincode}
            </h2>

            ${officesHtml}


            <div class="related">

                <h2>
                    Related Pincode Searches
                </h2>

                ${relatedHtml}

            </div>

        `;


        return htmlResponse(
            createPage(
                `${pincode} Pincode - Post Office Details`,
                content,
                pincode
            ),
            200
        );


    } catch (error) {

        console.error(error);

        return htmlResponse(
            errorPage(
                "Pincode Error",
                "Unable to retrieve pincode information right now."
            ),
            500
        );
    }
}


// =========================================
// CREATE HTML PAGE
// =========================================

function createPage(title, content, pincode) {

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
        content="${escapeHtml(
            `Pincode ${pincode} post office information including branch names, district, state, delivery status and postal details.`
        )}"
    >

    <link
        rel="canonical"
        href="https://mytecbooks.pages.dev/pincode/${pincode}/"
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
                Arial,
                sans-serif;

            line-height: 1.6;
        }

        .container {

            max-width: 850px;
            margin: auto;
        }

        .box {

            background: white;

            padding: 25px;

            border-radius: 12px;

            box-shadow:
                0 3px 12px rgba(0,0,0,.06);
        }

        h1 {

            margin-top: 0;

            font-size: 30px;
        }

        h2 {

            margin-top: 25px;
        }

        .intro {

            color: #555;

            font-size: 16px;
        }

        .summary {

            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 12px;

            margin: 20px 0;
        }

        .summary div {

            background: #f1f1f5;

            padding: 14px;

            border-radius: 8px;
        }

        .office {

            background: white;

            padding: 20px;

            margin: 15px 0;

            border-radius: 10px;

            border-left: 4px solid #f48120;

            box-shadow:
                0 2px 10px rgba(0,0,0,.05);
        }

        .office h2 {

            margin-top: 0;

            color: #f48120;

            font-size: 21px;
        }

        .related {

            margin-top: 25px;

            padding: 20px;

            background: #f1f1f5;

            border-radius: 10px;
        }

        .related a {

            display: inline-block;

            padding: 8px 12px;

            margin: 5px;

            background: white;

            color: #222;

            text-decoration: none;

            border-radius: 6px;
        }

        .related a:hover {

            background: #f48120;

            color: white;
        }

        .back {

            color: #f48120;

            text-decoration: none;

            font-weight: bold;
        }

        @media(max-width:600px) {

            body {
                padding: 12px;
            }

            h1 {
                font-size: 25px;
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


// =========================================
// ERROR PAGE
// =========================================

function errorPage(title, message) {

    return createPage(

        title,

        `
            <h1>${escapeHtml(title)}</h1>

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


// =========================================
// RESPONSE
// =========================================

function htmlResponse(html, status) {

    return new Response(html, {

        status: status,

        headers: {

            "content-type":
                "text/html;charset=UTF-8",

            "cache-control":
                "public, max-age=3600"

        }

    });
}


// =========================================
// HTML ESCAPE
// =========================================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}
