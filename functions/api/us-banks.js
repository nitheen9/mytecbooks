const CENSUS_API = "https://api.census.gov/data/2024/acs/acs5";
const FDIC_API = "https://banks.data.fdic.gov/api";

const STATES = [
    ["01", "Alabama", "AL"],
    ["02", "Alaska", "AK"],
    ["04", "Arizona", "AZ"],
    ["05", "Arkansas", "AR"],
    ["06", "California", "CA"],
    ["08", "Colorado", "CO"],
    ["09", "Connecticut", "CT"],
    ["10", "Delaware", "DE"],
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
    ["11", "District of Columbia", "DC"],
    ["72", "Puerto Rico", "PR"]
];


/* =========================================
   MAIN FUNCTION
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

            const state =
                url.searchParams.get("state");

            if (!state) {

                return json(
                    {
                        error:
                            "State is required."
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
                        error:
                            "Invalid state."
                    },
                    400
                );

            }


            const censusState =
                stateInfo[0];


            /*
             * Census "place" geography gives
             * incorporated cities and other
             * Census places.
             */

            const censusUrl =
                new URL(CENSUS_API);


            censusUrl.searchParams.set(
                "get",
                "NAME"
            );

            censusUrl.searchParams.set(
                "for",
                "place:*"
            );

            censusUrl.searchParams.set(
                "in",
                "state:" + censusState
            );


            const response =
                await fetch(
                    censusUrl.toString()
                );


            if (!response.ok) {

                throw new Error(
                    "Census API error: " +
                    response.status
                );

            }


            const rows =
                await response.json();


            const cities = [];


            /*
             * First row contains column names.
             */

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


                /*
                 * Remove Census suffixes such as
                 * " city", " town", " village",
                 * " borough", etc.
                 */

                const city =
                    cleanCityName(name);


                if (
                    city &&
                    !cities.includes(city)
                ) {

                    cities.push(city);

                }

            }


            cities.sort(function (a, b) {

                return a.localeCompare(
                    b,
                    "en",
                    {
                        sensitivity: "base"
                    }
                );

            });


            return json({
                cities: cities
            });

        }


        /* =================================
           BANKS
        ================================= */

        if (type === "banks") {

            const state =
                url.searchParams.get("state");

            const city =
                url.searchParams.get("city");


            if (!state || !city) {

                return json(
                    {
                        error:
                            "State and city are required."
                    },
                    400
                );

            }


            const filter =
                `STALP:${state} AND CITY:"${escapeFilter(city)}"`;


            const data =
                await fdicRequest(
                    "/locations",
                    {
                        filters: filter,
                        fields:
                            "NAME,CERT,CITY,STALP",
                        limit: 10000
                    }
                );


            const bankMap =
                new Map();


            for (
                const item of data.data || []
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


            banks.sort(function (a, b) {

                return a.name.localeCompare(
                    b.name
                );

            });


            return json({
                banks: banks
            });

        }


        /* =================================
           BRANCHES
        ================================= */

        if (type === "branches") {

            const state =
                url.searchParams.get("state");

            const city =
                url.searchParams.get("city");

            const cert =
                url.searchParams.get("cert");


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


            const filter =
                `STALP:${state} AND CITY:"${escapeFilter(city)}" AND CERT:${cert}`;


            const data =
                await fdicRequest(
                    "/locations",
                    {
                        filters: filter,

                        fields:
                            "ID,NAME,OFFNAME,CITY,STALP,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE",

                        limit: 10000
                    }
                );


            const branches = [];


            for (
                const item of data.data || []
            ) {

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


                branches.push({

                    id: id,

                    name:
                        branchName ||
                        "Bank Branch"

                });

            }


            branches.sort(function (a, b) {

                return a.name.localeCompare(
                    b.name
                );

            });


            return json({
                branches: branches
            });

        }


        /* =================================
           BRANCH DETAILS
        ================================= */

        if (type === "branch") {

            const id =
                url.searchParams.get("id");


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
                            `ID:${escapeFilter(id)}`,

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

                    branchType:
                        "Branch / Office",

                    serviceType:
                        item.SERVTYPE || ""

                }

            });

        }


        return json(
            {
                error:
                    "Invalid request type."
            },
            400
        );

    }
    catch (error) {

        console.error(
            "US Bank API Error:",
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


/* =========================================
   FDIC API
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
            "FDIC error:",
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
   CLEAN CITY NAME
========================================= */

function cleanCityName(name) {

    return String(name)
        .replace(/\s+city$/i, "")
        .replace(/\s+town$/i, "")
        .replace(/\s+village$/i, "")
        .replace(/\s+borough$/i, "")
        .replace(/\s+municipality$/i, "")
        .replace(/\s+CDP$/i, "")
        .trim();

}


/* =========================================
   ESCAPE FDIC FILTER
========================================= */

function escapeFilter(value) {

    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');

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
