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

    const url =
        new URL(context.request.url);

    const type =
        url.searchParams.get("type");

    try {

        /*
         * BANK DROPDOWN
         *
         * Returns only:
         * NAME + CERT
         *
         * It does NOT return the complete
         * branch database.
         */
        if (type === "banks") {

            return await getBankList();

        }

        /*
         * BANK SEARCH
         */
        if (type === "search") {

            return await searchBanks(
                url.searchParams.get("q")
            );

        }

        /*
         * STATES
         */
        if (type === "states") {

            return await getStates(
                getCertParameter(url)
            );

        }

        /*
         * CITIES
         */
        if (type === "cities") {

            return await getCities(
                getCertParameter(url),
                url.searchParams.get("state")
            );

        }

        /*
         * BRANCHES
         */
        if (type === "branches") {

            return await getBranches(
                getCertParameter(url),
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );

        }

        return notFoundResponse();

    }
    catch (error) {

        console.error(
            "US BANK API ERROR:",
            error
        );

        return json(
            {
                error:
                    "Unable to load U.S. bank data."
            },
            500
        );

    }

}


/* =========================================================
   BANK LIST
========================================================= */

async function getBankList() {

    const data =
        await fdicRequest(
            "/institutions",
            {
                fields:
                    "NAME,CERT,ACTIVE",

                limit:
                    5000,

                offset:
                    0
            }
        );

    const rows =
        extractRows(data);

    const bankMap =
        new Map();

    for (const item of rows) {

        const active =
            String(
                item.ACTIVE ?? ""
            ).trim();

        /*
         * Keep active institutions.
         */
        if (
            active &&
            active !== "1"
        ) {
            continue;
        }

        const name =
            String(
                item.NAME ?? ""
            ).trim();

        const cert =
            String(
                item.CERT ?? ""
            ).trim();

        if (
            !name ||
            !cert
        ) {
            continue;
        }

        /*
         * Some banks can have
         * multiple certificates.
         */
        if (
            !bankMap.has(name)
        ) {

            bankMap.set(
                name,
                {
                    name:
                        name,

                    certs:
                        []
                }
            );

        }

        const bank =
            bankMap.get(name);

        if (
            !bank.certs.includes(cert)
        ) {

            bank.certs.push(
                cert
            );

        }

    }

    const banks =
        Array.from(
            bankMap.values()
        );

    banks.sort(
        function(a, b) {

            return a.name.localeCompare(
                b.name
            );

        }
    );

    return json({

        count:
            banks.length,

        banks:
            banks

    });

}


/* =========================================================
   SEARCH BANKS
========================================================= */

async function searchBanks(query) {

    const q =
        String(
            query || ""
        ).trim();

    if (
        q.length < 2
    ) {

        return json(
            {
                error:
                    "Enter at least 2 characters."
            },
            400
        );

    }

    const searchText =
        q
            .replace(
                /\\/g,
                "\\\\"
            )
            .replace(
                /"/g,
                '\\"'
            );

    const filter =
        'NAME:"' +
        searchText +
        '"';

    const data =
        await fdicRequest(
            "/institutions",
            {
                filters:
                    filter,

                fields:
                    "NAME,CERT,CITY,STNAME,ACTIVE",

                limit:
                    50,

                offset:
                    0
            }
        );

    const rows =
        extractRows(data);

    const banks =
        [];

    const seen =
        new Set();

    for (
        const item of rows
    ) {

        const active =
            String(
                item.ACTIVE ?? ""
            ).trim();

        if (
            active &&
            active !== "1"
        ) {
            continue;
        }

        const name =
            String(
                item.NAME ?? ""
            ).trim();

        const cert =
            String(
                item.CERT ?? ""
            ).trim();

        if (
            !name ||
            !cert
        ) {
            continue;
        }

        if (
            seen.has(cert)
        ) {
            continue;
        }

        seen.add(cert);

        banks.push({

            name:
                name,

            cert:
                cert,

            city:
                String(
                    item.CITY ?? ""
                ).trim(),

            state:
                String(
                    item.STNAME ?? ""
                ).trim()

        });

    }

    banks.sort(
        function(a, b) {

            return a.name.localeCompare(
                b.name
            );

        }
    );

    return json({

        count:
            banks.length,

        banks:
            banks

    });

}


