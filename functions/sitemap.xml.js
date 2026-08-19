```javascript
import { pincodes } from "./data/pincodes.js";
import railwayData from "./data/RailwayStationCode.json";
import companyCINs from "./data/AP_AR_AS_AandM_Company_CIN.json";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 800;


/*
 * ==========================================
 * MAIN GET
 * ==========================================
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
    ];


    /*
     * ==========================================
     * PINCODES
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
     * RAILWAY STATIONS
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
     * COMPANY CIN
     * ==========================================
     *
     * JSON format:
     *
     * [
     *   "AAA-0396",
     *   "U70101AS1998PTC005556",
     *   "U70101AS1998PTC005566"
     * ]
     *
     */

    const companyPages = [
        ...new Set(
            companyCINs
                .map(String)
                .map(function (cin) {
                    return cin.trim().toUpperCase();
                })
                .filter(function (cin) {
                    return cin.length > 0;
                })
        )
    ];


    /*
     * ==========================================
     * MAIN SITEMAP INDEX
     * ==========================================
     *
     * /sitemap.xml
     */

    if (!type) {

        let xml = "";

        xml += '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';


        /*
         * NORMAL PAGES
         */

        xml += "<sitemap>";

        xml += "<loc>";
        xml += BASE_URL;
        xml += "/sitemap.xml?type=pages&amp;page=1";
        xml += "</loc>";

        xml += "</sitemap>";


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

            xml += "<sitemap>";

            xml += "<loc>";
            xml += BASE_URL;
            xml += "/sitemap.xml?type=pincode&amp;page=";
            xml += page;
            xml += "</loc>";

            xml += "</sitemap>";
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

            xml += "<sitemap>";

            xml += "<loc>";
            xml += BASE_URL;
            xml += "/sitemap.xml?type=railway&amp;page=";
            xml += page;
            xml += "</loc>";

            xml += "</sitemap>";
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

            xml += "<sitemap>";

            xml += "<loc>";
            xml += BASE_URL;
            xml += "/sitemap.xml?type=company&amp;page=";
            xml += page;
            xml += "</loc>";

            xml += "</sitemap>";
        }


        xml += "</sitemapindex>";


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

                    return "/pincode/" + pin + "/";

                }
            );


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
            pageRailway.map(
                function (code) {

                    return "/railway/" + code + "/";

                }
            );


        return createUrlSitemap(urls);
    }


    /*
     * ==========================================
     * COMPANY CIN SITEMAP
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
            pageCompanies.map(
                function (cin) {

                    return "/company/" + cin + "/";

                }
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

    let xml = "";

    xml += '<?xml version="1.0" encoding="UTF-8"?>';

    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';


    for (const path of paths) {

        xml += "<url>";

        xml += "<loc>";

        xml += escapeXml(
            BASE_URL + path
        );

        xml += "</loc>";

        xml += "</url>";
    }


    xml += "</urlset>";


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
