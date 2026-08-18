import { pincodes } from "./data/pincodes.js";

const BASE_URL = "https://mytecbooks.pages.dev";
const PER_PAGE = 800;

export async function onRequestGet(context) {

    const requestUrl = new URL(context.request.url);

    const type = requestUrl.searchParams.get("type");
    const pageParam = requestUrl.searchParams.get("page");

    /*
     * ==========================================
     * NORMAL WEBSITE PAGES / POSTS
     * ==========================================
     *
     * Add your normal pages here.
     *
     * Later we can make this automatic too.
     */

    const normalPages = [
        "/"
        // "/about/",
        // "/contact/",
        // "/post/example/"
    ];


    /*
     * ==========================================
     * PINCODE URLS
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
     * FUTURE IFSC URLS
     * ==========================================
     *
     * Leave empty for now.
     *
     * Later we can connect your IFSC data here.
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
     * MAIN SITEMAP
     * ==========================================
     *
     * /sitemap.xml
     *
     * Shows separate sitemap categories.
     */

    if (!type) {

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

        xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


        // Normal pages sitemap
        xml += `  <sitemap>\n`;
        xml += `    <loc>${BASE_URL}/sitemap.xml?type=pages&amp;page=1</loc>\n`;
        xml += `  </sitemap>\n`;


        // Pincode sitemap pages
        const pincodePages = Math.ceil(
            validPincodes.length / PER_PAGE
        );

        for (let page = 1; page <= pincodePages; page++) {

            xml += `  <sitemap>\n`;

            xml += `    <loc>${BASE_URL}/sitemap.xml?type=pincode&amp;page=${page}</loc>\n`;

            xml += `  </sitemap>\n`;
        }


        // IFSC sitemap
        if (ifscPages.length > 0) {

            const ifscTotalPages = Math.ceil(
                ifscPages.length / PER_PAGE
            );

            for (
                let page = 1;
                page <= ifscTotalPages;
                page++
            ) {

                xml += `  <sitemap>\n`;

                xml += `    <loc>${BASE_URL}/sitemap.xml?type=ifsc&amp;page=${page}</loc>\n`;

                xml += `  </sitemap>\n`;
            }
        }


        // Other data
        if (otherPages.length > 0) {

            const otherTotalPages = Math.ceil(
                otherPages.length / PER_PAGE
            );

            for (
                let page = 1;
                page <= otherTotalPages;
                page++
            ) {

                xml += `  <sitemap>\n`;

                xml += `    <loc>${BASE_URL}/sitemap.xml?type=other&amp;page=${page}</loc>\n`;

                xml += `  </sitemap>\n`;
            }
        }


        xml += `</sitemapindex>`;


        return new Response(xml, {
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
                { status: 404 }
            );
        }

        return createUrlSitemap(normalPages);
    }


    /*
     * ==========================================
     * PINCODE SITEMAP
     * ==========================================
     */

    if (type === "pincode") {

        const page = parseInt(pageParam, 10);

        const totalPages = Math.ceil(
            validPincodes.length / PER_PAGE
        );

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > totalPages
        ) {

            return new Response(
                "Sitemap page not found",
                { status: 404 }
            );
        }


        const start =
            (page - 1) * PER_PAGE;


        const pagePincodes =
            validPincodes.slice(
                start,
                start + PER_PAGE
            );


        const urls = pagePincodes.map(
            pin => `/pincode/${pin}/`
        );


        return createUrlSitemap(urls);
    }


    /*
     * ==========================================
     * IFSC SITEMAP
     * ==========================================
     */

    if (type === "ifsc") {

        const page = parseInt(pageParam, 10);

        const totalPages = Math.ceil(
            ifscPages.length / PER_PAGE
        );

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > totalPages
        ) {

            return new Response(
                "Sitemap page not found",
                { status: 404 }
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

        const page = parseInt(pageParam, 10);

        const totalPages = Math.ceil(
            otherPages.length / PER_PAGE
        );

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > totalPages
        ) {

            return new Response(
                "Sitemap page not found",
                { status: 404 }
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


    return new Response(
        "Sitemap not found",
        { status: 404 }
    );
}


/*
 * ==========================================
 * CREATE XML SITEMAP
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
            `    <loc>${BASE_URL}${path}</loc>\n`;

        xml += `  </url>\n`;
    }


    xml += `</urlset>`;


    return new Response(xml, {
        headers: {
            "Content-Type":
                "application/xml; charset=UTF-8",

            "Cache-Control":
                "public, max-age=86400"
        }
    });
}
