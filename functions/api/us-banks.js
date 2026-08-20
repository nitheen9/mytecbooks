const FDIC_API = "https://api.fdic.gov/banks";

const STATES = [
    ["AL", "Alabama"],
    ["AK", "Alaska"],
    ["AZ", "Arizona"],
    ["AR", "Arkansas"],
    ["CA", "California"],
    ["CO", "Colorado"],
    ["CT", "Connecticut"],
    ["DE", "Delaware"],
    ["DC", "District of Columbia"],
    ["FL", "Florida"],
    ["GA", "Georgia"],
    ["HI", "Hawaii"],
    ["ID", "Idaho"],
    ["IL", "Illinois"],
    ["IN", "Indiana"],
    ["IA", "Iowa"],
    ["KS", "Kansas"],
    ["KY", "Kentucky"],
    ["LA", "Louisiana"],
    ["ME", "Maine"],
    ["MD", "Maryland"],
    ["MA", "Massachusetts"],
    ["MI", "Michigan"],
    ["MN", "Minnesota"],
    ["MS", "Mississippi"],
    ["MO", "Missouri"],
    ["MT", "Montana"],
    ["NE", "Nebraska"],
    ["NV", "Nevada"],
    ["NH", "New Hampshire"],
    ["NJ", "New Jersey"],
    ["NM", "New Mexico"],
    ["NY", "New York"],
    ["NC", "North Carolina"],
    ["ND", "North Dakota"],
    ["OH", "Ohio"],
    ["OK", "Oklahoma"],
    ["OR", "Oregon"],
    ["PA", "Pennsylvania"],
    ["RI", "Rhode Island"],
    ["SC", "South Carolina"],
    ["SD", "South Dakota"],
    ["TN", "Tennessee"],
    ["TX", "Texas"],
    ["UT", "Utah"],
    ["VT", "Vermont"],
    ["VA", "Virginia"],
    ["WA", "Washington"],
    ["WV", "West Virginia"],
    ["WI", "Wisconsin"],
    ["WY", "Wyoming"],
    ["PR", "Puerto Rico"],
    ["VI", "Virgin Islands"],
    ["GU", "Guam"],
    ["AS", "American Samoa"],
    ["MP", "Northern Mariana Islands"]
];


/* =========================================
   MAIN
========================================= */

export async function onRequest(context) {

    const url =
        new URL(context.request.url);

    const type =
        url.searchParams.get("type");

    try {

        /* ==============================
           BANKS
        ============================== */

        if (type === "banks") {

            return await getBanks();

        }


        /* ==============================
           STATES
        ============================== */

        if (type === "states") {

            return await getStates(
                url.searchParams.get("cert")
            );

        }


        /* ==============================
           CITIES
        ============================== */

        if (type === "cities") {

            return await getCities(
                url.searchParams.get("cert"),
                url.searchParams.get("state")
            );

        }


        /* ==============================
           BRANCHES
        ============================== */

        if (type === "branches") {

            return await getBranches(
                url.searchParams.get("cert"),
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );

        }


        /* ==============================
           BRANCH DETAILS
        ============================== */

        if (type === "branch") {

            return await getBranch(
                url.searchParams.get("id")
            );

        }


        return json(
            {
                error:
                    "Invalid API type."
            },
            400
        );

    }
    catch (error) {

        console.error(
            "US BANK API ERROR:",
            error
        );

        return json(
            {
                error:
                    error.message ||
                    "Unable to load U.S. bank data."
            },
            500
        );

    }

}


/* =========================================
   GET ALL BANKS
========================================= */

async function getBanks() {

    const allBanks = [];

    const seen = new Set();

    const limit = 5000;

    let offset = 0;


    while (true) {

        const data =
            await fdicRequest(
                "/institutions",
                {
                    fields:
                        "NAME,CERT",

                    limit:
                        limit,

                    offset:
                        offset
                }
            );


        const rows =
            extractRows(data);


        if (!rows.length) {

            break;

        }


        for (
            const item of rows
        ) {

            const cert =
                String(
                    item.CERT ?? ""
                ).trim();


            const name =
                String(
                    item.NAME ?? ""
                ).trim();


            if (
                !cert ||
                !name
            ) {

                continue;

            }


            if (
                seen.has(cert)
            ) {

                continue;

            }


            seen.add(cert);


            allBanks.push({

                cert:
                    cert,

                name:
                    name

            });

        }


        if (
            rows.length <
            limit
        ) {

            break;

        }


        offset += limit;


        /*
         * Safety limit.
         */

        if (
            offset >= 100000
        ) {

            break;

        }

    }


    allBanks.sort(
        function (a, b) {

            return a.name.localeCompare(
                b.name
            );

        }
    );


    return json({

        count:
            allBanks.length,

        banks:
            allBanks

    });

}


