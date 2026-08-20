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

export async function onRequest(context) {

    const url = new URL(context.request.url);
    const type = url.searchParams.get("type");

    try {

        if (type === "banks") {
            return await getBanks();
        }

        if (type === "states") {
            return await getStates(
                url.searchParams.get("cert")
            );
        }

        if (type === "cities") {
            return await getCities(
                url.searchParams.get("cert"),
                url.searchParams.get("state")
            );
        }

        if (type === "branches") {
            return await getBranches(
                url.searchParams.get("cert"),
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );
        }

        return json(
            {
                error: "Invalid API type."
            },
            400
        );

    } catch (error) {

        console.error("US BANK API ERROR:", error);

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
   ACTIVE BANKS ONLY
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
                    search:
                        "ACTIVE:1",

                    fields:
                        "NAME,CERT,CITY,STNAME,ACTIVE",

                    limit:
                        limit,

                    offset:
                        offset
                }
            );

        const rows =
            extractRows(data);

        if (rows.length === 0) {
            break;
        }

        for (const item of rows) {

            const active =
                String(
                    item.ACTIVE ?? ""
                ).trim();

            /*
             * Extra safety check.
             */
            if (active !== "1") {
                continue;
            }

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
                !name ||
                seen.has(cert)
            ) {
                continue;
            }

            seen.add(cert);

            const city =
                String(
                    item.CITY ?? ""
                ).trim();

            const state =
                String(
                    item.STNAME ?? ""
                ).trim();

            let label =
                name +
                " — FDIC #" +
                cert;

            if (city && state) {

                label =
                    name +
                    " — " +
                    city +
                    ", " +
                    state +
                    " — FDIC #" +
                    cert;
            }

            allBanks.push({

                cert: cert,

                name: name,

                city: city,

                state: state,

                label: label
            });
        }

        if (rows.length < limit) {
            break;
        }

        offset += limit;

        if (offset >= 100000) {
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
   STATES FOR SELECTED ACTIVE BANK
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

    const rows =
        await getAllLocations(
            `CERT:${escapeQuery(cert)}`,
            "STALP"
        );

    const stateSet =
        new Set();

    for (const item of rows) {

        const state =
            String(
                item.STALP ?? ""
            )
            .trim()
            .toUpperCase();

        if (state) {
            stateSet.add(state);
        }
    }

    const states =
        Array.from(stateSet)
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
   CITIES
========================================= */

async function getCities(
    cert,
    state
) {

    if (!cert || !state) {

        return json(
            {
                error:
                    "Bank and state are required."
            },
            400
        );
    }

    const stateCode =
        String(state)
            .trim()
            .toUpperCase();

    const rows =
        await getAllLocations(
            `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(stateCode)}`,
            "CITY,STALP"
        );

    const cityMap =
        new Map();

    for (const item of rows) {

        const city =
            String(
                item.CITY ?? ""
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
   BRANCHES
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
        String(state)
            .trim()
            .toUpperCase();

    const wantedCity =
        normalizeCity(city);

    const rows =
        await getAllLocations(
            `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(stateCode)}`,
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
            ].join(",")
        );

    const branches = [];
    const seen = new Set();

    for (const item of rows) {

        const itemCity =
            normalizeCity(
                item.CITY
            );

        if (
            itemCity !==
            wantedCity
        ) {
            continue;
        }

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

        const branchName =
            String(
                item.OFFNAME ||
                item.NAME ||
                "Bank Branch"
            ).trim();

        branches.push({

            id:
                id,

            name:
                branchName,

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
            String(city),

        count:
            branches.length,

        branches:
            branches
    });
}


/* =========================================
   PAGINATED LOCATION LOADER
========================================= */

async function getAllLocations(
    search,
    fields
) {

    const allRows = [];

    const limit = 5000;

    let offset = 0;

    while (true) {

        const data =
            await fdicRequest(
                "/locations",
                {
                    search:
                        search,

                    fields:
                        fields,

                    limit:
                        limit,

                    offset:
                        offset
                }
            );

        const rows =
            extractRows(data);

        if (rows.length === 0) {
            break;
        }

        allRows.push(
            ...rows
        );

        if (
            rows.length <
            limit
        ) {
            break;
        }

        offset += limit;

        if (offset >= 100000) {
            break;
        }
    }

    return allRows;
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
                1000
            )
        );

        throw new Error(
            "FDIC API HTTP " +
            response.status
        );
    }

    try {

        return JSON.parse(
            text
        );

    } catch {

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
   UNWRAP CURRENT FDIC RESPONSE
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
   NORMALIZE CITY
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
   ESCAPE SEARCH
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
   JSON
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
