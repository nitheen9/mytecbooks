import { pincodes } from "./data/pincodes.js";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 5000;

export async function onRequestGet(context) {

    /*
     * Get page number from URL
     *
     * Example:
     * /sitemap-pincode-1.xml
     */
    const pageParam = context.params.page;

    const page = parseInt(pageParam, 10);


    /*
     * Validate page number
     */
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


    /*
     * Clean pincode data
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
     * Calculate total sitemap pages
     */
    const totalPages =
        Math.ceil(
            validPincodes.length / PER_PAGE
        );


    /*
     * Check requested page
     */
    if (page > totalPages) {

        return new Response(
            "Sitemap page not found",
            {
                status: 404
            }
        );

    }


    /*
     * Get this page's pincodes
     */
    const start =
        (page - 1) * PER_PAGE;


    const pagePincodes =
        validPincodes.slice(
            start,
            start + PER_PAGE
        );


    /*
     * Create XML
     */
    let xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml +=
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


    for (const pin of pagePincodes) {

        xml += "  <url>\n";

        xml +=
            "    <loc>" +
            BASE_URL +
            "/pincode/" +
            pin +
            "/</loc>\n";

        xml += "  </url>\n";

    }


    xml += "</urlset>";


    return new Response(xml, {

        status: 200,

        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
        }

    });

}