/* =========================================
   GET STATES FOR BANK
========================================= */

async function getStates(cert) {

    if (!cert) {

        return json(
            {
                error:
                    "Bank certificate is required."
            },
            400
        );

    }


    const data =
        await fdicRequest(
            "/locations",
            {
                search:
                    `CERT:${escapeQuery(cert)}`,

                fields:
                    "STALP",

                limit:
                    5000,

                offset:
                    0
            }
        );


    const rows =
        extractRows(data);


    const stateSet =
        new Set();


    for (
        const item of rows
    ) {

        const code =
            String(
                item.STALP ?? ""
            )
            .trim()
            .toUpperCase();


        if (code) {

            stateSet.add(
                code
            );

        }

    }


    const states =
        Array.from(
            stateSet
        )
        .sort()
        .map(
            function (code) {

                const found =
                    STATES.find(
                        function (item) {

                            return (
                                item[0] === code
                            );

                        }
                    );


                return {

                    code:
                        code,

                    name:
                        found
                            ? found[1]
                            : code

                };

            }
        );


    return json({

        cert:
            String(cert),

        count:
            states.length,

        states:
            states

    });

}


/* =========================================
   GET CITIES FOR BANK + STATE
========================================= */

async function getCities(
    cert,
    state
) {

    if (
        !cert ||
        !state
    ) {

        return json(
            {
                error:
                    "Bank and state are required."
            },
            400
        );

    }


    const stateCode =
        String(
            state
        )
        .trim()
        .toUpperCase();


    const data =
        await fdicRequest(
            "/locations",
            {
                search:
                    `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(stateCode)}`,

                fields:
                    "CITY",

                limit:
                    5000,

                offset:
                    0
            }
        );


    const rows =
        extractRows(data);


    const cityMap =
        new Map();


    for (
        const item of rows
    ) {

        const city =
            String(
                item.CITY ?? ""
            ).trim();


        if (!city) {

            continue;

        }


        const key =
            city.toUpperCase();


        if (
            !cityMap.has(key)
        ) {

            cityMap.set(
                key,
                city
            );

        }

    }


    const cities =
        Array.from(
            cityMap.values()
        );


    cities.sort(
        function (a, b) {

            return a.localeCompare(
                b
            );

        }
    );


    return json({

        cert:
            String(cert),

        state:
            stateCode,

        count:
            cities.length,

        cities:
            cities

    });

}


/* =========================================
   GET BRANCHES
========================================= */

async function getBranches(
    cert,
    state,
    city
) {

    if (
        !cert ||
        !state ||
        !city
    ) {

        return json(
            {
                error:
                    "Bank, state and city are required."
            },
            400
        );

    }


    const stateCode =
        String(
            state
        )
        .trim()
        .toUpperCase();


    const cityName =
        String(
            city
        ).trim();


    const search =
        [
            `CERT:${escapeQuery(cert)}`,
            `STALP:${escapeQuery(stateCode)}`,
            `CITY:"${escapeQuery(cityName)}"`
        ].join(" AND ");


    const data =
        await fdicRequest(
            "/locations",
            {
                search:
                    search,

                fields:
                    [
                        "ID",
                        "NAME",
                        "OFFNAME",
                        "ADDRESS",
                        "CITY",
                        "STALP",
                        "ZIP",
                        "COUNTY",
                        "CERT",
                        "SERVTYPE"
                    ].join(","),

                limit:
                    5000,

                offset:
                    0
            }
        );


    const rows =
        extractRows(data);


    const branches = [];

    const seen =
        new Set();


    for (
        const item of rows
    ) {

        const id =
            String(
                item.ID ?? ""
            ).trim();


        if (
            !id ||
            seen.has(id)
        ) {

            continue;

        }


        seen.add(id);


        branches.push({

            id:
                id,

            name:
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    "Bank Branch"
                ).trim(),

            address:
                String(
                    item.ADDRESS ||
                    ""
                ).trim(),

            city:
                String(
                    item.CITY ||
                    ""
                ).trim(),

            state:
                String(
                    item.STALP ||
                    ""
                ).trim(),

            zip:
                String(
                    item.ZIP ||
                    ""
                ).trim(),

            county:
                String(
                    item.COUNTY ||
                    ""
                ).trim(),

            cert:
                String(
                    item.CERT ||
                    cert
                ).trim(),

            serviceType:
                String(
                    item.SERVTYPE ||
                    ""
                ).trim()

        });

    }


    branches.sort(
        function (a, b) {

            return a.name.localeCompare(
                b.name
            );

        }
    );


    return json({

        cert:
            String(cert),

        state:
            stateCode,

        city:
            cityName,

        count:
            branches.length,

        branches:
            branches

    });

}


