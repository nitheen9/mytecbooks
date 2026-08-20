import {
    getUSCities
} from "../data/us-cities.js";


const FDIC_API =
    "https://banks.data.fdic.gov/api";


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
    ["PR", "Puerto Rico"]
];


/* ========================================
   MAIN
======================================== */

export async function onRequest(context) {

    const url =
        new URL(
            context.request.url
        );


    const type =
        url.searchParams.get(
            "type"
        );


    try {

        /* ================================
           STATES
        ================================= */

        if (
            type === "states"
        ) {

            return json({

                states:
                    STATES.map(
                        function (item) {

                            return {

                                code:
                                    item[0],

                                name:
                                    item[1]

                            };

                        }
                    )

            });

        }


        /* ================================
           CITIES
        ================================= */

        if (
            type === "cities"
        ) {

            const state =
                url.searchParams.get(
                    "state"
                );


            return await cities(
                state
            );

        }


        /* ================================
           BANKS
        ================================= */

        if (
            type === "banks"
        ) {

            const state =
                url.searchParams.get(
                    "state"
                );


            const city =
                url.searchParams.get(
                    "city"
                );


            return await banks(
                state,
                city
            );

        }


        /* ================================
           BRANCHES
        ================================= */

        if (
            type === "branches"
        ) {

            const state =
                url.searchParams.get(
                    "state"
                );


            const city =
                url.searchParams.get(
                    "city"
                );


            const cert =
                url.searchParams.get(
                    "cert"
                );


            return await branches(
                state,
                city,
                cert
            );

        }


        /* ================================
           BRANCH DETAILS
        ================================= */

        if (
            type === "branch"
        ) {

            const id =
                url.searchParams.get(
                    "id"
                );


            return await branch(
                id
            );

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
            error
        );


        return json(
            {
                error:
                    error.message ||
                    "Server error."
            },
            500
        );

    }

}


/* ========================================
   CITIES
======================================== */

async function cities(
    state
) {

    if (!state) {

        return json(
            {
                error:
                    "State is required."
            },
            400
        );

    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    const allCities =
        await getUSCities();


    const citySet =
        new Set();


    for (
        const item of
        allCities
    ) {

        if (
            item.state !==
            stateCode
        ) {

            continue;

        }


        if (!item.city) {
            continue;
        }


        citySet.add(
            item.city
        );

    }


    const result =
        Array.from(
            citySet
        );


    result.sort(
        function (a, b) {

            return a.localeCompare(
                b
            );

        }
    );


    return json({

        state:
            stateCode,

        count:
            result.length,

        cities:
            result

    });

}


/* ========================================
   BANKS
======================================== */

async function banks(
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


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    const cityName =
        String(city)
            .trim();


    /*
     * FDIC location search.
     */

    const filters =
        [
            `STALP:${stateCode}`,
            `CITY:"${escapeFilter(cityName)}"`
        ].join(" AND ");


    const data =
        await fdic(
            "/locations",
            {

                filters:
                    filters,

                fields:
                    "NAME,CERT,CITY",

                limit:
                    10000

            }
        );


    const bankMap =
        new Map();


    for (
        const item of
        data.data || []
    ) {

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


    const result =
        Array.from(
            bankMap.values()
        );


    result.sort(
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
            cityName,

        count:
            result.length,

        banks:
            result

    });

}


/* ========================================
   BRANCHES
======================================== */

async function branches(
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


    const cityName =
        String(city)
            .trim();


    const certNumber =
        String(cert)
            .trim();


    const filters =
        [
            `STALP:${stateCode}`,
            `CITY:"${escapeFilter(cityName)}"`,
            `CERT:${certNumber}`
        ].join(" AND ");


    const data =
        await fdic(
            "/locations",
            {

                filters:
                    filters,

                fields:
                    "ID,NAME,OFFNAME,CITY,CERT",

                limit:
                    10000

            }
        );


    const result = [];


    for (
        const item of
        data.data || []
    ) {

        const id =
            String(
                item.ID || ""
            ).trim();


        if (!id) {
            continue;
        }


        result.push({

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


    result.sort(
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
            cityName,

        cert:
            certNumber,

        count:
            result.length,

        branches:
            result

    });

}


/* ========================================
   BRANCH DETAILS
======================================== */

async function branch(
    id
) {

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
        await fdic(
            "/locations",
            {

                filters:
                    `ID:${escapeFilter(id)}`,

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
        data.data.length === 0
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


/* ========================================
   FDIC REQUEST
======================================== */

async function fdic(
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

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    const text =
        await response.text();


    if (!response.ok) {

        throw new Error(
            "FDIC API error: HTTP " +
            response.status
        );

    }


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    }
    catch (error) {

        console.error(
            text.substring(
                0,
                500
            )
        );


        throw new Error(
            "FDIC returned invalid JSON."
        );

    }


    return data;

}


/* ========================================
   ESCAPE FDIC FILTER
======================================== */

function escapeFilter(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /"/g,
            '\\"'
        );

}


/* ========================================
   JSON
======================================== */

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
