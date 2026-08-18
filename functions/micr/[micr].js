export async function onRequestGet(context) {

    const micr = String(context.params.micr || "")
        .trim();

    // MICR must be exactly 9 digits
    if (!/^\d{9}$/.test(micr)) {

        return new Response(
            createPage(
                "Invalid MICR Code",
                `
                <h1>Invalid MICR Code</h1>

                <p>
                    Please enter a valid 9-digit MICR code.
                </p>
                `
            ),
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
            "https://ifsclookup.in/api/micr/" +
            encodeURIComponent(micr);

        const response = await fetch(apiUrl);

        if (!response.ok) {

            return new Response(
                createPage(
                    "MICR Code Not Found",
                    `
                    <h1>MICR Code Not Found</h1>

                    <p>
                        No bank branch information was found for
                        <strong>${escapeHtml(micr)}</strong>.
                    </p>
                    `
                ),
                {
                    status: 404,
                    headers: {
                        "content-type": "text/html;charset=UTF-8"
                    }
                }
            );
        }

        const bank = await response.json();

        if (!bank || !bank.micr) {

            return new Response(
                createPage(
                    "MICR Code Not Found",
                    `
                    <h1>MICR Code Not Found</h1>

                    <p>
                        No information was found for
                        <strong>${escapeHtml(micr)}</strong>.
                    </p>
                    `
                ),
                {
                    status: 404,
                    headers: {
                        "content-type": "text/html;charset=UTF-8"
                    }
                }
            );
        }


        const content = `

            <h1>🏦 ${escapeHtml(micr)} MICR Code</h1>

            <p>
                Bank and branch details for
                <strong>${escapeHtml(micr)}</strong>.
            </p>


            <div class="summary">

                <div>
                    <strong>MICR Code</strong><br>
                    ${escapeHtml(bank.micr || micr)}
                </div>

                <div>
                    <strong>Bank</strong><br>
                    ${escapeHtml(bank.bank_name || "N/A")}
                </div>

                <div>
                    <strong>Branch</strong><br>
                    ${escapeHtml(bank.branch || "N/A")}
                </div>

                <div>
                    <strong>City</strong><br>
                    ${escapeHtml(bank.city || "N/A")}
                </div>

                <div>
                    <strong>District</strong><br>
                    ${escapeHtml(bank.district || "N/A")}
                </div>

                <div>
                    <strong>State</strong><br>
                    ${escapeHtml(bank.state || "N/A")}
                </div>

            </div>


            <div class="details">

                <h2>Bank Branch Details</h2>

                <p>
                    <strong>Bank:</strong>
                    ${escapeHtml(bank.bank_name || "N/A")}
                </p>

                <p>
                    <strong>Branch:</strong>
                    ${escapeHtml(bank.branch || "N/A")}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${escapeHtml(bank.address || "N/A")}
                </p>

                <p>
                    <strong>City:</strong>
                    ${escapeHtml(bank.city || "N/A")}
                </p>

                <p>
                    <strong>District:</strong>
                    ${escapeHtml(bank.district || "N/A")}
                </p>

                <p>
                    <strong>State:</strong>
                    ${escapeHtml(bank.state || "N/A")}
                </p>

                <p>
                    <strong>Contact:</strong>
                    ${escapeHtml(bank.contact || "N/A")}
                </p>

                <p>
                    <strong>IFSC Code:</strong>
                    ${escapeHtml(bank.ifsc || "N/A")}
                </p>

                <p>
                    <strong>Bank Code:</strong>
                    ${escapeHtml(bank.bank_code || "N/A")}
                </p>

                <p>
                    <strong>SWIFT:</strong>
                    ${escapeHtml(bank.swift || "N/A")}
                </p>

                <p>
                    <strong>NEFT:</strong>
                    ${bank.neft ? "Available" : "Not Available"}
                </p>

                <p>
                    <strong>RTGS:</strong>
                    ${bank.rtgs ? "Available" : "Not Available"}
                </p>

                <p>
                    <strong>IMPS:</strong>
                    ${bank.imps ? "Available" : "Not Available"}
                </p>

                <p>
                    <strong>UPI:</strong>
                    ${bank.upi ? "Available" : "Not Available"}
                </p>

            </div>


            <div class="related">

                <h2>Related Searches</h2>

                ${
                    bank.ifsc
                    ?
                    `<a href="/ifsc/${encodeURIComponent(bank.ifsc)}/">
                        ${escapeHtml(bank.ifsc)}
                    </a>`
                    :
                    ""
                }

            </div>

        `;


        return new Response(
            createPage(
                `${micr} MICR Code - Bank Branch Details`,
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
                "MICR Error",
                `
                <h1>MICR Error</h1>

                <p>
                    Unable to retrieve bank information right now.
                    Please try again later.
                </p>
                `
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

        .details {
            background: white;
            padding: 20px;
            margin-top: 20px;
            border-radius: 10px;
            border-left: 4px solid #1976d2;

            box-shadow:
                0 2px 10px rgba(0,0,0,.05);
        }

        .details p {
            margin: 10px 0;
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
            background: #1976d2;
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
                ← Pincode & IFSC & MICR Finder
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
