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

        /* ================================
           STATES
        ================================= */

        if (type === "states") {

            return json({

                states:
                    STATES.map(function (s) {

                        return {
                            code: s[0],
                            name: s[1]
                        };

                    })

            });

        }


        /* ================================
           CITIES
        ================================= */

        if (type === "cities") {

            const state =
                url.searchParams.get("state");

            return await getCities(state);

        }


        /* ================================
           BANKS
        ================================= */

        if (type === "banks") {

            const state =
                url.searchParams.get("state");

            const city =
                url.searchParams.get("city");

            return await getBanks(
                state,
                city
            );

        }


        /* ================================
           BRANCHES
        ================================= */

        if (type === "branches") {

            const state =
                url.searchParams.get("state");

            const city =
                url.searchParams.get("city");

            const cert =
                url.searchParams.get("cert");

            return await getBranches(
                state,
                city,
                cert
            );

        }


        /* ================================
           BRANCH DETAILS
        ================================= */

        if (type === "branch") {

            const id =
                url.searchParams.get("id");

            return await getBranch(id);

        }


        return json(
            {
                error:
                    "Invalid type."
            },
            400
        );

    }
    catch (error) {

        console.error(
            "US BANK ERROR:",
            error
        );

        return json(
            {
                error:
                    error.message ||
                    "Unable to load data."
            },
            500
        );

    }

}


/* =========================================
   GET CITIES
========================================= */

async function getCities(state) {

    if (!state) {

        return json(
            {
                error:
                    "State is required."
            },
            400
        );

    }


    /*
     * FDIC location search.
     *
     * Request locations for the selected
     * state.
     */

    const data =
        await fdicRequest(
            "/locations",
            {

                filters:
                    `STALP:${state}`,

                fields:
                    "CITY",

                limit:
                    10000,

                offset:
                    0

            }
        );


    const cities =
        new Map();


    for (
        const item of
        data.data || []
    ) {

        const city =
            String(
                item.CITY || ""
            ).trim();


        if (!city) {
            continue;
        }


        const key =
            city.toUpperCase();


        if (!cities.has(key)) {

            cities.set(
                key,
                city
            );

        }

    }


    const result =
        Array.from(
            cities.values()
        );


    result.sort(
        function (a, b) {

            return a.localeCompare(b);

        }
    );


    return json({

        cities:
            result

    });

}


/* =========================================
   GET BANKS
========================================= */

async function getBanks(
    state,
    city
) {

    if (
        !state ||
        !city
    ) {

        return json(
            {
                error:
                    "State and city are required."
            },
            400
        );

    }


    const data =
        await fdicRequest(
            "/locations",
            {

                filters:
                    `STALP:${state}`,

                fields:
                    "NAME,CERT,CITY",

                limit:
                    10000,

                offset:
                    0

            }
        );


    const requestedCity =
        normalize(city);


    const bankMap =
        new Map();


    for (
        const item of
        data.data || []
    ) {

        if (
            normalize(item.CITY)
            !==
            requestedCity
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
                    cert:
                        cert,

                    name:
                        name
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

        banks:
            banks

    });

}


/* =========================================
   GET BRANCHES
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


    const data =
        await fdicRequest(
            "/locations",
            {

                filters:
                    `STALP:${state}`,

                fields:
                    "ID,NAME,OFFNAME,CITY,CERT",

                limit:
                    10000,

                offset:
                    0

            }
        );


    const requestedCity =
        normalize(city);


    const requestedCert =
        String(cert).trim();


    const branches = [];


    const seen =
        new Set();


    for (
        const item of
        data.data || []
    ) {

        if (
            normalize(item.CITY)
            !==
            requestedCity
        ) {

            continue;

        }


        if (
            String(
                item.CERT || ""
            ).trim()
            !==
            requestedCert
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
                        "CERT"
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
                item.CERT || ""

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


    for (
        const key in params
    ) {

        apiUrl.searchParams.set(
            key,
            String(params[key])
        );

    }


    console.log(
        "FDIC REQUEST:",
        apiUrl.toString()
    );


    const response =
        await fetch(
            apiUrl.toString(),
            {
                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    const text =
        await response.text();


    if (!response.ok) {

        console.error(
            "FDIC ERROR:",
            response.status,
            text.substring(
                0,
                500
            )
        );


        throw new Error(
            "FDIC API HTTP " +
            response.status
        );

    }


    /*
     * Important:
     * Check response before JSON.parse.
     */

    if (
        !text.trim().startsWith("{")
    ) {

        console.error(
            "FDIC returned:",
            text.substring(
                0,
                500
            )
        );


        throw new Error(
            "FDIC returned HTML instead of JSON."
        );

    }


    return JSON.parse(text);

}


/* =========================================
   NORMALIZE CITY
========================================= */

function normalize(
    value
) {

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
                    "public, max-age=3600"

            }

        }

    );

}
