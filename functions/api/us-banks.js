const FDIC_API = "https://banks.data.fdic.gov/api";

const STATES = [
    ["AL", "Alabama"],
    ["AK", "Alaska"],
    ["AZ", "Arizona"],
    ["AR", "Arkansas"],
    ["CA", "California"],
    ["CO", "Colorado"],
    ["CT", "Connecticut"],
    ["DE", "Delaware"],
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
    ["DC", "District of Columbia"],
    ["PR", "Puerto Rico"],
    ["VI", "Virgin Islands"],
    ["GU", "Guam"],
    ["AS", "American Samoa"],
    ["MP", "Northern Mariana Islands"]
];


/* =========================================
   MAIN API
========================================= */

export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const type =
        requestUrl.searchParams.get("type");

    try {

        /* STATES */

        if (type === "states") {

            return json({
                states: STATES.map(function (item) {

                    return {
                        code: item[0],
                        name: item[1]
                    };

                })
            });

        }


        /* CITIES */

        if (type === "cities") {

            const state =
                requestUrl.searchParams.get("state");

            return await getCities(state);

        }


        /* BANKS */

        if (type === "banks") {

            const state =
                requestUrl.searchParams.get("state");

            const city =
                requestUrl.searchParams.get("city");

            return await getBanks(
                state,
                city
            );

        }


        /* BRANCHES */

        if (type === "branches") {

            const state =
                requestUrl.searchParams.get("state");

            const city =
                requestUrl.searchParams.get("city");

            const cert =
                requestUrl.searchParams.get("cert");

            return await getBranches(
                state,
                city,
                cert
            );

        }


        /* BRANCH DETAILS */

        if (type === "branch") {

            const id =
                requestUrl.searchParams.get("id");

            return await getBranch(id);

        }


        return json(
            {
                error: "Invalid API type.",
                validTypes: [
                    "states",
                    "cities",
                    "banks",
                    "branches",
                    "branch"
                ]
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
                    "Unable to load bank data."
            },
            500
        );

    }

}


/* =========================================
   CITIES
========================================= */

async function getCities(state) {

    if (!state) {

        return json(
            {
                error: "State is required."
            },
            400
        );

    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    /*
     * Ask FDIC for location records.
     *
     * We request CITY and STALP only.
     */

    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    `STALP:${stateCode}`,

                fields:
                    "CITY,STALP",

                limit:
                    10000,

                offset:
                    0
            }
        );


    const cityMap =
        new Map();


    if (Array.isArray(data.data)) {

        data.data.forEach(
            function (item) {

                const city =
                    String(
                        item.CITY || ""
                    ).trim();


                if (!city) {
                    return;
                }


                const key =
                    city.toUpperCase();


                if (!cityMap.has(key)) {

                    cityMap.set(
                        key,
                        city
                    );

                }

            }
        );

    }


    const cities =
        Array.from(
            cityMap.values()
        );


    cities.sort(
        function (a, b) {

            return a.localeCompare(b);

        }
    );


    return json({

        state:
            stateCode,

        count:
            cities.length,

        cities:
            cities

    });

}


/* =========================================
   BANKS
========================================= */

async function getBanks(
    state,
    city
) {

    if (!state || !city) {

        return json(
            {
                error:
                    "State and city are required."
            },
            400
        );

    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    const wantedCity =
        normalize(city);


    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    `STALP:${stateCode}`,

                fields:
                    "NAME,CERT,CITY",

                limit:
                    10000,

                offset:
                    0
            }
        );


    const bankMap =
        new Map();


    for (
        const item of
        data.data || []
    ) {

        if (
            normalize(item.CITY)
            !== wantedCity
        ) {

            continue;

        }


        const cert =
            String(
                item.CERT || ""
            ).trim();


        const name =
            String(
                item.NAME || ""
            ).trim();


        if (
            cert &&
            name
        ) {

            bankMap.set(
                cert,
                {
                    cert: cert,
                    name: name
                }
            );

        }

    }


    const banks =
        Array.from(
            bankMap.values()
        );


    banks.sort(
        function (a, b) {

            return a.name.localeCompare(
                b.name
            );

        }
    );


    return json({

        state:
            stateCode,

        city:
            city,

        count:
            banks.length,

        banks:
            banks

    });

}


/* =========================================
   BRANCHES
========================================= */

async function getBranches(
    state,
    city,
    cert
) {

    if (
        !state ||
        !city ||
        !cert
    ) {

        return json(
            {
                error:
                    "State, city and bank are required."
            },
            400
        );

    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    const wantedCity =
        normalize(city);


    const wantedCert =
        String(cert)
            .trim();


    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    `STALP:${stateCode}`,

                fields:
                    "ID,NAME,OFFNAME,CITY,CERT",

                limit:
                    10000,

                offset:
                    0
            }
        );


    const branches = [];


    const seen =
        new Set();


    for (
        const item of
        data.data || []
    ) {

        if (
            normalize(item.CITY)
            !== wantedCity
        ) {

            continue;

        }


        if (
            String(
                item.CERT || ""
            ).trim()
            !== wantedCert
        ) {

            continue;

        }


        const id =
            String(
                item.ID || ""
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

        state:
            stateCode,

        city:
            city,

        cert:
            wantedCert,

        count:
            branches.length,

        branches:
            branches

    });

}


/* =========================================
   BRANCH DETAILS
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
                filters:
                    `ID:${id}`,

                fields:
                    [
                        "ID",
                        "NAME",
                        "OFFNAME",
                        "CITY",
                        "STALP",
                        "ADDRESS",
                        "ZIP",
                        "COUNTY",
                        "CERT",
                        "SERVTYPE"
                    ].join(","),

                limit:
                    1
            }
        );


    if (
        !data.data ||
        !data.data.length
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
        data.data[0];


    return json({

        branch: {

            id:
                item.ID || "",

            bankName:
                item.NAME || "",

            branchName:
                item.OFFNAME ||
                item.NAME ||
                "",

            address:
                item.ADDRESS || "",

            city:
                item.CITY || "",

            state:
                item.STALP || "",

            zip:
                item.ZIP || "",

            county:
                item.COUNTY || "",

            cert:
                item.CERT || "",

            serviceType:
                item.SERVTYPE || ""

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
            FDIC_API + endpoint
        );


    apiUrl.searchParams.set(
        "format",
        "json"
    );


    Object.keys(params).forEach(
        function (key) {

            apiUrl.searchParams.set(
                key,
                String(params[key])
            );

        }
    );


    console.log(
        "FDIC REQUEST:",
        apiUrl.toString()
    );


    const response =
        await fetch(
            apiUrl.toString(),
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    const text =
        await response.text();


    console.log(
        "FDIC STATUS:",
        response.status
    );


    if (!response.ok) {

        console.error(
            "FDIC RESPONSE:",
            text.substring(0, 1000)
        );

        throw new Error(
            "FDIC API returned HTTP " +
            response.status
        );

    }


    let data;


    try {

        data =
            JSON.parse(text);

    }
    catch (error) {

        console.error(
            "FDIC NON-JSON RESPONSE:",
            text.substring(0, 1000)
        );

        throw new Error(
            "FDIC returned invalid JSON."
        );

    }


    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "Invalid FDIC response."
        );

    }


    return data;

}


/* =========================================
   NORMALIZE
========================================= */

function normalize(value) {

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /[^A-Z0-9]+/g,
            " "
        )
        .trim();

}


/* =========================================
   JSON RESPONSE
========================================= */

function json(
    data,
    status = 200
) {

    return new Response(

        JSON.stringify(data),

        {
            status:
                status,

            headers: {

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
