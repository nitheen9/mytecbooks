export async function onRequestGet(context) {

    const pincode = context.params.pincode;

    if (!/^\d{6}$/.test(pincode)) {
        return new Response(
            "<h1>Invalid Pincode</h1><p>Please enter a valid 6-digit pincode.</p>",
            {
                status: 400,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }

    try {

        const apiUrl =
            "https://api.postalpincode.in/pincode/" +
            encodeURIComponent(pincode);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error("API error");
        }

        const data = await response.json();

        if (
            !Array.isArray(data) ||
            !data[0] ||
            data[0].Status !== "Success" ||
            !Array.isArray(data[0].PostOffice) ||
            data[0].PostOffice.length === 0
        ) {
            return new Response(
                createPage(
                    "Pincode Not Found",
                    `<p>No post office information was found for pincode <strong>${escapeHtml(pincode)}</strong>.</p>`
                ),
                {
                    status: 404,
                    headers: {
                        "content-type": "text/html;charset=UTF-8"
                    }
                }
            );
        }

        const offices = data[0].PostOffice;

        const first = offices[0];

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


        const relatedPins = [
            Number(pincode) - 2,
            Number(pincode) - 1,
            Number(pincode) + 1,
            Number(pincode) + 2
        ]
        .filter(function (pin) {
            return pin >= 100000 && pin <= 999999;
        });


        let relatedHtml = "";

        relatedPins.forEach(function (pin) {

            relatedHtml += `
                <a href="/pincode/${pin}/">
                    ${pin}
                </a>
            `;

        });


        const content = `

            <h1>🇮🇳 ${escapeHtml(pincode)} Pincode</h1>

            <p>
                Find post office information for
                <strong>${escapeHtml(pincode)}</strong>,
                including post office names, district,
                state and delivery status.
            </p>

            <div class="summary">

                <div>
                    <strong>Pincode</strong><br>
                    ${escapeHtml(pincode)}
                </div>

                <div>
                    <strong>District</strong><br>
                    ${escapeHtml(first.District || "N/A")}
                </div>

                <div>
                    <strong>State</strong><br>
                    ${escapeHtml(first.State || "N/A")}
                </div>

                <div>
                    <strong>Circle</strong><br>
                    ${escapeHtml(first.Circle || "N/A")}
                </div>

                <div>
                    <strong>Region</strong><br>
                    ${escapeHtml(first.Region || "N/A")}
                </div>

                <div>
                    <strong>Post Offices</strong><br>
                    ${offices.length}
                </div>

            </div>

            <h2>
                Post Offices for ${escapeHtml(pincode)}
            </h2>

            ${officesHtml}

            <div class="related">

                <h2>Related Pincode Searches</h2>

                ${relatedHtml}

            </div>
        `;


        return new Response(
            createPage(
                `${pincode} Pincode - Post Office Details`,
                content
            ),
            {
                status: 200,
                headers: {
                    "content-type": "text/html;charset=UTF-8",
                    "cache-control": "public, max-age=3600"
                }
            }
        );

    } catch (error) {

        console.error(error);

        return new Response(
            createPage(
                "Pincode Error",
                "<p>Unable to retrieve pincode information right now. Please try again.</p>"
            ),
            {
                status: 500,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }
}


function createPage(title, content) {

    return `<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>${escapeHtml(title)}</title>

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
        }

        .related {
            margin-top: 25px;
            padding: 20px;
            background: white;
            border-radius: 10px;
        }

        .related a {
            display: inline-block;
            padding: 8px 12px;
            margin: 5px;
            background: #f1f1f5;
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

        <p>
            <a href="/">
                ← Pincode & IFSC Finder
            </a>
        </p>

        ${content}

    </div>

</div>

</body>

</html>`;
}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
