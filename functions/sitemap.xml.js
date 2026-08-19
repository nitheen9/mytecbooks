```javascript
import { pincodes } from "./data/pincodes.js";
import railwayData from "./data/RailwayStationCode.json";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 800;

// Cloudflare Pages Secret
// Name this secret: DATA_GOV_API_KEY
const DATA_GOV_API_KEY = "DATA_GOV_API_KEY";


export async function onRequestGet(context) {

    const requestUrl = new URL(context.request.url);

    const type = requestUrl.searchParams.get("type");

    const pageParam = requestUrl.searchParams.get("page");


    /*
     * ==========================================
     * NORMAL WEBSITE PAGES
     * ==========================================
     */

    const normalPages = [
        "/"
    ];


    /*
     * ==========================================
     * PINCODE DATA
     * ==========================================
     */

    const validPincodes = [
        ...new Set(
            pincodes
                .map(String)
                .map(pin => pin.trim())
                .filter(pin => /^\d{6}$/.test(pin))
        )
    ];


    /*
     * ==========================================
     * RAILWAY STATION DATA
     * ==========================================
     */

    const railwayPages = [
        ...new Set(
            railwayData
                .map(function (item) {

                    return String(
                        item.station_code || ""
                    )
                        .trim()
                        .toUpperCase();

                })
                .filter(function (code) {

                    return /^[A-Z0-9]{2,6}$/.test(code);

                })
        )
    ];


    /*
     * ==========================================
     * MAIN SITEMAP INDEX
     * ==========================================
     */

    if (!type) {

        let xml =
            `<?xml version="1.0" encoding="UTF-8"?>\n`;

        xml +=
            `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


        /*
         * NORMAL PAGES
         */

        xml += `  <sitemap>\n`;

        xml +=
            `    <loc>${BASE_URL}/sitemap.xml?type=pages&amp;page=1</loc>\n`;

        xml += `  </sitemap>\n`;


        /*
         * PINCODE SITEMAPS
         */

        const pincodeTotalPages =
            Math.ceil(
                validPincodes.length / PER_PAGE
            );


        for (
            let page = 1;
            page <= pincodeTotalPages;
            page++
        ) {

            xml += `  <sitemap>\n`;

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=pincode&amp;page=${page}</loc>\n`;

            xml += `  </sitemap>\n`;

        }


        /*
         * RAILWAY SITEMAPS
         */

        const railwayTotalPages =
            Math.ceil(
                railwayPages.length / PER_PAGE
            );


        for (
            let page = 1;
            page <= railwayTotalPages;
            page++
        ) {

            xml += `  <sitemap>\n`;

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=railway&amp;page=${page}</loc>\n`;

            xml += `  </sitemap>\n`;

        }


        /*
         * ==========================================
         * COMPANY SITEMAPS
         * ==========================================
         *
         * Company data is loaded from data.gov.in.
         *
         * Only:
         *
         * CompanyStatus = Active
         *
         * is included.
         */

        try {

            const companyTotal =
                await getActiveCompanyTotal(context);


            const companyTotalPages =
                Math.ceil(
                    companyTotal / PER_PAGE
                );


            for (
                let page = 1;
                page <= companyTotalPages;
                page++
            ) {

                xml += `  <sitemap>\n`;

                xml +=
                    `    <loc>${BASE_URL}/sitemap.xml?type=company&amp;page=${page}</loc>\n`;

                xml += `  </sitemap>\n`;

            }

        } catch (error) {

            console.error(
                "Company sitemap index error:",
                error
            );

        }


        xml += `</sitemapindex>`;


        return new Response(xml, {

            status: 200,

            headers: {

                "Content-Type":
                    "application/xml; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=86400"

            }

        });

    }


    /*
     * ==========================================
     * NORMAL PAGES
     * ==========================================
     */

    if (type === "pages") {

        if (pageParam !== "1") {

            return new Response(
                "Sitemap page not found",
                {
                    status: 404
                }
            );

        }

        return createUrlSitemap(
            normalPages
        );

    }


    /*
     * ==========================================
     * PINCODE SITEMAP
     * ==========================================
     */

    if (type === "pincode") {

        const page =
            parseInt(pageParam, 10);


        const totalPages =
            Math.ceil(
                validPincodes.length / PER_PAGE
            );


        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > totalPages
        ) {

            return new Response(
                "Sitemap page not found",
                {
                    status: 404
                }
            );

        }


        const start =
            (page - 1) * PER_PAGE;


        const pagePincodes =
            validPincodes.slice(
                start,
                start + PER_PAGE
            );


        const urls =
            pagePincodes.map(
                function (pin) {

                    return `/pincode/${pin}/`;

                }
            );


        return createUrlSitemap(urls);

    }


    /*
     * ==========================================
     * RAILWAY STATION SITEMAP
     * ==========================================
     */

    if (type === "railway") {

        const page =
            parseInt(pageParam, 10);


        const totalPages =
            Math.ceil(
                railwayPages.length / PER_PAGE
            );


        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > totalPages
        ) {

            return new Response(
                "Sitemap page not found",
                {
                    status: 404
                }
            );

        }


        const start =
            (page - 1) * PER_PAGE;


        const pageRailway =
            railwayPages.slice(
                start,
                start + PER_PAGE
            );


        const urls =
            pageRailway.map(
                function (code) {

                    return `/railway/${code}/`;

                }
            );


        return createUrlSitemap(urls);

    }


    /*
     * ==========================================
     * COMPANY SITEMAP
     * ==========================================
     *
     * Example:
     *
     * /sitemap.xml?type=company&page=1
     *
     * Returns:
     *
     * /company/CIN1/
     * /company/CIN2/
     * /company/CIN3/
     */

    if (type === "company") {

        const page =
            parseInt(pageParam, 10);


        if (
            !Number.isInteger(page) ||
            page < 1
        ) {

            return new Response(
                "Sitemap page not found",
                {
                    status: 404
                }
            );

        }


        const start =
            (page - 1) * PER_PAGE;


        try {

            const records =
                await getActiveCompanies(
                    context,
                    start,
                    PER_PAGE
                );


            if (
                !records ||
                records.length === 0
            ) {

                return new Response(
                    "Sitemap page not found",
                    {
                        status: 404
                    }
                );

            }


            const urls = [];


            for (const company of records) {

                const cin =
                    String(
                        company.CIN || ""
                    )
                        .trim()
                        .toUpperCase();


                if (!cin) {
                    continue;
                }


                /*
                 * Extra safety check.
                 *
                 * Only Active companies
                 * are allowed in sitemap.
                 */

                const status =
                    String(
                        company.CompanyStatus || ""
                    )
                        .trim()
                        .toLowerCase();


                if (status !== "active") {
                    continue;
                }


                urls.push(
                    `/company/${encodeURIComponent(cin)}/`
                );

            }


            if (urls.length === 0) {

                return new Response(
                    "Sitemap page not found",
                    {
                        status: 404
                    }
                );

            }


            return createUrlSitemap(urls);

        } catch (error) {

            console.error(
                "Company sitemap error:",
                error
            );


            return new Response(
                "Unable to create company sitemap",
                {
                    status: 500
                }
            );

        }

    }


    /*
     * ==========================================
     * UNKNOWN TYPE
     * ==========================================
     */

    return new Response(
        "Sitemap not found",
        {
            status: 404
        }
    );

}


