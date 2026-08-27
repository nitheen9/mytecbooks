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


/* =========================================================
   MAIN REQUEST
========================================================= */

export async function onRequest(context) {

    const url = new URL(context.request.url);

    const type = url.searchParams.get("type");

    try {

        /*
         * IMPORTANT
         *
         * Public GET request is intentionally blocked:
         *
         * GET /api/us-banks?type=banks
         *
         * returns 404.
         *
         * Finder uses POST.
         */

        if (type === "banks") {

            if (context.request.method !== "POST") {
                return notFoundResponse();
            }

            return await getBanksForFinder();
        }


        if (type === "search") {

            return await searchBanks(
                url.searchParams.get("q")
            );
        }


        if (type === "states") {

            return await getStates(
                getCertParameter(url)
            );
        }


        if (type === "cities") {

            return await getCities(
                getCertParameter(url),
                url.searchParams.get("state")
            );
        }


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
                error: "Unable to load U.S. bank data."
            },
            500
        );
    }
}


/* =========================================================
   GET ALL ACTIVE BANKS
========================================================= */

async function getBanksForFinder() {

    /*
     * DO NOT use only:
     *
     * limit: 1000
     *
     * because that returns only the first page.
     *
     * We paginate until FDIC has no more records.
     */

    const bankMap = new Map();

    const limit = 1000;

    let offset = 0;

    while (true) {

        const data = await fdicRequest(
            "/institutions",
            {
                filters: "ACTIVE:1",

                fields:
                    "NAME,CERT,CITY,STNAME,ACTIVE",

                limit: limit,

                offset: offset
            }
        );

        const rows = extractRows(data);

        if (rows.length === 0) {
            break;
        }


        for (const item of rows) {

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


            if (!name || !cert) {
                continue;
            }


            /*
             * Use NAME as grouping key.
             *
             * One bank can have multiple CERT numbers.
             */

            const key =
                name
                    .toUpperCase()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


            if (!bankMap.has(key)) {

                bankMap.set(
                    key,
                    {
                        name: name,
                        certs: []
                    }
                );
            }


            const bank =
                bankMap.get(key);


            if (
                !bank.certs.includes(cert)
            ) {

                bank.certs.push(cert);
            }
        }


        /*
         * If FDIC returned fewer records
         * than requested, this is the final page.
         */

        if (rows.length < limit) {
            break;
        }


        offset += limit;


        /*
         * Safety protection.
         *
         * Prevents an accidental infinite loop.
         */

        if (offset > 50000) {
            console.error(
                "FDIC bank pagination safety limit reached."
            );

            break;
        }
    }


    const banks =
        Array.from(
            bankMap.values()
        );


    banks.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );


    return json(
        {
            count: banks.length,

            banks: banks
        },
        200,
        3600
    );
}


/* =========================================================
   SEARCH BANKS
========================================================= */

async function searchBanks(query) {

    const q =
        String(
            query || ""
        ).trim();


    if (q.length < 2) {

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
                    100,

                offset:
                    0
            }
        );


    const rows =
        extractRows(data);


    const banks = [];

    const seen =
        new Set();


    for (const item of rows) {

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


        if (!name || !cert) {
            continue;
        }


        if (seen.has(cert)) {
            continue;
        }


        seen.add(cert);


        banks.push(
            {
                name: name,

                cert: cert,

                city:
                    String(
                        item.CITY ?? ""
                    ).trim(),

                state:
                    String(
                        item.STNAME ?? ""
                    ).trim()
            }
        );
    }


    banks.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );


    return json(
        {
            count:
                banks.length,

            banks:
                banks
        }
    );
}


/* =========================================================
   CERT PARAMETER
========================================================= */

function getCertParameter(url) {

    const certs =
        url.searchParams.get(
            "certs"
        );


    if (certs) {
        return certs;
    }


    return (
        url.searchParams.get(
            "cert"
        ) || ""
    );
}


/* =========================================================
   STATES
========================================================= */

