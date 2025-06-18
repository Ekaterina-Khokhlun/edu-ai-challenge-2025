require('dotenv').config();
const OpenAI = require('openai');
const readlineSync = require('readline-sync');
const fs = require('fs');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load products data
const productsData = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// Function to format product for display
function formatProduct(product) {
    return `${product.name} - $${product.price}, Rating: ${product.rating}, ${product.in_stock ? 'In Stock' : 'Out of Stock'}`;
}

async function searchProducts(userQuery) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that filters products based on user preferences. Return only the IDs of matching products as a comma-separated list."
                },
                {
                    role: "user",
                    content: `Here are the products:
${productsData.products.map(p => `ID ${p.id}: ${p.name} - Category: ${p.category}, Price: $${p.price}, Rating: ${p.rating}, ${p.in_stock ? 'In Stock' : 'Out of Stock'}`).join('\n')}

User query: "${userQuery}"

Return only the IDs of matching products as a comma-separated list, for example: "1,3,5" or "none" if no matches found.`
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        const response = completion.choices[0].message.content.trim();
        
        if (response.toLowerCase() === 'none') {
            console.log('\nNo matching products found.');
            return;
        }

        const matchingIds = response.split(',').map(id => parseInt(id.trim()));
        const filteredProducts = productsData.products.filter(p => matchingIds.includes(p.id));

        console.log('\nFiltered Products:');
        filteredProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${formatProduct(product)}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Main program loop
async function main() {
    console.log('Welcome to Product Search Tool!');
    console.log('Enter your search query in natural language (e.g., "I need a smartphone under $800 with a great camera")');
    console.log('Type "exit" to quit\n');

    while (true) {
        const query = readlineSync.question('Enter your search query: ');
        
        if (query.toLowerCase() === 'exit') {
            console.log('Thank you for using Product Search Tool!');
            break;
        }

        await searchProducts(query);
        console.log('\n-------------------\n');
    }
}

main().catch(console.error); 