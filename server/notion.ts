import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract page ID");
}

export const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL!);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    // Array to store the child databases
    const childDatabases = [];

    try {
        // Query all child blocks in the specified page
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            // Process the results
            for (const block of response.results) {
                // Check if the block is a child database
                if ('type' in block && block.type === "child_database") {
                    const databaseId = block.id;

                    // Retrieve the database title
                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        // Add the database to our list
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            // Check if there are more results to fetch
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if ('title' in db && db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// Get all blog posts from the Notion database
export async function getBlogPosts(blogDatabaseId: string) {
    try {
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
            sorts: [
                {
                    property: "Published Date",
                    direction: "descending"
                }
            ]
        });

        return response.results.map((page: any) => {
            const properties = page.properties;

            const publishedDate = properties["Published Date"]?.date?.start
                ? new Date(properties["Published Date"].date.start)
                : null;

            const createdDate = properties["Created Date"]?.created_time
                ? new Date(properties["Created Date"].created_time)
                : new Date(page.created_time);

            // Extract tags from multi-select
            const tags = properties.Tags?.multi_select?.map((tag: any) => tag.name) || [];

            return {
                id: page.id,
                title: properties.Title?.title?.[0]?.plain_text || "Untitled Post",
                slug: properties.Slug?.rich_text?.[0]?.plain_text || "",
                excerpt: properties.Excerpt?.rich_text?.[0]?.plain_text || "",
                category: properties.Category?.select?.name || "General",
                tags,
                status: properties.Status?.select?.name || "Draft",
                publishedAt: publishedDate,
                createdAt: createdDate,
                metaTitle: properties["Meta Title"]?.rich_text?.[0]?.plain_text || "",
                metaDescription: properties["Meta Description"]?.rich_text?.[0]?.plain_text || "",
                readTime: properties["Read Time"]?.number || 5,
                views: properties.Views?.number || 0,
                likes: properties.Likes?.number || 0,
                notionPageId: page.id
            };
        });
    } catch (error) {
        console.error("Error fetching blog posts from Notion:", error);
        throw new Error("Failed to fetch blog posts from Notion");
    }
}

// Get page content from Notion
export async function getPageContent(pageId: string) {
    try {
        const response = await notion.blocks.children.list({
            block_id: pageId,
        });

        return response.results;
    } catch (error) {
        console.error("Error fetching page content:", error);
        throw new Error("Failed to fetch page content");
    }
}

// Convert Notion blocks to Markdown
export function convertBlocksToMarkdown(blocks: any[]): string {
    let markdown = "";

    for (const block of blocks) {
        switch (block.type) {
            case "paragraph":
                const text = block.paragraph?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += text + "\n\n";
                break;
            case "heading_1":
                const h1Text = block.heading_1?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += `# ${h1Text}\n\n`;
                break;
            case "heading_2":
                const h2Text = block.heading_2?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += `## ${h2Text}\n\n`;
                break;
            case "heading_3":
                const h3Text = block.heading_3?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += `### ${h3Text}\n\n`;
                break;
            case "bulleted_list_item":
                const bulletText = block.bulleted_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += `- ${bulletText}\n`;
                break;
            case "numbered_list_item":
                const numberedText = block.numbered_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += `1. ${numberedText}\n`;
                break;
            case "code":
                const codeText = block.code?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                const language = block.code?.language || "";
                markdown += `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
                break;
            case "quote":
                const quoteText = block.quote?.rich_text?.map((t: any) => t.plain_text).join("") || "";
                markdown += `> ${quoteText}\n\n`;
                break;
            default:
                // Handle other block types as plain text
                if (block[block.type]?.rich_text) {
                    const plainText = block[block.type].rich_text.map((t: any) => t.plain_text).join("");
                    if (plainText.trim()) {
                        markdown += plainText + "\n\n";
                    }
                }
                break;
        }
    }

    return markdown.trim();
}