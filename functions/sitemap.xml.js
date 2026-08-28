import { pincodes } from "./data/pincodes.js";
import railwayData from "./data/RailwayStationCode.json";
import companyCINs from "./data/AP_AR_AS_AandM_Company_CIN.json";


const BASE_URL = "https://mytecbooks.pages.dev";

const PINCODE_PER_PAGE = 5000;
const RAILWAY_PER_PAGE = 5000;
const COMPANY_PER_PAGE = 5000;


export async function onRequestGet(context) {

    let xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml +=
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


    /*
     * NORMAL WEBSITE PAGES
     */

    xml += sitemapEntry(
        "/sitemap-pages.xml"
    );


    /*
     * PINCODE SITEMAPS
     *
     * Automatically calculate the number
     * of sitemap pages from pincodes.js
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


    const totalPincodePages =
        Math.ceil(
            validPincodes.length /
            PINCODE_PER_PAGE
        );


    for (
        let page = 1;
        page <= totalPincodePages;
        page++
    ) {

        xml += sitemapEntry(
            "/sitemap-pincode-" +
            page +
            ".xml"
        );

    }


    /*
     * RAILWAY STATION SITEMAPS
     *
     * Automatically calculate the number
     * of sitemap pages from RailwayStationCode.json
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


    const totalRailwayPages =
        Math.ceil(
            railwayPages.length /
            RAILWAY_PER_PAGE
        );


    for (
        let page = 1;
        page <= totalRailwayPages;
        page++
    ) {

        xml += sitemapEntry(
            "/sitemap-railway-" +
            page +
            ".xml"
        );

    }


    /*
     * COMPANY CIN SITEMAPS
     *
     * Automatically calculate the number
     * of sitemap pages from
     * AP_AR_AS_AandM_Company_CIN.json
     */

    const companyPages = [

        ...new Set(

            companyCINs

                .map(String)

                .map(function (cin) {

                    return cin
                        .trim()
                        .toUpperCase();

                })

                .filter(function (cin) {

                    return cin.length > 0;

                })

        )

    ];


    const totalCompanyPages =
        Math.ceil(
            companyPages.length /
            COMPANY_PER_PAGE
        );


    for (
        let page = 1;
        page <= totalCompanyPages;
        page++
    ) {

        xml += sitemapEntry(
            "/sitemap-company-" +
            page +
            ".xml"
        );

    }


    /*
     * CLOSE SITEMAP INDEX
     */

    xml += "</sitemapindex>";


    /*
     * RETURN SITEMAP XML
     */

    return new Response(xml, {

        status: 200,

        headers: {

            "Content-Type": "application/xml",

            "Cache-Control": "public, max-age=3600"

        }

    });

}


/*
 * CREATE SITEMAP INDEX ENTRY
 */

function sitemapEntry(path) {

    return (
        "  <sitemap>\n" +
        "    <loc>" +
        BASE_URL +
        path +
        "</loc>\n" +
        "  </sitemap>\n"
    );

}
