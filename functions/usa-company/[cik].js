export async function onRequest(context) {

    const { cik } = context.params;


    /* =========================================
       VALIDATE CIK
    ========================================= */

    if (!cik) {

        return jsonResponse(
            {
                error: "Missing CIK"
            },
            400
        );

    }


    const cikNumber =
        String(cik)
            .replace(/\D/g, "");


    if (!cikNumber) {

        return jsonResponse(
            {
                error: "Invalid CIK"
            },
            400
        );

    }


    /*
        SEC requires a 10-digit CIK
        including leading zeros.
    */

    const paddedCik =
        cikNumber.padStart(
            10,
            "0"
        );


    /* =========================================
       SEC SUBMISSIONS API
    ========================================= */

    const apiUrl =
        "https://data.sec.gov/submissions/CIK" +
        paddedCik +
        ".json";


    try {

        const response =
            await fetch(
                apiUrl,
                {
                    headers: {

                        /*
                            Identify your website.
                            Replace this with your
                            actual site information.
                        */

                        "User-Agent":
                            "MyTecBooks Company Finder admin@mytecbooks.pages.dev",

                        "Accept":
                            "application/json"

                    }
                }
            );


        if (!response.ok) {

            return jsonResponse(
                {
                    error:
                        "SEC API returned HTTP " +
                        response.status
                },
                response.status
            );

        }


        const data =
            await response.json();


        /* =========================================
           COMPANY
        ========================================= */

        const company = {

            name:
                data.name ||
                null,

            cik:
                data.cik ||
                paddedCik,

            sic:
                data.sic ||
                null,

            sicDescription:
                data.sicDescription ||
                null,

            stateOfIncorporation:
                data.stateOfIncorporation ||
                null,

            fiscalYearEnd:
                data.fiscalYearEnd ||
                null,

            phone:
                data.phone ||
                null,

            formerNames:
                Array.isArray(
                    data.formerNames
                )
                    ? data.formerNames
                    : []

        };


        /* =========================================
           BUSINESS ADDRESS
        ========================================= */

        const address =
            data.addresses &&
            data.addresses.business
                ? data.addresses.business
                : {};


        /* =========================================
           MAILING ADDRESS
        ========================================= */

        const mailingAddress =
            data.addresses &&
            data.addresses.mailing
                ? data.addresses.mailing
                : {};


        /* =========================================
           TICKERS
        ========================================= */

        const tickers =
            Array.isArray(
                data.tickers
            )
                ? data.tickers.map(
                    function(ticker, index) {

                        return {

                            ticker:
                                ticker,

                            exchange:
                                Array.isArray(
                                    data.exchanges
                                ) &&
                                data.exchanges[index]
                                    ? data.exchanges[index]
                                    : null

                        };

                    }
                )
                : [];


        /* =========================================
           EXCHANGES
        ========================================= */

        const exchanges =
            Array.isArray(
                data.exchanges
            )
                ? data.exchanges
                : [];


        /* =========================================
           RESPONSE
        ========================================= */

        return jsonResponse(
            {

                company:
                    company,

                address:
                    address,

                mailingAddress:
                    mailingAddress,

                tickers:
                    tickers,

                exchanges:
                    exchanges

            },
            200
        );

    }
    catch (error) {

        console.error(
            "SEC API error:",
            error
        );


        return jsonResponse(
            {
                error:
                    "Unable to retrieve SEC company information."
            },
            500
        );

    }

}


/* =========================================
   JSON RESPONSE
========================================= */

function jsonResponse(
    data,
    status
) {

    return new Response(
        JSON.stringify(
            data
        ),
        {

            status:
                status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400"

            }

        }
    );

}