/*
 * ==========================================
 * GET ACTIVE COMPANY TOTAL
 * ==========================================
 */

async function getActiveCompanyTotal(context) {

    const apiKey =
        context.env[DATA_GOV_API_KEY];


    if (!apiKey) {

        throw new Error(
            "DATA_GOV_API_KEY secret is not configured"
        );

    }


    const apiUrl =
        new URL(
            "https://api.data.gov.in/resource/4dbe5667-7b6b-41d7-82af-211562424d9a"
        );


    apiUrl.searchParams.set(
        "api-key",
        apiKey
    );


    apiUrl.searchParams.set(
        "format",
        "json"
    );


    apiUrl.searchParams.set(
        "limit",
        "1"
    );


    apiUrl.searchParams.set(
        "offset",
        "0"
    );


    apiUrl.searchParams.set(
        "filters[CompanyStatus]",
        "Active"
    );


    const response =
        await fetch(
            apiUrl.toString()
        );


    if (!response.ok) {

        throw new Error(
            `Data.gov API returned ${response.status}`
        );

    }


    const data =
        await response.json();


    return Number(
        data.total || 0
    );

}


/*
 * ==========================================
 * GET ACTIVE COMPANIES
 * ==========================================
 */

async function getActiveCompanies(
    context,
    offset,
    limit
) {

    const apiKey =
        context.env[DATA_GOV_API_KEY];


    if (!apiKey) {

        throw new Error(
            "DATA_GOV_API_KEY secret is not configured"
        );

    }


    const apiUrl =
        new URL(
            "https://api.data.gov.in/resource/4dbe5667-7b6b-41d7-82af-211562424d9a"
        );


    apiUrl.searchParams.set(
        "api-key",
        apiKey
    );


    apiUrl.searchParams.set(
        "format",
        "json"
    );


    apiUrl.searchParams.set(
        "limit",
        String(limit)
    );


    apiUrl.searchParams.set(
        "offset",
        String(offset)
    );


    /*
     * IMPORTANT:
     *
     * Only Active companies.
     */

    apiUrl.searchParams.set(
        "filters[CompanyStatus]",
        "Active"
    );


    const response =
        await fetch(
            apiUrl.toString()
        );


    if (!response.ok) {

        throw new Error(
            `Data.gov API returned ${response.status}`
        );

    }


    const data =
        await response.json();


    return Array.isArray(data.records)
        ? data.records
        : [];

}


/*
 * ==========================================
 * CREATE URL SITEMAP
 * ==========================================
 */

function createUrlSitemap(paths) {

    let xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n`;


    xml +=
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


    for (const path of paths) {

        xml += `  <url>\n`;

        xml +=
            `    <loc>${escapeXml(
                BASE_URL + path
            )}</loc>\n`;

        xml += `  </url>\n`;

    }


    xml += `</urlset>`;


    return new Response(xml, {

        status: 200,

        headers: {

            "Content-Type":
                "application/xml; charset=UTF-8",

            "Cache-Control":
                "public, max-age=86400"

        }

    });

}


/*
 * ==========================================
 * XML ESCAPE
 * ==========================================
 */

function escapeXml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&apos;"
        );

}
```
