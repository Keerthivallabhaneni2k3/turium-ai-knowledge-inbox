
const cheerio = require("cheerio");

const extractUrlContent = async (url) => {
  // Validate URL
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL provided.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  if (["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)) {
    throw new Error("Local URLs are not allowed.");
  }

  // Fetch webpage with timeout
  const response = await fetch(parsedUrl, {
    signal: AbortSignal.timeout(30000),
    headers: {
      "User-Agent": "TuriumKnowledgeInbox/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch webpage: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error("The provided URL must point to an HTML webpage.");
  }

  const html = await response.text();

  // Limit content size
  if (html.length > 2_000_000) {
    throw new Error("Webpage is too large to process.");
  }

  // Extract readable text
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg, nav, footer, header").remove();

  const title = $("title").first().text().trim() || parsedUrl.hostname;

  const content = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  if (!content) {
    throw new Error("No readable content found on this webpage.");
  }

  return {
    title,
    content: content.slice(0, 50000),
    url: parsedUrl.href,
  };
};

module.exports = { extractUrlContent };
