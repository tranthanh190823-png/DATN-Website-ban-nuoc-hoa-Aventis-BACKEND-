import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchImage(query) {
    try {
        const res = await axios.get(`https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        const firstImg = $('#sres .ld a').first();
        if (firstImg.length > 0) {
            const dataUrl = firstImg.attr('data-rurl');
            if (dataUrl) return dataUrl;
            
            const rawHtml = firstImg.html();
            const imgUrlMatch = rawHtml.match(/src='([^']+)'/);
            if (imgUrlMatch) return imgUrlMatch[1];
        }
    } catch (e) {
        console.error("Error fetching", e.message);
    }
    return null;
}

async function test() {
    console.log("Searching for Chanel Coco Mademoiselle...");
    const url = await fetchImage("Chanel Coco Mademoiselle perfume bottle");
    console.log("Found URL:", url);
}

test();
