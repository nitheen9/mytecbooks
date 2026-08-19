```js
const API_BASE =
    "https://api.data.gov.in/resource/4dbe5667-7b6b-41d7-82af-211562424d9a";

export async function onRequestGet(context) {

    const cin = String(context.params.cin || "")
        .trim()
        .toUpperCase();

    const apiKey = context.env.DATA_GOV_API_KEY;


    /*
     * ==========================================
     * API KEY CHECK
     * ==========================================
     */

    if (!apiKey) {

        return new Response(
            createPage(
                "Company Lookup Error",
                `
                <h1>Company Lookup Error</h1>

                <p>
                    Government API key is not configured.
                </p>
                `
            ),
            {
                status: 500,
                headers: {
                    "content-type":
                        "text/html;charset=UTF-8"
                }
            }
        );
    }


    /*
     * ==========================================
     * CIN VALIDATION
     * ==========================================
     *
     * Indian CIN normally contains 21 characters.
     */

    if (cin.length !== 21) {

        return new Response(
            createPage(
                "Invalid CIN",
                `
                <h1>Invalid CIN</h1>

                <p>
                    Please enter a valid 21-character
                    Corporate Identification Number (CIN).
                </p>

                <p>
                    Entered CIN:
                    <strong>
                        ${escapeHtml(cin)}
                    </strong>
                </p>
                `
            ),
            {
                status: 400,
                headers: {
                    "content-type":
                        "text/html;charset=UTF-8"
                }
            }
        );
    }


    try {

        /*
         * ==========================================
         * DATA.GOV.IN API
         * ==========================================
         *
         * We intentionally do not use an unsupported
         * CIN filter here.
         *
         * The API documentation provides offset/limit.
         */

        const apiUrl =
            API_BASE +
            "?api-key=" +
            encodeURIComponent(apiKey) +
            "&format=json" +
            "&offset=0" +
            "&limit=10000";


        const response = await fetch(apiUrl);


        /*
         * ==========================================
         * API RESPONSE CHECK
         * ==========================================
         */

        if (!response.ok) {

            console.error(
                "data.gov.in HTTP status:",
                response.status
            );

            return new Response(
                createPage(
                    "Company Lookup Error",
                    `
                    <h1>Company Lookup Error</h1>

                    <p>
                        Unable to retrieve company information
                        from the Government Open Data API.
                    </p>
                    `
                ),
                {
                    status: 500,
                    headers: {
                        "content-type":
                            "text/html;charset=UTF-8"
                    }
                }
            );
        }


        const data = await response.json();


        /*
         * ==========================================
         * GET RECORDS
         * ==========================================
         */

        const records =
            Array.isArray(data.records)
                ? data.records
                : [];


        /*
         * ==========================================
         * FIND REQUESTED CIN
         * ==========================================
         */

        const company =
            records.find(function (item) {

                const recordCin =
                    String(
                        item.CORPORATE_IDENTIFICATION_NUMBER || ""
                    )
                    .trim()
                    .toUpperCase();

                return recordCin === cin;

            });


        /*
         * ==========================================
         * COMPANY NOT FOUND
         * ==========================================
         */

        if (!company) {

            return new Response(
                createPage(
                    "Company Not Found",
                    `
                    <h1>Company Not Found</h1>

                    <p>
                        No company information was found for
                        <strong>
                            ${escapeHtml(cin)}
                        </strong>.
                    </p>

                    <p>
                        The Government API did not return
                        this CIN in the requested records.
                    </p>
                    `
                ),
                {
                    status: 404,
                    headers: {
                        "content-type":
                            "text/html;charset=UTF-8"
                    }
                }
            );
        }


        /*
         * ==========================================
         * ACTIVE COMPANY CHECK
         * ==========================================
         */

        const companyStatus =
            String(
                company.COMPANY_STATUS || ""
            )
            .trim()
            .toLowerCase();


        if (companyStatus !== "active") {

            return new Response(
                createPage(
                    "Company Not Active",
                    `
                    <h1>Company Not Active</h1>

                    <p>
                        The company
                        <strong>
                            ${escapeHtml(cin)}
                        </strong>
                        is not currently listed as
                        <strong>Active</strong>.
                    </p>

                    <p>
                        Current status:
                        <strong>
                            ${escapeHtml(
                                company.COMPANY_STATUS || "N/A"
                            )}
                        </strong>
                    </p>
                    `
                ),
                {
                    status: 404,
                    headers: {
                        "content-type":
                            "text/html;charset=UTF-8"
                    }
                }
            );
        }


        /*
         * ==========================================
         * COMPANY NAME
         * ==========================================
         */

        const companyName =
            company.COMPANY_NAME || "Company";


        /*
         * ==========================================
         * PAGE CONTENT
         * ==========================================
         */

        const content = `

            <h1>
                🏢 ${escapeHtml(companyName)}
            </h1>

            <p>
                Company information for
                <strong>
                    ${escapeHtml(
                        company.CORPORATE_IDENTIFICATION_NUMBER
                    )}
                </strong>.
            </p>


            <div class="summary">


                <div>

                    <strong>
                        CIN
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.CORPORATE_IDENTIFICATION_NUMBER
                    )}

                </div>


                <div>

                    <strong>
                        Company Name
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.COMPANY_NAME
                    )}

                </div>


                <div>

                    <strong>
                        Company Status
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.COMPANY_STATUS
                    )}

                </div>


                <div>

                    <strong>
                        Company Class
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.COMPANY_CLASS
                    )}

                </div>


                <div>

                    <strong>
                        Company Category
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.COMPANY_CATEGORY
                    )}

                </div>


                <div>

                    <strong>
                        Sub Category
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.SUB_CATEGORY
                    )}

                </div>


                <div>

                    <strong>
                        Date of Registration
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.DATE_OF_REGISTRATION
                    )}

                </div>


                <div>

                    <strong>
                        Registered State
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.REGISTERED_STATE
                    )}

                </div>


            </div>


            <div class="details">


                <h2>
                    Company Details
                </h2>


                <p>

                    <strong>
                        Authorized Capital:
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.AUTHORIZED_CAPITAL
                    )}

                </p>


                <p>

                    <strong>
                        Paid-up Capital:
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.PAIDUP_CAPITAL
                    )}

                </p>


                <p>

                    <strong>
                        Registrar of Companies:
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.REGISTRAR_OF_COMPANIES
                    )}

                </p>


                <p>

                    <strong>
                        Principal Business Activity:
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.PRINCIPAL_BUSINESS_ACTIVITY
                    )}

                </p>


                <p>

                    <strong>
                        Registered Office Address:
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.REGISTERED_OFFICE_ADDRESS
                    )}

                </p>


                <p>

                    <strong>
                        Sub Category:
                    </strong>

                    <br>

                    ${escapeHtml(
                        company.SUB_CATEGORY
                    )}

                </p>


            </div>

        `;


        /*
         * ==========================================
         * RETURN PAGE
         * ==========================================
         */

        return new Response(

            createPage(
                `${companyName} - Company Details`,
                content
            ),

            {
                status: 200,

                headers: {

                    "content-type":
                        "text/html;charset=UTF-8",

                    "cache-control":
                        "public, max-age=86400"

                }
            }
        );


    } catch (error) {

        console.error(
            "Company lookup error:",
            error
        );


        return new Response(

            createPage(
                "Company Error",

                `
                <h1>
                    Company Error
                </h1>

                <p>
                    Unable to retrieve company information
                    right now. Please try again later.
                </p>
                `
            ),

            {
                status: 500,

                headers: {

                    "content-type":
                        "text/html;charset=UTF-8"

                }
            }
        );
    }
}


/*
 * ==========================================
 * CREATE PAGE
 * ==========================================
 */

function createPage(title, content) {

    return `<!DOCTYPE html>

<html lang="en">

<head>


    <meta charset="UTF-8">


    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >


    <meta
        name="google-site-verification"
        content="dDDf6n61Y6wtILH1Z-cim30ml4yMKMiZu5wJht9j-ko"
    >


    <meta
        name="robots"
        content="index, follow"
    >


    <meta
        name="description"
        content="${escapeHtml(
            `${title} - Find company CIN, registration date, company status, company class, category, authorized capital, paid-up capital, registered state, ROC and registered office details.`
        )}"
    >


    <link
        rel="icon"
        type="image/png"
        href="/favicon.png"
    >


    <title>
        ${escapeHtml(title)}
    </title>


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

            background: #fff;

            padding: 20px;

            margin-top: 20px;

            border-radius: 10px;

            border-left:
                4px solid #1976d2;

        }


        .details p {

            margin: 14px 0;

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

                ← Company & Data Finder

            </a>

        </p>


        ${content}


    </div>


</div>


</body>


</html>`;
}


/*
 * ==========================================
 * ESCAPE HTML
 * ==========================================
 */

function escapeHtml(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}
```