/* =========================================================
   CERT PARAMETER
========================================================= */

function getCertParameter(url) {

    const certs =
        url.searchParams.get("certs");

    if (certs) {
        return certs;
    }

    return url.searchParams.get("cert") || "";

}


/* =========================================================
   STATES
========================================================= */

async function getStates(
    certParameter
) {

    const certs =
        parseCerts(
            certParameter
        );

    if (
        certs.length === 0
    ) {

        return json(
            {
                error:
                    "Bank certificate is required."
            },
            400
        );

    }

    const search =
        buildCertSearch(
            certs
        );

    const rows =
        await getAllLocations(
            search,
            "STALP"
        );

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
            function(code) {

                const found =
                    STATES.find(
                        function(item) {

                            return (
                                item[0] ===
                                code
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

        certs:
            certs,

        count:
            states.length,

        states:
            states

    });

}


/* =========================================================
   CITIES
========================================================= */

async function getCities(
    certParameter,
    state
) {

    const certs =
        parseCerts(
            certParameter
        );

    if (
        certs.length === 0
    ) {

        return json(
            {
                error:
                    "Bank certificate is required."
            },
            400
        );

    }

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
        String(
            state
        )
        .trim()
        .toUpperCase();

    const certSearch =
        buildCertSearch(
            certs
        );

    const search =
        "(" +
        certSearch +
        ")" +
        " AND STALP:" +
        escapeQuery(
            stateCode
        );

    const rows =
        await getAllLocations(
            search,
            "CITY"
        );

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
        function(a, b) {

            return a.localeCompare(
                b
            );

        }
    );

    return json({

        certs:
            certs,

        state:
            stateCode,

        count:
            cities.length,

        cities:
            cities

    });

}


/* =========================================================
   BRANCHES
========================================================= */

async function getBranches(
    certParameter,
    state,
    city
) {

    const certs =
        parseCerts(
            certParameter
        );

    if (
        certs.length === 0
    ) {

        return json(
            {
                error:
                    "Bank certificate is required."
            },
            400
        );

    }

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
        String(
            state
        )
        .trim()
        .toUpperCase();

    const requestedCity =
        normalizeCity(
            city
        );

    const certSearch =
        buildCertSearch(
            certs
        );

    const search =
        "(" +
        certSearch +
        ")" +
        " AND STALP:" +
        escapeQuery(
            stateCode
        );

    const fields = [
        "UNINUM",
        "NAME",
        "OFFNUM",
        "OFFNAME",
        "ADDRESS",
        "CITY",
        "STALP",
        "STNAME",
        "ZIP",
        "COUNTY",
        "STCNTY",
        "CERT",
        "SERVTYPE",
        "SERVTYPE_DESC",
        "MAINOFF",
        "RUNDATE",
        "LATITUDE",
        "LONGITUDE"
    ].join(",");

    const rows =
        await getAllLocations(
            search,
            fields
        );

    const branches =
        [];

    const seen =
        new Set();

    for (
        const item of rows
    ) {

        if (
            normalizeCity(
                item.CITY
            ) !==
            requestedCity
        ) {

            continue;

        }

        const uninum =
            String(
                item.UNINUM ?? ""
            ).trim();

        if (
            !uninum ||
            seen.has(uninum)
        ) {

            continue;

        }

        seen.add(
            uninum
        );

        branches.push(
            formatBranch(
                item
            )
        );

    }

    branches.sort(
        function(a, b) {

            const nameCompare =
                a.name.localeCompare(
                    b.name
                );

            if (
                nameCompare !== 0
            ) {

                return nameCompare;

            }

            return formatBranchLocation(
                a
            ).localeCompare(
                formatBranchLocation(
                    b
                )
            );

        }
    );

    return json({

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


/* =========================================================
   FORMAT BRANCH
========================================================= */

function formatBranch(item) {

    return {

        id:
            String(
                item.UNINUM ||
                ""
            ).trim(),

        uninum:
            String(
                item.UNINUM ||
                ""
            ).trim(),

        name:
            String(
                item.OFFNAME ||
                item.NAME ||
                "Bank Branch"
            ).trim(),

        bankName:
            String(
                item.NAME ||
                ""
            ).trim(),

        officeNumber:
            String(
                item.OFFNUM ||
                ""
            ).trim(),

        officeName:
            String(
                item.OFFNAME ||
                ""
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

        stateName:
            String(
                item.STNAME ||
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
                item.STCNTY ||
                ""
            ).trim(),

        cert:
            String(
                item.CERT ||
                ""
            ).trim(),

        serviceType:
            String(
                item.SERVTYPE ||
                ""
            ).trim(),

        serviceTypeDescription:
            String(
                item.SERVTYPE_DESC ||
                ""
            ).trim(),

        mainOffice:
            formatMainOffice(
                item.MAINOFF
            ),

        lastUpdated:
            String(
                item.RUNDATE ||
                ""
            ).trim(),

        latitude:
            String(
                item.LATITUDE ||
                ""
            ).trim(),

        longitude:
            String(
                item.LONGITUDE ||
                ""
            ).trim()

    };

}


/* =========================================================
   GET ALL LOCATIONS
========================================================= */

async function getAllLocations(
    search,
    fields
) {

    const allRows =
        [];

    const limit =
        5000;

    let offset =
        0;

    while (true) {

        const data =
            await fdicRequest(
                "/locations",
                {
                    filters:
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
            extractRows(
                data
            );

        if (
            rows.length === 0
        ) {

            break;

        }

        allRows.push(
            ...rows
        );

        if (
            rows.length < limit
        ) {

            break;

        }

        offset +=
            limit;

        /*
         * Safety limit.
         */
        if (
            offset >= 100000
        ) {

            break;

        }

    }

    return allRows;

}


/* =========================================================
   BUILD CERT SEARCH
========================================================= */

function buildCertSearch(
    certs
) {

    return certs
        .map(
            function(cert) {

                return (
                    "CERT:" +
                    escapeQuery(
                        cert
                    )
                );

            }
        )
        .join(
            " OR "
        );

}


/* =========================================================
   PARSE CERTS
========================================================= */

function parseCerts(
    value
) {

    if (!value) {
        return [];
    }

    return String(value)
        .split(",")
        .map(
            function(item) {

                return item.trim();

            }
        )
        .filter(
            function(item) {

                return /^\d+$/.test(
                    item
                );

            }
        );

}


/* =========================================================
   MAIN OFFICE
========================================================= */

function formatMainOffice(
    value
) {

    const normalized =
        String(
            value || ""
        )
        .trim()
        .toUpperCase();

    if (
        normalized === "1" ||
        normalized === "Y" ||
        normalized === "YES" ||
        normalized === "TRUE"
    ) {

        return "Yes";

    }

    if (
        normalized === "0" ||
        normalized === "N" ||
        normalized === "NO" ||
        normalized === "FALSE"
    ) {

        return "No";

    }

    return String(
        value || ""
    ).trim();

}


/* =========================================================
   CITY NORMALIZATION
========================================================= */

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


/* =========================================================
   BRANCH LOCATION
========================================================= */

function formatBranchLocation(
    branch
) {

    const parts =
        [];

    if (
        branch.address
    ) {

        parts.push(
            branch.address
        );

    }

    const cityStateZip =
        [
            branch.city,
            branch.state,
            branch.zip
        ]
        .filter(Boolean)
        .join(", ");

    if (
        cityStateZip
    ) {

        parts.push(
            cityStateZip
        );

    }

    return parts.join(
        " | "
    );

}


/* =========================================================
   QUERY ESCAPE
========================================================= */

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


/* =========================================================
   FDIC REQUEST
========================================================= */

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
            "FDIC API HTTP " +
            response.status
        );

    }

    try {

        return JSON.parse(
            text
        );

    }
    catch {

        throw new Error(
            "FDIC returned invalid JSON."
        );

    }

}


/* =========================================================
   EXTRACT ROWS
========================================================= */

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
        function(item) {

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


/* =========================================================
   JSON RESPONSE
========================================================= */

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
                    "public, max-age=300",

                "X-Robots-Tag":
                    "noindex, nofollow, noarchive",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }
    );

}


/* =========================================================
   404
========================================================= */

function notFoundResponse() {

    return new Response(
        "Not Found",
        {
            status:
                404,

            headers: {

                "Content-Type":
                    "text/plain; charset=UTF-8",

                "Cache-Control":
                    "no-store",

                "X-Robots-Tag":
                    "noindex, nofollow, noarchive"

            }

        }
    );

}
