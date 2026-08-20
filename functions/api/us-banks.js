const FDIC_API = "https://banks.data.fdic.gov/api";
const CENSUS_API = "https://api.census.gov/data/2024/acs/acs5";

const STATES = [
    ["01", "Alabama", "AL"],
    ["02", "Alaska", "AK"],
    ["04", "Arizona", "AZ"],
    ["05", "Arkansas", "AR"],
    ["06", "California", "CA"],
    ["08", "Colorado", "CO"],
    ["09", "Connecticut", "CT"],
    ["10", "Delaware", "DE"],
    ["11", "District of Columbia", "DC"],
    ["12", "Florida", "FL"],
    ["13", "Georgia", "GA"],
    ["15", "Hawaii", "HI"],
    ["16", "Idaho", "ID"],
    ["17", "Illinois", "IL"],
    ["18", "Indiana", "IN"],
    ["19", "Iowa", "IA"],
    ["20", "Kansas", "KS"],
    ["21", "Kentucky", "KY"],
    ["22", "Louisiana", "LA"],
    ["23", "Maine", "ME"],
    ["24", "Maryland", "MD"],
    ["25", "Massachusetts", "MA"],
    ["26", "Michigan", "MI"],
    ["27", "Minnesota", "MN"],
    ["28", "Mississippi", "MS"],
    ["29", "Missouri", "MO"],
    ["30", "Montana", "MT"],
    ["31", "Nebraska", "NE"],
    ["32", "Nevada", "NV"],
    ["33", "New Hampshire", "NH"],
    ["34", "New Jersey", "NJ"],
    ["35", "New Mexico", "NM"],
    ["36", "New York", "NY"],
    ["37", "North Carolina", "NC"],
    ["38", "North Dakota", "ND"],
    ["39", "Ohio", "OH"],
    ["40", "Oklahoma", "OK"],
    ["41", "Oregon", "OR"],
    ["42", "Pennsylvania", "PA"],
    ["44", "Rhode Island", "RI"],
    ["45", "South Carolina", "SC"],
    ["46", "South Dakota", "SD"],
    ["47", "Tennessee", "TN"],
    ["48", "Texas", "TX"],
    ["49", "Utah", "UT"],
    ["50", "Vermont", "VT"],
    ["51", "Virginia", "VA"],
    ["53", "Washington", "WA"],
    ["54", "West Virginia", "WV"],
    ["55", "Wisconsin", "WI"],
    ["56", "Wyoming", "WY"],
    ["72", "Puerto Rico", "PR"]
];


/* =========================================
   MAIN
========================================= */