/* =========================================
   GET ONE BRANCH
========================================= */

async function getBranch(id) {

    if (!id) {

        return json(
            {
                error:
                    "Branch ID is required."
            },
            400
        );

    }


    const data =
        await fdicRequest(
            "/locations",
            {
                search:
                    `ID:${escapeQuery(id)}`,

                fields:
                    [
                        "ID",
                        "NAME",
                        "OFFNAME",
                        "ADDRESS",
                        "CITY",
                        "STALP",
                        "ZIP",
                        "COUNTY",
                        "CERT",
                        "SERVTYPE"
                    ].join(","),

                limit:
                    1,

                offset:
                    0
            }
        );


    const rows =
        extractRows(data);


    if (
        rows.length === 0
    ) {

        return json(
            {
                error:
                    "Branch not found."
            },
            404
        );

    }


    const item =
        rows[0];


    return json({

        branch: {

            id:
                item.ID || "",

            bank:
                item.NAME || "",

            branch:
                item.OFFNAME ||
                "",

            address:
                item.ADDRESS ||
                "",

            city:
                item.CITY ||
                "",

            state:
                item.STALP ||
                "",

            zip:
                item.ZIP ||
                "",

            county:
                item.COUNTY ||
                "",

            cert:
                item.CERT ||
                "",

            serviceType:
                item.SERVTYPE ||
                ""

        }

    });

}


/* =========================================
   FDIC REQUEST
========================================= */

async function fdicRequest(
    endpoint,
    params
) {

    const apiUrl =
        new URL(
            FDIC_API +
            endpoint
        );


    apiUrl.searchParams.set(
        "format",
        "json"
    );


    for (
        const key in params
    ) {

        apiUrl.searchParams.set(
            key,
            String(
                params[key]
            )
        );

    }


    const response =
        await fetch(
            apiUrl.toString(),
            {
                method:
                    "GET",

                headers:
                    {
                        "Accept":
                            "application/json"
                    }
            }
        );


    const text =
        await response.text();


    if (
        !response.ok
    ) {

        console.error(
            "FDIC HTTP:",
            response.status,
            text.substring(
                0,
                1000
            )
        );


        throw new Error(
            "FDIC API returned HTTP " +
            response.status
        );

    }


    try {

        return JSON.parse(
            text
        );

    }
    catch (error) {

        console.error(
            "FDIC RESPONSE:",
            text.substring(
                0,
                1000
            )
        );


        throw new Error(
            "FDIC returned invalid JSON."
        );

    }

}


/* =========================================
   UNWRAP FDIC RECORDS

   Current response:

   data: [
      {
         data: {
            CERT: 10,
            NAME: "..."
         }
      }
   ]
========================================= */

function extractRows(
    result
) {

    if (
        !result ||
        !Array.isArray(
            result.data
        )
    ) {

        return [];

    }


    return result.data.map(
        function (item) {

            if (
                item &&
                item.data &&
                typeof item.data ===
                    "object"
            ) {

                return item.data;

            }


            return item;

        }
    );

}


/* =========================================
   ESCAPE FDIC QUERY
========================================= */

function escapeQuery(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /"/g,
        '\\"'
    );

}


/* =========================================
   JSON RESPONSE
========================================= */

function json(
    data,
    status = 200
) {

    return new Response(
        JSON.stringify(
            data
        ),
        {
            status:
                status,

            headers:
                {
                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=3600",

                    "Access-Control-Allow-Origin":
                        "*"
                }
        }
    );

}