async function getStates(certParameter) {

    const certs =
        parseCerts(
            certParameter
        );


    if (certs.length === 0) {

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


    for (const item of rows) {

        const code =
            String(
                item.STALP ?? ""
            )
            .trim()
            .toUpperCase();


        if (code) {
            stateSet.add(code);
        }
    }


    const states =
        Array.from(
            stateSet
        )
        .sort()
        .map(
            code => {

                const found =
                    STATES.find(
                        item =>
                            item[0] === code
                    );


                return {
                    code: code,

                    name:
                        found
                            ? found[1]
                            : code
                };
            }
        );


    return json(
        {
            certs: certs,

            count:
                states.length,

            states:
                states
        }
    );
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


    if (certs.length === 0) {

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


    for (const item of rows) {

        const city =
            String(
                item.CITY ?? ""
            ).trim();


        if (!city) {
            continue;
        }


        const key =
            city
                .toUpperCase()
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


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
        (a, b) =>
            a.localeCompare(b)
    );


    return json(
        {
            certs: certs,

            state: stateCode,

            count:
                cities.length,

            cities:
                cities
        }
    );
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


    if (certs.length === 0) {

        return json(
            {
                error:
                    "Bank certificate is required."
            },
            400
        );
    }


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


    const branches = [];

    const seen =
        new Set();


    for (const item of rows) {

        if (
            normalizeCity(
                item.CITY
            ) !== requestedCity
        ) {
            continue;
        }


        const uninum =
            String(
                item.UNINUM ?? ""
            ).trim();


        if (!uninum) {
            continue;
        }


        if (seen.has(uninum)) {
            continue;
        }


        seen.add(uninum);


        branches.push(
            formatBranch(
                item
            )
        );
    }


    branches.sort(
        (a, b) => {

            const nameCompare =
                a.name.localeCompare(
                    b.name
                );


            if (nameCompare !== 0) {
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


    return json(
        {
            state:
                stateCode,

            city:
                String(city),

            count:
                branches.length,

            branches:
                branches
        }
    );
}


/* =========================================================
   FORMAT BRANCH
========================================================= */

function formatBranch(item) {

    return {

        id:
            String(
                item.UNINUM || ""
            ).trim(),

        uninum:
            String(
                item.UNINUM || ""
            ).trim(),

        name:
            String(
                item.OFFNAME ||
                item.NAME ||
                "Bank Branch"
            ).trim(),

        bankName:
            String(
                item.NAME || ""
            ).trim(),

        officeNumber:
            String(
                item.OFFNUM || ""
            ).trim(),

        officeName:
            String(
                item.OFFNAME || ""
            ).trim(),

        address:
            String(
                item.ADDRESS || ""
            ).trim(),

        city:
            String(
                item.CITY || ""
            ).trim(),

        state:
            String(
                item.STALP || ""
            ).trim(),

        stateName:
            String(
                item.STNAME || ""
            ).trim(),

        zip:
            String(
                item.ZIP || ""
            ).trim(),

        county:
            String(
                item.COUNTY ||
                item.STCNTY ||
                ""
            ).trim(),

        cert:
            String(
                item.CERT || ""
            ).trim(),

        serviceType:
            String(
                item.SERVTYPE || ""
            ).trim(),

        serviceTypeDescription:
            String(
                item.SERVTYPE_DESC || ""
            ).trim(),

        mainOffice:
            formatMainOffice(
                item.MAINOFF
            ),

        lastUpdated:
            String(
                item.RUNDATE || ""
            ).trim(),

        latitude:
            String(
                item.LATITUDE || ""
            ).trim(),

        longitude:
            String(
                item.LONGITUDE || ""
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

    const allRows = [];

    const limit = 5000;

    let offset = 0;


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


        if (rows.length === 0) {
            break;
        }


        allRows.push(
            ...rows
        );


        if (rows.length < limit) {
            break;
        }


        offset += limit;


        if (offset >= 100000) {
            break;
        }
    }


    return allRows;
}


/* =========================================================
   BUILD CERT SEARCH
========================================================= */

function buildCertSearch(certs) {

    return certs
        .map(
            cert =>
                "CERT:" +
                escapeQuery(
                    cert
                )
        )
        .join(" OR ");
}


/* =========================================================
   PARSE CERTS
========================================================= */

function parseCerts(value) {

    if (!value) {
        return [];
    }


    return String(value)
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(
            item =>
                /^\d+$/.test(
                    item
                )
        );
}


/* =========================================================
   MAIN OFFICE
========================================================= */

function formatMainOffice(value) {

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

function normalizeCity(value) {

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
   QUERY ESCAPE
========================================================= */

function escapeQuery(value) {

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


    if (!response.ok) {

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

function extractRows(result) {

    if (
        !result ||
        !Array.isArray(
            result.data
        )
    ) {
        return [];
    }


    return result.data.map(
        item => {

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
    status = 200,
    maxAge = 300
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

                /*
                 * Bank list can safely be cached
                 * for one hour.
                 */

                "Cache-Control":
                    "public, max-age=" +
                    maxAge,

                /*
                 * Don't index API responses.
                 */

                "X-Robots-Tag":
                    "noindex, nofollow, noarchive",

                "Access-Control-Allow-Origin":
                    "*"
            }
        }
    );
}


/* =========================================================
   HIDE GET BANK DATABASE
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


/* =========================================================
   BRANCH LOCATION
========================================================= */

function formatBranchLocation(branch) {

    const parts = [];


    const address =
        String(
            branch.address || ""
        ).trim();


    const city =
        String(
            branch.city || ""
        ).trim();


    const state =
        String(
            branch.state || ""
        ).trim();


    const zip =
        String(
            branch.zip || ""
        ).trim();


    if (address) {
        parts.push(address);
    }


    const cityStateZip =
        [
            city,
            state,
            zip
        ]
        .filter(Boolean)
        .join(", ");


    if (cityStateZip) {
        parts.push(
            cityStateZip
        );
    }


    return parts.join(
        " | "
    );
}
