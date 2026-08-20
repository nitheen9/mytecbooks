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
    ["PR", "Puerto Rico"]
];

export async function onRequest(context) {

    try {

        const url =
            new URL(context.request.url);

        const type =
            url.searchParams.get("type");


        /* ================================
           STATES
        ================================= */

        if (type === "states") {

            return json({

                states: STATES.map(
                    function (item) {

                        return {
                            code: item[0],
                            name: item[1]
                        };

                    }
                )

            });

        }


        /* ================================
           CITIES
        ================================= */

        if (type === "cities") {

            return await cities(
                url.searchParams.get("state")
            );

        }


        /* ================================
           BANKS
        ================================= */

        if (type === "banks") {

            return await banks(
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );

        }


        /* ================================
           BRANCHES
        ================================= */

        if (type === "branches") {

            return await branches(
                url.searchParams.get("state"),
                url.searchParams.get("city"),
                url.searchParams.get("cert")
            );

        }


        /* ================================
           BRANCH DETAILS
        ================================= */

        if (type === "branch") {

            return await branch(
                url.searchParams.get("id")
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

        console.error(error);

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

async function cities(state) {

    if (!state) {

        return json(
            {
                error:
                    "State is required."
            },
            400
        );

    }


    const records =
        await getLocations(state);


    const cityMap =
        new Map();


    for (
        const item of records
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


        if (!cityMap.has(key)) {

            cityMap.set(
                key,
                city
            );

        }

    }


    const result =
        Array.from(
            cityMap.values()
        );


    result.sort(
        function (a, b) {

            return a.localeCompare(b);

        }
    );


    return json({

        cities: result

    });

}


/* ========================================
   BANKS
======================================== */

async function banks(
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


    const records =
        await getLocations(state);


    const wantedCity =
        normalize(city);


    const bankMap =
        new Map();


    for (
        const item of records
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

        banks: result

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


    const records =
        await getLocations(state);


    const wantedCity =
        normalize(city);


    const wantedCert =
        String(cert).trim();


    const result = [];


    const seen =
        new Set();


    for (
        const item of records
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


        result.push({

            id: id,

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

        branches: result

    });

}


/* ========================================
   BRANCH
======================================== */

async function branch(id) {

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
                    "ID:" +
                    escapeFilter(id),

                fields:
                    "ID,NAME,OFFNAME,CITY,STALP,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE",

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

            serviceType:
                item.SERVTYPE || ""

        }

    });

}


/* ========================================
   GET FDIC LOCATIONS
======================================== */

async function getLocations(state) {

    const all = [];

    let offset = 0;

    const limit = 1000;


    while (true) {

        const data =
            await fdic(
                "/locations",
                {
                    filters:
                        "STALP:" +
                        escapeFilter(state),

                    fields:
                        "ID,NAME,OFFNAME,CITY,STALP,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE",

                    limit: limit,

                    offset: offset
                }
            );


        const rows =
            Array.isArray(data.data)
                ? data.data
                : [];


        all.push(
            ...rows
        );


        if (
            rows.length <
            limit
        ) {

            break;

        }


        offset += limit;


        /*
         * Prevent an accidentally huge request.
         */

        if (
            offset >= 50000
        ) {

            break;

        }

    }


    return all;

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
        "FDIC:",
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
            "FDIC HTTP:",
            response.status,
            text
        );

        throw new Error(
            "FDIC HTTP " +
            response.status
        );

    }


    try {

        return JSON.parse(text);

    }
    catch (error) {

        console.error(
            "FDIC returned non-JSON:",
            text.substring(0, 500)
        );

        throw new Error(
            "FDIC returned invalid JSON."
        );

    }

}


/* ========================================
   NORMALIZE
======================================== */

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


/* ========================================
   ESCAPE FILTER
======================================== */

function escapeFilter(value) {

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
   JSON RESPONSE
======================================== */

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
