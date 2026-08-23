export async function onRequest(context) {

    const requestUrl = new URL(context.request.url);

    const query =
        (requestUrl.searchParams.get("q") || "")
        .trim();

    if (query.length < 2) {

        return jsonResponse({
            query: query,
            results: []
        });

    }

    /*
     * Normalize the search.
     *
     * This fixes:
     * software
     * Software
     * SOFTWARE
     *
     * and removes extra spaces.
     */

    const normalizedQuery =
        query
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();


    /*
     * Built-in 2022 U.S. NAICS search data.
     */

    const data =
        getNAICSData();


    const results =
        data
            .filter(function(item) {

                const code =
                    String(item.code || "")
                    .toLowerCase();

                const title =
                    String(item.title || "")
                    .toLowerCase();

                const description =
                    String(item.description || "")
                    .toLowerCase();

                return (
                    code.includes(normalizedQuery) ||
                    title.includes(normalizedQuery) ||
                    description.includes(normalizedQuery)
                );

            })
            .slice(0, 50);


    return jsonResponse({

        query: query,

        results: results.map(function(item) {

            return {

                code: item.code,

                title: item.title

            };

        })

    });

}


/* =========================================
   NAICS DATA
========================================= */

function getNAICSData() {

    return [

        {
            code: "541511",
            title: "Custom Computer Programming Services",
            description:
                "Custom computer programming services"
        },

        {
            code: "541512",
            title: "Computer Systems Design Services",
            description:
                "Computer systems design services"
        },

        {
            code: "541513",
            title: "Computer Facilities Management Services",
            description:
                "Computer facilities management services"
        },

        {
            code: "541519",
            title: "Other Computer Related Services",
            description:
                "Other computer related services"
        },

        {
            code: "511210",
            title: "Software Publishers",
            description:
                "Software publishers"
        },

        {
            code: "518210",
            title: "Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services",
            description:
                "Computing infrastructure providers data processing web hosting and related services"
        },

        {
            code: "541330",
            title: "Engineering Services",
            description:
                "Engineering services"
        },

        {
            code: "541110",
            title: "Offices of Lawyers",
            description:
                "Legal services"
        },

        {
            code: "522110",
            title: "Commercial Banking",
            description:
                "Commercial banking and banking services"
        },

        {
            code: "522120",
            title: "Savings Institutions",
            description:
                "Savings institutions and banking"
        },

        {
            code: "236115",
            title: "New Single-Family Housing Construction",
            description:
                "Construction of new single family housing"
        },

        {
            code: "236116",
            title: "New Multifamily Housing Construction",
            description:
                "Construction of new multifamily housing"
        },

        {
            code: "236220",
            title: "Commercial and Institutional Building Construction",
            description:
                "Commercial and institutional building construction"
        },

        {
            code: "237110",
            title: "Water and Sewer Line and Related Structures Construction",
            description:
                "Water and sewer line construction"
        },

        {
            code: "237310",
            title: "Highway, Street, and Bridge Construction",
            description:
                "Highway street and bridge construction"
        },

        {
            code: "111110",
            title: "Soybean Farming",
            description:
                "Soybean farming"
        },

        {
            code: "111120",
            title: "Oilseed (Except Soybean) Farming",
            description:
                "Oilseed farming"
        },

        {
            code: "111130",
            title: "Dry Pea and Bean Farming",
            description:
                "Dry pea and bean farming"
        },

        {
            code: "111140",
            title: "Wheat Farming",
            description:
                "Wheat farming"
        },

        {
            code: "111150",
            title: "Corn Farming",
            description:
                "Corn farming"
        },

        {
            code: "111199",
            title: "All Other Grain Farming",
            description:
                "Other grain farming"
        },

        {
            code: "445110",
            title: "Supermarkets and Other Grocery Retailers",
            description:
                "Grocery stores supermarkets grocery retail"
        },

        {
            code: "445131",
            title: "Convenience Retailers",
            description:
                "Convenience stores"
        },

        {
            code: "621111",
            title: "Offices of Physicians (except Mental Health Specialists)",
            description:
                "Physicians offices healthcare medical services"
        },

        {
            code: "621112",
            title: "Offices of Physicians, Mental Health Specialists",
            description:
                "Mental health physician services"
        },

        {
            code: "621210",
            title: "Offices of Dentists",
            description:
                "Dental offices dentist services"
        },

        {
            code: "721110",
            title: "Hotels (except Casino Hotels) and Motels",
            description:
                "Hotels motels accommodation lodging"
        },

        {
            code: "722511",
            title: "Full-Service Restaurants",
            description:
                "Restaurants food service dining"
        },

        {
            code: "722513",
            title: "Limited-Service Restaurants",
            description:
                "Restaurants fast food food service"
        },

        {
            code: "531120",
            title: "Lessors of Nonresidential Buildings (except Miniwarehouses)",
            description:
                "Commercial real estate property rental"
        },

        {
            code: "531210",
            title: "Offices of Real Estate Agents and Brokers",
            description:
                "Real estate agents brokers property services"
        }

    ];

}


/* =========================================
   JSON RESPONSE
========================================= */

function jsonResponse(data) {

    return new Response(

        JSON.stringify(data),

        {

            status: 200,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );

}
