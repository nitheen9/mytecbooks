export async function onRequestGet(context) {

    const cin = String(context.params.cin || "")
        .trim()
        .toUpperCase();

    return new Response(
        "COMPANY FUNCTION WORKING: " + cin,
        {
            status: 200,
            headers: {
                "content-type": "text/plain; charset=UTF-8",
                "cache-control": "no-store"
            }
        }
    );
}
