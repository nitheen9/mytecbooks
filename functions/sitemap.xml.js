export async function onRequestGet(context) {

    const baseUrl = "https://mytecbooks.pages.dev";

    /*
     * Generate Pincode URLs.
     *
     * IMPORTANT:
     * Change these numbers to the range you want indexed.
     *
     * Example below generates:
     * 521000
     * 521001
     * ...
     * 521999
     */

    const start = 521000;
    const end = 521999;

    let urls = "";

    for (let pin = start; pin <= end; pin++) {

        const pincode = String(pin);

        urls += `
    <url>
        <loc>${baseUrl}/pincode/${pincode}/</loc>
    </url>`;
    }


    const xml = `<?xml version="1.0" encoding="UTF-8"?>

<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <url>
        <loc>${baseUrl}/</loc>
    </url>

    ${urls}

</urlset>`;


    return new Response(xml, {

        status: 200,

        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
        }

    });
}
