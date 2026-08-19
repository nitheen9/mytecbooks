```javascript
import { pincodes } from "./data/pincodes.js";
import railwayData from "./data/RailwayStationCode.json";
import companyCins from "./data/AP_AR_AS_AandM_Company_CIN.json";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 800;


/*
 * ==========================================
 * MAIN SITEMAP FUNCTION
 * ==========================================
 *
 * /sitemap.xml
 *
 * Sitemap types:
 *
 * pages
 * pincode
 * railway
 * company
 *
 * Future:
 * ifsc
 */


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
        // "/about/",
        // "/contact/"
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
                .map(function (pin) {
                    return pin.trim();
                })
                .filter(function (pin) {
                    return /^\d{6}$/.test(pin);
                })
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
     * COMPANY CIN DATA
     * ==========================================
     *
     * JSON can be:
     *
     * [
     *   "U12345AP2020PTC123456",
     *   "U12345AR2021PTC123457"
     * ]
     *
     * OR:
     *
     * [
     *   {"CIN":"U12345AP2020PTC123456"}
     * ]
     *
     * Both formats are supported.
     */

    const companyPages = [
        ...new Set(

            companyCins

                .map(function (item) {

                    if (
                        typeof item === "string"
                    ) {
                        return item;
                    }

                    if (
                        item &&
                        typeof item === "object"
                    ) {
                        return item.CIN || "";
                    }

                    return "";

                })

                .map(function (cin) {

                    return String(cin)
                        .trim()
                        .toUpperCase();

                })

                .filter(function (cin) {

                    /*
                     * CIN normally contains:
                     *
                     * 21 characters
                     *
                     * Example:
                     * U12345AP2020PTC123456
                     *
                     * Also allow LLP-style
                     * / other valid alphanumeric
                     * CIN-like identifiers.
                     */

                    return /^[A-Z0-9-]{5,30}$/.test(cin);

                })

        )
    ];


    /*
     * ==========================================
     * FUTURE IFSC DATA
     * ==========================================
     *
     * Tomorrow you can connect your
     * complete IFSC JSON here.
     */

    const ifscPages = [];


    /*
     * ==========================================
     * FUTURE OTHER DATA
     * ==========================================
     */

    const otherPages = [];


    /*
     * ==========================================
     * MAIN SITEMAP INDEX
     * ==========================================
     *
     * /sitemap.xml
     */

    if (!type) {

        let xml =
            '<?xml version="1.0" encoding="UTF-8"?>\n';

        xml +=
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


        /*
         * ==========================================
         * NORMAL PAGES
         * ==========================================
         */

        xml += '  <sitemap>\n';

        xml +=
            `    <loc>${BASE_URL}/sitemap.xml?type=pages&amp;page=1</loc>\n`;

        xml += '  </sitemap>\n';


        /*
         * ==========================================
         * PINCODE SITEMAPS
         * ==========================================
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

            xml += '  <sitemap>\n';

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=pincode&amp;page=${page}</loc>\n`;

            xml += '  </sitemap>\n';

        }


        /*
         * ==========================================
         * RAILWAY SITEMAPS
         * ==========================================
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

            xml += '  <sitemap>\n';

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=railway&amp;page=${page}</loc>\n`;

            xml += '  </sitemap>\n';

        }


        /*
         * ==========================================
         * COMPANY SITEMAPS
         * ==========================================
         */

        const companyTotalPages =
            Math.ceil(
                companyPages.length / PER_PAGE
            );


        for (
            let page = 1;
            page <= companyTotalPages;
            page++
        ) {

            xml += '  <sitemap>\n';

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=company&amp;page=${page}</loc>\n`;

            xml += '  </sitemap>\n';

        }


        /*
         * ==========================================
         * IFSC SITEMAPS
         * ==========================================
         */

        if (ifscPages.length > 0) {

            const ifscTotalPages =
                Math.ceil(
                    ifscPages.length / PER_PAGE
                );


            for (
                let page = 1;
                page <= ifscTotalPages;
                page++
            ) {

                xml += '  <sitemap>\n';

                xml +=
                    `    <loc>${BASE_URL}/sitemap.xml?type=ifsc&amp;page=${page}</loc>\n`;

                xml += '  </sitemap>\n';

            }

        }


        /*
         * ==========================================
         * OTHER DATA
         * ==========================================
         */

        if (otherPages.length > 0) {

            const otherTotalPages =
                Math.ceil(
                    otherPages.length / PER_PAGE
                );


            for (
                let page = 1;
                page <= otherTotalPages;
                page++
            ) {

                xml += '  <sitemap>\n';

                xml +=
                    `    <loc>${BASE_URL}/sitemap.xml?type=other&amp;page=${page}</loc>\n`;

                xml += '  </sitemap>\n';

            }

        }


        xml += '</sitemapindex>';


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
     * /company/CIN/
     */

    if (type === "company") {

        const page =
            parseInt(pageParam, 10);


        const totalPages =
            Math.ceil(
                companyPages.length / PER_PAGE
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


        const pageCompanies =
            companyPages.slice(
                start,
                start + PER_PAGE
            );


        const urls =
            pageCompanies.map(
                function (cin) {

                    return `/company/${encodeURIComponent(cin)}/`;

                }
            );


        return createUrlSitemap(urls);

    }


    /*
     * ==========================================
     * IFSC SITEMAP
     * ==========================================
     */

    if (type === "ifsc") {

        const page =
            parseInt(pageParam, 10);


        const totalPages =
            Math.ceil(
                ifscPages.length / PER_PAGE
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


        const urls =
            ifscPages.slice(
                start,
                start + PER_PAGE
            );


        return createUrlSitemap(urls);

    }


    /*
     * ==========================================
     * OTHER DATA
     * ==========================================
     */

    if (type === "other") {

        const page =
            parseInt(pageParam, 10);


        const totalPages =
            Math.ceil(
                otherPages.length / PER_PAGE
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


        const urls =
            otherPages.slice(
                start,
                start + PER_PAGE
            );


        return createUrlSitemap(urls);

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
 * CREATE URL SITEMAP
 * ==========================================
 */

function createUrlSitemap(paths) {

    let xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml +=
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


    for (const path of paths) {

        xml += '  <url>\n';

        xml +=
            `    <loc>${escapeXml(
                BASE_URL + path
            )}</loc>\n`;

        xml += '  </url>\n';

    }


    xml += '</urlset>';


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

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

}
```
