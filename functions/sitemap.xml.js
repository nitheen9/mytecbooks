```javascript
import { pincodes } from "./data/pincodes.js";
import railwayData from "./data/RailwayStationCode.json";
import companyCins from "./data/AP_AR_AS_AandM_Company_CIN.json";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 800;


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
     * JSON example:
     *
     * [
     *   "AAA-0396",
     *   "AAA-1262",
     *   "U70101AS1998PTC005556",
     *   "U70101AS1998PTC005566"
     * ]
     *
     */

    const companyPages = [
        ...new Set(
            companyCins
                .map(String)
                .map(function (cin) {
                    return cin.trim().toUpperCase();
                })
                .filter(function (cin) {

                    return /^[A-Z0-9-]{5,30}$/.test(cin);

                })
        )
    ];


    /*
     * ==========================================
     * FUTURE IFSC DATA
     * ==========================================
     *
     * Add your IFSC JSON later.
     */

    const ifscPages = [];


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
         * NORMAL PAGES
         */

        xml += '  <sitemap>\n';

        xml +=
            `    <loc>${BASE_URL}/sitemap.xml?type=pages&amp;page=1</loc>\n`;

        xml += '  </sitemap>\n';


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

            xml += '  <sitemap>\n';

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=pincode&amp;page=${page}</loc>\n`;

            xml += '  </sitemap>\n';

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

            xml += '  <sitemap>\n';

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?type=railway&amp;page=${page}</loc>\n`;

            xml += '  </sitemap>\n';

        }


        /*
         * COMPANY SITEMAPS
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
         * IFSC SITEMAPS
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
            pagePincodes.map(function (pin) {

                return `/pincode/${pin}/`;

            });


        return createUrlSitemap(urls);

    }


    /*
     * ==========================================
     * RAILWAY SITEMAP
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
            pageRailway.map(function (code) {

                return `/railway/${code}/`;

            });


        return createUrlSitemap(urls);

    }


    /*
     * ==========================================
     * COMPANY SITEMAP
     * ==========================================
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
            pageCompanies.map(function (cin) {

                return `/company/${cin}/`;

            });


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
