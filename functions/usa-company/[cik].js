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


    const cleanCik =
        String(cik)
            .replace(/\D/g, "")
            .padStart(10, "0");


    if (!/^\d{10}$/.test(cleanCik)) {

        return jsonResponse(
            {
                error: "Invalid SEC CIK"
            },
            400
        );

    }


    /* =========================================
       SEC SUBMISSIONS API
    ========================================= */

    const apiUrl =
        "https://data.sec.gov/submissions/CIK" +
        cleanCik +
        ".json";


    try {

        /*
         IMPORTANT:

         SEC requires automated requests
         to identify the application.

         Replace this with your own
         site/contact information if desired.
        */

        const response =
            await fetch(
                apiUrl,
                {
                    headers: {

                        "User-Agent":
                            "MyTecBooks mytecbooks.pages.dev contact@example.com",

                        "Accept":
                            "application/json"

                    }
                }
            );


        if (!response.ok) {

            console.error(
                "SEC response:",
                response.status
            );

            return jsonResponse(
                {
                    error:
                        "SEC company data unavailable"
                },
                response.status
            );

        }


        const data =
            await response.json();


        if (!data) {

            return jsonResponse(
                {
                    error:
                        "No company data found"
                },
                404
            );

        }


        /* =========================================
           BASIC COMPANY INFORMATION
        ========================================= */

        const name =
            data.name ||
            "N/A";


        const tickers =
            Array.isArray(
                data.tickers
            )
                ? data.tickers
                : [];


        const exchanges =
            Array.isArray(
                data.exchanges
            )
                ? data.exchanges
                : [];


        const ticker =
            tickers.length
                ? tickers[0]
                : "N/A";


        const exchange =
            exchanges.length
                ? exchanges[0]
                : "N/A";


        /* =========================================
           BUSINESS ADDRESS
        ========================================= */

        const businessAddress =
            data.addresses &&
            data.addresses.business
                ? data.addresses.business
                : {};


        const mailingAddress =
            data.addresses &&
            data.addresses.mailing
                ? data.addresses.mailing
                : {};


        /*
           SEC commonly provides:

           street1
           street2
           city
           stateOrCountry
           zipCode
           stateOrCountryDescription
        */


        const street1 =
            businessAddress.street1 ||
            mailingAddress.street1 ||
            "";


        const street2 =
            businessAddress.street2 ||
            mailingAddress.street2 ||
            "";


        const city =
            businessAddress.city ||
            mailingAddress.city ||
            "N/A";


        const state =
            businessAddress.stateOrCountry ||
            mailingAddress.stateOrCountry ||
            "N/A";


        const stateDescription =
            businessAddress.stateOrCountryDescription ||
            mailingAddress.stateOrCountryDescription ||
            state;


        const zip =
            businessAddress.zipCode ||
            mailingAddress.zipCode ||
            "N/A";


        /* =========================================
           PHONE
        ========================================= */

        const phone =
            businessAddress.phone ||
            mailingAddress.phone ||
            "N/A";


        /* =========================================
           SIC
        ========================================= */

        const sic =
            data.sic ||
            "N/A";


        const sicDescription =
            data.sicDescription ||
            "N/A";


        /* =========================================
           EIN
        ========================================= */

        const ein =
            data.ein ||
            "N/A";


        /* =========================================
           FISCAL YEAR END
        ========================================= */

        const fiscalYearEnd =
            data.fiscalYearEnd ||
            "N/A";


        /* =========================================
           FORMER NAMES
        ========================================= */

        const formerNames = [];


        if (
            Array.isArray(
                data.formerNames
            )
        ) {

            data.formerNames
                .forEach(
                    function(item) {

                        formerNames.push({

                            name:
                                item.name ||
                                "N/A",

                            from:
                                item.from ||
                                "",

                            to:
                                item.to ||
                                ""

                        });

                    }
                );

        }


        /* =========================================
           RECENT FILINGS
        ========================================= */

        const recentFilings = [];


        const recent =
            data.filings &&
            data.filings.recent
                ? data.filings.recent
                : null;


        if (recent) {

            const forms =
                recent.form || [];


            const filingDates =
                recent.filingDate || [];


            const accessionNumbers =
                recent.accessionNumber || [];


            const primaryDocuments =
                recent.primaryDocument || [];


            const reportDates =
                recent.reportDate || [];


            /*
                Show latest 10 filings.
            */

            const count =
                Math.min(
                    forms.length,
                    10
                );


            for (
                let i = 0;
                i < count;
                i++
            ) {

                const accession =
                    accessionNumbers[i] ||
                    "";


                const accessionNoDash =
                    accession
                        .replace(
                            /-/g,
                            ""
                        );


                const filingUrl =
                    accession &&
                    primaryDocuments[i]
                        ? (
                            "https://www.sec.gov/Archives/edgar/data/" +
                            String(
                                parseInt(
                                    cleanCik,
                                    10
                                )
                            ) +
                            "/" +
                            accessionNoDash +
                            "/" +
                            primaryDocuments[i]
                        )
                        : (
                            "https://www.sec.gov/edgar/browse/?CIK=" +
                            cleanCik
                        );


                recentFilings.push({

                    form:
                        forms[i] ||
                        "N/A",

                    filingDate:
                        filingDates[i] ||
                        "N/A",

                    reportDate:
                        reportDates[i] ||
                        "N/A",

                    accessionNumber:
                        accession ||
                        "N/A",

                    url:
                        filingUrl

                });

            }

        }


        /* =========================================
           RESPONSE
        ========================================= */

        const result = {

            name:
                name,

            cik:
                cleanCik,

            ticker:
                ticker,

            exchange:
                exchange,

            tickers:
                tickers,

            exchanges:
                exchanges,

            sic:
                sic,

            sicDescription:
                sicDescription,

            ein:
                ein,

            street1:
                street1,

            street2:
                street2,

            city:
                city,

            state:
                state,

            stateDescription:
                stateDescription,

            zip:
                zip,

            phone:
                phone,

            fiscalYearEnd:
                fiscalYearEnd,

            formerNames:
                formerNames,

            recentFilings:
                recentFilings

        };


        return new Response(
            JSON.stringify(
                result
            ),
            {
                status: 200,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    /*
                       Cache company data so
                       repeated visits do not
                       hit SEC every time.
                    */

                    "Cache-Control":
                        "public, max-age=3600, s-maxage=86400"

                }

            }
        );


    }
    catch (error) {

        console.error(
            "SEC company error:",
            error
        );


        return jsonResponse(
            {
                error:
                    "Unable to load SEC company information"
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
            status: status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=300"

            }

        }
    );

}