export async function onRequest(context) {

    try {

        const url =
            new URL(context.request.url);

        const type =
            url.searchParams.get("type");


        /* =================================
           STATES
        ================================= */

        if (type === "states") {

            return json({
                states: STATES.map(function (s) {

                    return {
                        code: s[2],
                        census: s[0],
                        name: s[1]
                    };

                })
            });

        }


        /* =================================
           CITIES
        ================================= */

        if (type === "cities") {

            return await getCities(
                url.searchParams.get("state")
            );

        }


        /* =================================
           BANKS
        ================================= */

        if (type === "banks") {

            return await getBanks(
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );

        }


        /* =================================
           BRANCHES
        ================================= */

        if (type === "branches") {

            return await getBranches(
                url.searchParams.get("state"),
                url.searchParams.get("city"),
                url.searchParams.get("cert")
            );

        }


        /* =================================
           BRANCH DETAILS
        ================================= */

        if (type === "branch") {

            return await getBranch(
                url.searchParams.get("id")
            );

        }


        return json(
            {
                error: "Invalid request type."
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


    const stateInfo =
        STATES.find(function (s) {

            return s[2] === state;

        });


    if (!stateInfo) {

        return json(
            {
                error: "Invalid state."
            },
            400
        );

    }


    const censusState =
        stateInfo[0];


    const apiUrl =
        CENSUS_API +
        "?get=NAME" +
        "&for=place:*" +
        "&in=state:" +
        censusState;


    const response =
        await fetch(apiUrl);


    if (!response.ok) {

        throw new Error(
            "Census API returned " +
            response.status
        );

    }


    const rows =
        await response.json();


    const citySet =
        new Set();


    for (
        let i = 1;
        i < rows.length;
        i++
    ) {

        const name =
            String(
                rows[i][0] || ""
            ).trim();


        if (!name) {
            continue;
        }


        const city =
            cleanCityName(name);


        if (city) {

            citySet.add(city);

        }

    }


    const cities =
        Array.from(citySet);


    cities.sort(
        function (a, b) {

            return a.localeCompare(b);

        }
    );


    return json({
        cities: cities
    });

}


/* =========================================
   BANKS

   IMPORTANT:
   We request FDIC locations by STATE only.
   Then we filter CITY in Cloudflare.
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


    /*
     * Get all locations in this state.
     */

    const records =
        await getFDICLocationsByState(
            state
        );


    const requestedCity =
        normalizeCity(city);


    const bankMap =
        new Map();


    for (
        const item of records
    ) {

        const itemCity =
            normalizeCity(
                item.CITY
            );


        if (
            itemCity !==
            requestedCity
        ) {

            continue;

        }


        const cert =
            String(
                item.CERT || ""
            ).trim();


        const bankName =
            String(
                item.NAME || ""
            ).trim();


        if (
            cert &&
            bankName
        ) {

            bankMap.set(
                cert,
                {
                    cert: cert,
                    name: bankName
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
        banks: banks
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


    const records =
        await getFDICLocationsByState(
            state
        );


    const requestedCity =
        normalizeCity(city);


    const requestedCert =
        String(cert).trim();


    const branchMap =
        new Map();


    for (
        const item of records
    ) {

        const itemCity =
            normalizeCity(
                item.CITY
            );


        const itemCert =
            String(
                item.CERT || ""
            ).trim();


        if (
            itemCity !==
            requestedCity
        ) {

            continue;

        }


        if (
            itemCert !==
            requestedCert
        ) {

            continue;

        }


        const id =
            String(
                item.ID || ""
            ).trim();


        if (!id) {
            continue;
        }


        const branchName =
            String(
                item.OFFNAME ||
                item.NAME ||
                ""
            ).trim();


        branchMap.set(
            id,
            {
                id: id,
                name:
                    branchName ||
                    "Bank Branch"
            }
        );

    }


    const branches =
        Array.from(
            branchMap.values()
        );


    branches.sort(
        function (a, b) {

            return a.name.localeCompare(
                b.name
            );

        }
    );


    return json({
        branches: branches
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


    /*
     * Get location directly by ID.
     */

    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    "ID:" +
                    escapeFilter(id),

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

                limit: 1
            }
        );


    const item =
        data.data &&
        data.data.length
            ? data.data[0]
            : null;


    if (!item) {

        return json(
            {
                error:
                    "Branch not found."
            },
            404
        );

    }


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

            branchType:
                "Bank Branch",

            serviceType:
                item.SERVTYPE || ""

        }

    });

}


/* =========================================
   FDIC LOCATIONS BY STATE

   Pagination is used so we don't depend
   on a huge single response.
========================================= */

async function getFDICLocationsByState(
    state
) {

    const allRecords = [];

    let offset = 0;

    const limit = 1000;

    while (true) {

        const data =
            await fdicRequest(
                "/locations",
                {
                    filters:
                        "STALP:" +
                        escapeFilter(state),

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

                    limit: limit,

                    offset: offset
                }
            );


        const rows =
            Array.isArray(data.data)
                ? data.data
                : [];


        allRecords.push(
            ...rows
        );


        /*
         * Stop when fewer than limit records
         * are returned.
         */

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
            offset >= 50000
        ) {

            break;

        }

    }


    return allRecords;

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


    if (!response.ok) {

        const text =
            await response.text();


        console.error(
            "FDIC API:",
            response.status,
            text
        );


        throw new Error(
            "FDIC API returned HTTP " +
            response.status
        );

    }


    return await response.json();

}


/* =========================================
   CITY NORMALIZATION
========================================= */

function normalizeCity(
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
   CLEAN CENSUS CITY
========================================= */

function cleanCityName(
    name
) {

    return String(name)

        .replace(
            /\s+city$/i,
            ""
        )

        .replace(
            /\s+town$/i,
            ""
        )

        .replace(
            /\s+village$/i,
            ""
        )

        .replace(
            /\s+borough$/i,
            ""
        )

        .replace(
            /\s+municipality$/i,
            ""
        )

        .replace(
            /\s+CDP$/i,
            ""
        )

        .trim();

}


/* =========================================
   ESCAPE FDIC FILTER
========================================= */

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


/* =========================================
   JSON
========================================= */

function json(
    data,
    status = 200
) {

    return new Response(
        JSON.stringify(data),
        {
            status: status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600"

            }

        }
    );

}
